import { createGraphQLError } from "graphql-yoga";

import { public_user_ref, user_interface } from "../user";
import { post_interface, post_ref } from "../post";
import { author_loader, comments_loader } from "./loader";
import { builder } from "../../builder";
import { post } from "../post/model";
import { comment } from "./model";

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
        author: t.field({
            type: public_user_ref,
            nullable: false,
            description: 'comment author',
            resolve: async (comment, _args, _ctx) => author_loader.load(comment.author) as Promise<user_interface>
        }),
        post: t.field({
            type: post_ref,
            nullable: false,
            description: 'post',
            resolve: async (comment, _args, _ctx) => await post.findById(comment.post) as post_interface
        }),
        content: t.exposeString('content', { nullable: false, description: 'comment content' }),
        created_at: t.expose('created_at', { type: 'Date', nullable: false, description: 'created at timestamp' })
    })
});

builder.queryField('comments', t =>
    t.field({
        type: [comment_ref],
        resolve: async (_parent, _args, _ctx) => {
           const comments = await comments_loader.load("")
            return comments;
        }
    })
);

builder.queryField('comment', t =>
    t.field({
        type: comment_ref,
        args: {
            comment: t.arg.id({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { comment: comment_id } = args;

            const comment_found = await comment.findById(comment_id);
            if (!comment_found) throw createGraphQLError('Comment not found.', { extensions: { http: { status: 404 } } });

            return comment_found;
        }
    })
);

builder.mutationField('comment', t =>
    t.field({
        type: comment_ref,
        args: {
            author: t.arg.id({ required: true }),
            content: t.arg.string({ required: true }),
            post: t.arg.globalID({ required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { author, content, post: post_id } = args;

            const post_found = await post.findById(post_id.id);
            if (!post_found) throw createGraphQLError('Post not found.', { extensions: { http: { status: 404 } } });

            const now = new Date();
            const comment_created = await comment.build({ author, content, post: post_id.id, created_at: now }).save();

            return comment_created;
        }
    })
);