import mongoose from "mongoose";
import { comment_interface } from ".";

interface comment_model extends mongoose.Model<comment_doc> {
    build(attrs: comment_interface): comment_doc;
}

interface comment_doc extends mongoose.Document {
    author: string;
    post: string;
    content: string;
    created_at: Date;
}

const comment_schema = new mongoose.Schema({
    author: { type: String, required: true },
    post: { type: String, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, required: true },
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

comment_schema.statics.build = (attrs: comment_interface) => {
    return new comment(attrs);
};

export const comment = mongoose.model<comment_doc, comment_model>('comment', comment_schema);