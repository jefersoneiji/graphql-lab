import { builder } from "../builder";

interface user_interface {
    name: string;
    email: string;
    password: string;
}

const user_ref = builder.objectRef<user_interface>('user');

user_ref.implement({
    description: 'system user',
    fields: t => ({
        name: t.exposeString('name', { nullable: false }),
        email: t.exposeString('email', { nullable: false }),
        password: t.exposeString('password')
    })
});

builder.queryField('user', t =>
    t.field({
        type: user_ref,
        resolve: () => {
            return {
                name: 'Jeferson',
                email: 'jeferson@email.com',
                password: '123456'
            };
        }
    })
);

const public_user_ref = builder.objectRef<Omit<user_interface, 'password'>>('public_user');

public_user_ref.implement({
    description: 'public user',
    fields: t => ({
        name: t.exposeString('name', { nullable: false }),
        email: t.exposeString('email', { nullable: false }),
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
        resolve: (parent, args, ctx) => {
            return {
                name: args.name,
                email: args.email
            };
        }
    })
);