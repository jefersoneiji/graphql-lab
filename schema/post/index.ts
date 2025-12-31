import { resolveCursorConnection } from "@pothos/plugin-relay";
import { createGraphQLError } from "graphql-yoga";
import mongoose from "mongoose";

import { author_loader, comment_loader } from "./loader";
import { public_user_ref, user_interface } from "../user";
import { comment_ref } from "../comment";
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
            resolve: async (post, _args, _ctx) => author_loader.load(post.author) as Promise<user_interface>
        }),
        comments: t.field({
            type: [comment_ref],
            nullable: false,
            resolve: async (post, _args, _ctx) => comment_loader.load(post.id)
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

function connection_slice(items: post_interface[], args: Omit<PothosSchemaTypes.DefaultConnectionArguments, 'after' | 'before'>): post_interface[] {
    const { first, last } = args;

    if (first != null && last != null) {
        return items.slice(0, first).slice(-last);
    }

    if (first != null) {
        return items.slice(0, first);
    }

    if (last != null) {
        return items.slice(-last);
    }

    return items;
}

const cookie_list = {
    name: 'sessionid',
    value: 'test_value_sessionid_123456',
    secure: false,
    sameSite: 'none' as const,
    domain: null,
    expires: new Date(Date.now() + 3600 * 1000)
};

builder.queryField('posts', t =>
    t.connection({
        type: post_ref,
        description: 'retrieves all posts',
        resolve: async (_parent, args, ctx) => {
            await ctx.request.cookieStore?.get('sessionid');
            await ctx.request.cookieStore?.set(cookie_list);

            const query = {
                ...(args.after && !args.before ? { _id: { $gt: args.after } } : {}),
                ...(args.before && !args.after ? { _id: { $lt: args.before } } : {}),
                ...(args.before && args.after ? { _id: { $lt: args.before, $gt: args.after } } : {})
            };

            const posts = await post.find(query).sort({ _id: 'asc' }).exec();

            const result = await resolveCursorConnection({ args, toCursor: post => btoa(post.id) }, async () => connection_slice(posts, args));
            return { ...result, totalCount: result.edges.length };
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