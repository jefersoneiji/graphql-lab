import { createGraphQLError } from "graphql-yoga";
import mongoose from "mongoose";

import { public_user_ref, user_interface } from "../user";
import { builder } from "../../builder";
import { user } from "../user/model";
import { post } from "./model";

export interface post_interface {
    id: string;
    title: string;
    link: string;
    author: string;
    created_at: Date;
}

export const post_ref = builder.objectRef<post_interface>('post');

builder.node(post_ref, {
    id: {
        resolve: post => post.id
    },
    loadOne: async (id) => await post.findById(id),
    loadMany: async (ids) => await post.find({ _id: { $in: ids } }),
    fields: t => ({
        title: t.exposeString('title', { nullable: false, description: 'post title' }),
        link: t.exposeString('link', { nullable: false, description: 'post link' }),
        author: t.field({
            type: public_user_ref,
            nullable: false,
            resolve: async (post, _args, _ctx) => await user.findById(post.author) as user_interface
        }),
        created_at: t.expose('created_at', { type: 'Date', nullable: false })
    })
});

builder.queryField('post', t =>
    t.field({
        type: post_ref,
        description: 'retrieves post by id',
        args: {
            post_id: t.arg.id({ description: 'post id', required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const id_checked = mongoose.isValidObjectId(args.post_id);
            if (!id_checked) throw createGraphQLError('Invalid post id.', { extensions: { http: { status: 400 } } });

            const post_found = await post.findOne({ _id: args.post_id });
            if (!post_found) throw createGraphQLError('Post not found.', { extensions: { http: { status: 404 } } });

            return await post.findById(args.post_id);
        }
    })
);

builder.queryField('posts', t =>
    t.field({
        type: [post_ref],
        description: 'retrieves all posts',
        resolve: async () => {
            return await post.find();
        }
    })
);

builder.mutationField('post', t =>
    t.field({
        type: post_ref,
        nullable: false,
        description: 'creates post',
        args: {
            title: t.arg.string({ required: true }),
            link: t.arg.string({ required: true }),
            author: t.arg.string({ required: true })
        },
        resolve: async (_, args, _ctx) => {
            const { title, link, author } = args;

            const id_checked = mongoose.isValidObjectId(args.author);
            if (!id_checked) throw createGraphQLError('Invalid author id.', { extensions: { http: { status: 400 } } });

            const user_found = await user.findOne({ _id: args.author });
            if (!user_found) throw createGraphQLError('Author not found.', { extensions: { http: { status: 404 } } });

            const now = new Date();
            const created_post = await post.build({ title, link, author, created_at: now }).save();

            return {
                id: created_post.id,
                title: args.title,
                link: args.link,
                author: args.author,
                created_at: now
            };
        }
    })
);