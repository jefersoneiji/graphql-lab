import { resolveCursorConnection } from "@pothos/plugin-relay";
import mongoose from "mongoose";

import { BadRequestError, builder, NotFoundError } from "../../builder";
import { comment } from "../comment/model";
import { public_user_ref } from "../user";
import { comment_ref } from "../comment";
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
        author: t.loadable({
            type: public_user_ref,
            nullable: false,
            load: async (ids: string[]) => {
                const authors = await user.find({ _id: { $in: ids } })
                return ids.map(id => {
                    const found = authors.find(a => a._id.toString() === id.toString());
                    if (!found) throw new Error(`User not found: ${id}`);
                    return found;
                });
            },
            resolve: async (post, _args, _ctx) => post.author
        }),
        comments: t.loadableList({
            type: comment_ref,
            nullable: false,
            load: async (ids: string[], _ctx) => {
                const allComments = await comment.find({ post: { $in: ids } });
                const groupedComments = ids.map(id => allComments.filter(c => c.post.toString() === id));
                return groupedComments;
            },
            resolve: (post) => post.id
        }),
        created_at: t.expose('created_at', { type: 'Date', nullable: false })
    })
});

builder.queryField('post', t =>
    t.field({
        type: post_ref,
        description: 'retrieves post by id',
        errors: {},
        args: {
            post_id: t.arg.globalID({ description: 'post id', required: true })
        },
        resolve: async (_parent, args, _ctx) => {
            const { post_id: { id } } = args;

            const id_checked = mongoose.isValidObjectId(id);
            if (!id_checked) throw new BadRequestError('Invalid post id.')

            const post_found = await post.findOne({ _id: id });
            if (!post_found) throw new NotFoundError('Author not found.');

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

builder.queryField('posts', t =>
    t.connection({
        type: post_ref,
        description: 'retrieves all posts',
        errors: {},
        resolve: async (_parent, args, _ctx) => {
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
        errors: {},
        args: {
            title: t.arg.string({ required: true }),
            link: t.arg.string({ required: true }),
            author: t.arg.string({ required: true })
        },
        resolve: async (_, args, _ctx) => {
            const { title, link, author } = args;

            const id_checked = mongoose.isValidObjectId(args.author);
            if (!id_checked) throw new BadRequestError('Invalid author id.')

            const user_found = await user.findOne({ _id: args.author });
            if (!user_found) throw new NotFoundError('Author not found.');

            const now = new Date();
            return await post.build({ title, link, author, created_at: now }).save();
        }
    })
);