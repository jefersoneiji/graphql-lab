import { createGraphQLError } from "graphql-yoga";
import { compare, hash } from 'bcrypt';
import { sign } from "jsonwebtoken";

import { builder } from "../../builder";
import { user } from "./model";

export interface user_interface {
    name: string;
    email: string;
    password: string;
    role: string;
}

export const user_ref = builder.objectRef<user_interface>('user');

user_ref.implement({
    description: 'system user',
    fields: t => ({
        name: t.exposeString('name', { nullable: false, description: 'user name' }),
        email: t.exposeString('email', { nullable: false, description: 'user e-mail' }),
        password: t.exposeString('password', { nullable: false, description: 'user password' }),
        role: t.exposeString('role', { nullable: false, description: 'user role' })
    })
});

builder.queryField('user', t =>
    t.field({
        type: public_user_ref,
        authScopes: { $any: { user: true, admin: true } },
        args: {
            email: t.arg.string({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { email } = args;
            const user_found = await user.findOne({ email });
            if (!user_found) throw createGraphQLError('User not found.', { extensions: { http: { status: 404 } } });
            return user_found;
        }
    })
);

export const public_user_ref = builder.objectRef<Omit<user_interface, 'password'>>('public_user');

public_user_ref.implement({
    description: 'public user',
    fields: t => ({
        name: t.exposeString('name', { nullable: false, description: 'user name' }),
        email: t.exposeString('email', { nullable: false, description: 'user e-mail' }),
    })
});

const cookie_fields = (value: string) => ({
    name: 'session_id',
    value,
    // secure: false,
    sameSite: 'none' as const,
    domain: 'localhost',
    // httpOnly: false,
    expires: new Date(Date.now() + 3600 * 1000).getTime()
});

builder.mutationField('create_user', t =>
    t.field({
        type: public_user_ref,
        args: {
            name: t.arg.string({ required: true }),
            email: t.arg.string({ required: true }),
            password: t.arg.string({ required: true }),
            role: t.arg.string()
        },
        resolve: async (_parent, args, ctx) => {
            const { name, email, password, role } = args;
            if (role === null) throw createGraphQLError('Role is required.', { extensions: { http: { status: 400 } } });

            const email_found = await user.findOne({ email });
            if (email_found) throw createGraphQLError('E-mail already used.', { extensions: { http: { status: 400 } } });

            const hashed_password = await hash(password, 10);
            const new_user = await user.build({ name, email, password: hashed_password, role }).save();

            const { role: new_user_role, email: new_user_email } = new_user;
            const payload = sign({ role: new_user_role, email: new_user_email }, 'SUPER_SECRET');
            await ctx.request.cookieStore?.set(cookie_fields(payload));

            return new_user;
        }
    })
);

builder.mutationField('login', t =>
    t.field({
        type: public_user_ref,
        args: {
            email: t.arg.string({ required: true }),
            password: t.arg.string({ required: true }),
        },
        resolve: async (_parent, args, ctx) => {
            const { email, password } = args;
            const user_found = await user.findOne({ email });
            if (!user_found) throw createGraphQLError('Invalid credentials.', { extensions: { http: { status: 400 } } });
            
            const password_correct = await compare(password, user_found.password);
            if (!password_correct) throw createGraphQLError('Invalid credentials.', { extensions: { http: { status: 400 } } });

            const { role: new_user_role, email: new_user_email } = user_found;
            const payload = sign({ role: new_user_role, email: new_user_email }, 'SUPER_SECRET');
            await ctx.request.cookieStore?.set(cookie_fields(payload));

            return user_found;
        }
    })
);