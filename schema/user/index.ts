import { createGraphQLError } from "graphql-yoga";
import { builder } from "../../builder";
import { user } from "./model";

export interface user_interface {
    name: string;
    email: string;
    password: string;
}

export const user_ref = builder.objectRef<user_interface>('user');

user_ref.implement({
    description: 'system user',
    fields: t => ({
        name: t.exposeString('name', { nullable: false, description: 'user name' }),
        email: t.exposeString('email', { nullable: false, description: 'user e-mail' }),
        password: t.exposeString('password', { nullable: false, description: 'user password' })
    })
});

builder.queryField('user', t =>
    t.field({
        type: public_user_ref,
        args: {
            email: t.arg.string({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { email } = args;
            const user_found = await user.findOne({ email });
            
            if (!user_found) throw createGraphQLError('User not found.', { extensions: { http: { status: 404 } } });

            return user_found
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

builder.mutationField('create_user', t =>
    t.field({
        type: public_user_ref,
        args: {
            name: t.arg.string({ required: true }),
            email: t.arg.string({ required: true }),
            password: t.arg.string({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { name, email, password } = args;

            const email_found = await user.findOne({ email });
            if (email_found) throw createGraphQLError('E-mail already used', { extensions: { http: { status: 400 } } });

            await user.build({ name, email, password }).save();

            return {
                name: args.name,
                email: args.email
            };
        }
    })
);