import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { createYoga } from "graphql-yoga";
import { createServer } from 'node:http';
import { verify } from "jsonwebtoken";
import mongoose from "mongoose";

import { user } from "./schema/user/model";
import { public_user } from "./builder";
import { schema } from "./schema";

// TODO: CHECK ROLE BEFORE STORING IT
// TODO: PREVENT UNAUTHORIZED PEOPLE TO ATTRIBUTE ROLE:ADMIN TO THEMSELVES
// TODO: INVALIDATE COOKIE ON LOGOUT
// TODO: CHECK IF IT'S NECESSARY TO IMPLEMENT A REFRESH TOKEN
type current_user = public_user & { role: string; };

async function get_user_from_cookie(request: Request): Promise<current_user | null> {
    const cookie = await request.cookieStore?.get('session_id');
    if (!cookie) return null;

    // HOW TO HANDLE INVALID JWT?
    const decoded_jwt = verify(cookie.value, 'SUPER_SECRET') as { role: string, email: string; };

    // HOW TO HANDLE INVALID USER?
    const retrieved_user = await user.findOne({ email: decoded_jwt.email });
    if (!retrieved_user) return null;

    return Object.assign({ role: decoded_jwt.role }, retrieved_user.toObject());
}

const yoga = createYoga({
    schema,
    plugins: [useCookies()],
    context: async (context) => {
        const user = await get_user_from_cookie(context.request);
        return { ...context, user };
    }
});

const server = createServer(yoga);

mongoose.connect(process.env.MONGODB_URL || 'mongodb://admin:super_admin@localhost:27017/graphql-db?authSource=admin')
    .then(() => {
        server.listen(3000, () => {
            console.log('Server running on http://localhost:3000/graphql');
        });
    })
    .catch(err =>
        console.error('Error while connection to database: ', err)
    );
