import DataLoader from "dataloader";
import mongoose from "mongoose";

import { comment_interface } from "../comment";
import { comment } from "../comment/model";
import { user_interface } from "../user";
import { user } from "../user/model";

type public_user = Omit<user_interface, 'password'>;

const batch_author = async (ids: readonly string[]): Promise<(public_user | null)[]> => {
    console.debug(`-> Fetching authors with IDs: ${ids.join(', ')}`);

    const type_casted_ids = ids.map(elem => new mongoose.Types.ObjectId(elem));
    console.debug('TYPE CASTED IDS ARE: ', type_casted_ids);

    const ordered_docs = await user.aggregate([
        { $match: { _id: { $in: type_casted_ids } } },
        { $addFields: { "__order": { $indexOfArray: [type_casted_ids, "$_id"] } } },
        { $unset: ['password', '__v', '_id'] },
        { $sort: { "__order": 1 } },
        { $project: { "__order": 0 } }
    ]).exec();

    console.log('USERS FOUND ARE: ', ordered_docs);
    return Promise.resolve(ordered_docs);
};

export const author_loader = new DataLoader<string, public_user | null>(key => batch_author(key));

const batch_comment = async (ids: readonly string[]): Promise<comment_interface[][]> => {
    console.debug(`-> Fetching comments for post with IDs: ${ids.join(', ')}`);

    const ordered_docs = await comment.aggregate([
        { $match: { post: { $in: ids } } },
        { $addFields: { "__order": { $indexOfArray: [ids, "$post"] } } },
        { $unset: ['__v', '_id'] },
        { $sort: { "__order": 1 } },
        { $project: { "__order": 0 } },
        { $group: { _id: "$post", comments: { $push: "$$ROOT" } } },
        { $project: { _id: 0, comments: "$comments" } },
    ]).exec();

    return Promise.resolve(ordered_docs.map(elem => elem.comments));
};

export const comment_loader = new DataLoader<string, comment_interface[]>(keys => batch_comment(keys));