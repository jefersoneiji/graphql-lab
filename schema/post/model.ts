import mongoose from "mongoose";
import { post_interface } from ".";

interface post_model extends mongoose.Model<post_doc> {
    build(attrs: post_interface): post_doc;
}

interface post_doc extends mongoose.Document {
    title: string;
    link: string;
    author: string;
}

const post_schema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String, required: true, unique: true },
    author: { type: String, required: true },
}, {
    toJSON: {
        transform(_doc, ret) {
            const { _id, __v, ...clean } = ret;
            return clean;
        },
    },
    toObject: {
        transform(_doc, ret) {
            const { _id, __v, ...clean } = ret;
            return clean;
        },
    },
});

post_schema.statics.build = (attrs: post_interface) => {
    return new post(attrs);
};

export const post = mongoose.model<post_doc, post_model>('post', post_schema);