import mongoose from "mongoose";
import { user_interface } from ".";

interface user_model extends mongoose.Model<user_doc> {
    build(attrs: user_interface): user_doc;
}

interface user_doc extends mongoose.Document {
    name: string;
    email: string;
    password: string;
}

const user_schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, {
    toJSON: {
        transform(_doc, ret) {
            const { _id, password, __v, ...clean } = ret;
            return clean;
        },
    },
    toObject: {
        transform(_doc, ret) {
            const { _id, password, __v, ...clean } = ret;
            return clean;
        },
    },
});

user_schema.statics.build = (attrs: user_interface) => {
    return new user(attrs);
};

export const user = mongoose.model<user_doc, user_model>('user', user_schema);