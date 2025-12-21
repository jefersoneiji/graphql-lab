import { builder } from "../builder";

interface post_interface {
    title: string;
    link: string;
    author: string;
}

const post_ref = builder.objectRef<post_interface>('post');

post_ref.implement({
    description: 'post',
    fields: t => ({
        title: t.exposeString('title', { nullable: false, description: 'post title' }),
        link: t.exposeString('link', { nullable: false, description: 'post link' }),
        author: t.exposeID('author', { description: 'post author id' })
    })
});

builder.queryField('post', t =>
    t.field({
        type: post_ref,
        resolve: () => {
            return {
                title: 'Jeferson',
                link: 'jeferson@email.com',
                author: '123456'
            };
        }
    })
);

builder.mutationField('create_post', t =>
    t.field({
        type: post_ref,
        args: {
            title: t.arg.string({ required: true }),
            link: t.arg.string({ required: true }),
            author: t.arg.string({ required: true })
        },
        resolve: (parent, args, ctx) => {
            return {
                title: args.title,
                link: args.link,
                author: args.author
            };
        }
    })
);