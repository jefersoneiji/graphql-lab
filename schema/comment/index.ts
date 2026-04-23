import { createGraphQLError } from "graphql-yoga";

import { public_user_ref } from "../user";
import { post_interface, post_ref } from "../post";
import { builder, NotFoundError, public_user } from "../../builder";
import { post } from "../post/model";
import { comment } from "./model";
import { user } from "../user/model";

export interface comment_interface {
    id: string;
    author: string;
    post: string;
    content: string;
    created_at: Date;
}

export const comment_ref = builder.objectRef<comment_interface>('comment');

// REPLY TO COMMENT FEATURE
builder.node(comment_ref, {
    id: { resolve: comment => comment.id },
    loadOne: async id => await comment.findById(id),
    loadMany: async ids => await comment.find({ _id: { $in: ids } }),
    fields: t => ({
        author: t.loadable({
            type: public_user_ref,
            nullable: false,
            description: 'comment author',
            load: async (ids: string[]) => {
                const authors = await user.find({ _id: { $in: ids } }) as public_user[]
                return authors
            },
            resolve: async (comment, _args, _ctx) => comment.author
        }),
        post: t.loadable({
            type: post_ref,
            nullable: false,
            description: 'post',
            load: async (ids: string[]) => {
                const posts = await post.find({ _id: { $in: ids } }) as post_interface[]
                return posts
            },
            resolve: async (comment, _args, _ctx) => comment.post
        }),
        content: t.exposeString('content', { nullable: false, description: 'comment content' }),
        created_at: t.expose('created_at', { type: 'Date', nullable: false, description: 'created at timestamp' })
    })
});

builder.queryField('comments', t =>
    t.field({
        type: [comment_ref],
        errors: {},
        authScopes: { $any: { guest: true, admin: true, user: true } },
        resolve: async (_parent, _args, _ctx) => {
            const comments = await comment.find({})
            return comments;
        }
    })
);

builder.queryField('comment', t =>
    t.field({
        type: comment_ref,
        errors: {},
        authScopes: { $any: { guest: true, admin: true, user: true } },
        args: {
            comment: t.arg.id({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { comment: comment_id } = args;

            const comment_found = await comment.findById(comment_id);
            if (!comment_found) throw new NotFoundError('Comment not found.');

            return comment_found;
        }
    })
);

builder.mutationField('comment', t =>
    t.field({
        type: comment_ref,
        errors: {},
        authScopes: { $any: { admin: true, user: true } },
        args: {
            author: t.arg.id({ required: true }),
            content: t.arg.string({ required: true }),
            post: t.arg.globalID({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { author, content, post: post_id } = args;

            const post_found = await post.findById(post_id.id);
            if (!post_found) throw new NotFoundError('Post not found.');

            const now = new Date();
            const comment_created = await comment.build({ author, content, post: post_id.id, created_at: now }).save();

            return comment_created;
        }
    })
);