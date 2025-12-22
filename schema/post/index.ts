import { builder } from "../../builder";
import { post } from "./model";
import { user } from "../user/model";
import { createGraphQLError } from "graphql-yoga";
import mongoose from "mongoose";

export interface post_interface {
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

builder.queryField('posts', t =>
    t.field({
        type: [post_ref],
        resolve: () => {
            return [
                {
                    title: 'Jeferson',
                    link: 'jeferson@email.com',
                    author: '123456'
                }
            ];
        }
    })
);

builder.mutationField('post', t =>
    t.field({
        type: post_ref,
        args: {
            title: t.arg.string({ required: true }),
            link: t.arg.string({ required: true }),
            author: t.arg.string({ required: true })
        },
        resolve: async (_, args, _ctx) => {
            const { title, link, author } = args;

            const id_checked = mongoose.isValidObjectId(args.author)
            if (!id_checked) throw createGraphQLError('Invalid author id.', { extensions: { http: { status: 400 } } });

            const user_found = await user.findOne({ _id: args.author });
            if (!user_found) throw createGraphQLError('Author not found.', { extensions: { http: { status: 404 } } });

            await post.build({ title, link, author }).save();

            return {
                title: args.title,
                link: args.link,
                author: args.author
            };
        }
    })
);