import { resolveCursorConnection } from "@pothos/plugin-relay";
import { createGraphQLError } from "graphql-yoga";
import mongoose from "mongoose";

import { comment_interface, comment_ref } from "../comment";
import { public_user_ref, user_interface } from "../user";
import { comment } from "../comment/model";
import { builder } from "../../builder";
import { user } from "../user/model";
import { post } from "./model";
import { author_loader, comment_loader } from "./loader";

function create_query_counter() {
    let queryCount = 0;
    return {
        increment() { queryCount++; },
        getCount() { return queryCount; },
        reset() { queryCount = 0; }
    };
}

export const query_counter = create_query_counter();

// IMPLEMENT THE AFTER, BEFORE, FIRST, LAST AND SORT FIELDS TO DB QUERY
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
            resolve: async (post, _args, _ctx) => {
                query_counter.increment();
                console.log('QUERY COUNTER INSIDE "AUTHOR FIELD" IS: ', query_counter.getCount());
                // return await user.findById(post.author) as user_interface;
                const author = author_loader.load(post.author);
                return author as Promise<user_interface>;
            }
        }),
        comments: t.field({
            type: [comment_ref],
            nullable: false,
            resolve: async (post, _args, _ctx) => {
                query_counter.increment();
                console.log('QUERY COUNTER INSIDE "COMMENTS" IS: ', query_counter.getCount());
                return comment_loader.load(post.id);
            }
        }),
        created_at: t.expose('created_at', { type: 'Date', nullable: false })
    })
});

builder.queryField('post', t =>
    t.field({
        type: post_ref,
        description: 'retrieves post by id',
        args: {
            post_id: t.arg.globalID({ description: 'post id', required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { post_id: { id } } = args;

            const id_checked = mongoose.isValidObjectId(id);
            if (!id_checked) throw createGraphQLError('Invalid post id.', { extensions: { http: { status: 400 } } });

            const post_found = await post.findOne({ _id: id });
            if (!post_found) throw createGraphQLError('Post not found.', { extensions: { http: { status: 404 } } });

            return await post.findById(id);
        }
    })
);

builder.queryField('posts', t =>
    t.connection({
        type: post_ref,
        description: 'retrieves all posts',
        resolve: async (_parent, args) => {
            const posts = await post.find();
            query_counter.reset();
            query_counter.increment();
            console.log(' ');
            console.log(`QUERY COUNTER IN "MAIN QUERY" IS: `, query_counter.getCount());
            const result = await resolveCursorConnection({ args, toCursor: post => btoa(post.id) }, async () => posts);
            return { ...result, totalCount: posts.length };
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
            return await post.build({ title, link, author, created_at: now }).save();
        }
    })
);