import mongoose from "mongoose";
import { user_interface } from ".";

type MakePropertiesOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface user_model extends mongoose.Model<user_doc> {
    build(attrs: MakePropertiesOptional<user_interface, 'role'>): user_doc;
}

const roles = ['role:admin', 'role:user'];

interface user_doc extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    role: string;
}

const user_schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: roles, default: 'role:user' },
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