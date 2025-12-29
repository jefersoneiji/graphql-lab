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

    // GROUP COMMENTS USING AGGREGATION INSTEAD OF THIS QUERY?
    const docs = await comment.find({ post: { $in: ids as string[] } }).exec();
    
    const map = new Map<string, comment_interface[]>();
    for (const id of ids) map.set(id, []);

    for (const doc of docs as comment_interface[]) {
        const key = String((doc as any).post);
        const arr = map.get(key) || [];
        arr.push(doc);
        map.set(key, arr);
    }
    // const mapped = ids.map(id => map.get(id) || []);
    // console.log('MAPPED COMMENTS ARE: ', mapped);
    return ids.map(id => map.get(id) || []);
};

export const comment_loader = new DataLoader<string, comment_interface[]>(keys => batch_comment(keys));