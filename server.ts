import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { useOpenTelemetry } from '@envelop/opentelemetry';
import { createPubSub, createYoga } from "graphql-yoga";
import { useServer } from 'graphql-ws/use/ws'
import { createServer } from 'node:http';
import { verify } from "jsonwebtoken";
import { WebSocketServer } from 'ws'
import mongoose from "mongoose";

import { user } from "./schema/user/model";
import { public_user } from "./builder";
import { provider } from "./tracer";
import { schema } from "./schema";

// TODO: PREVENT UNAUTHORIZED PEOPLE TO ATTRIBUTE ROLE:ADMIN TO THEMSELVES
// TODO: CHECK IF IT'S NECESSARY TO IMPLEMENT A REFRESH TOKEN
// TODO: IMPLEMENT JWT INVALIDATION/BLACK LISTING ON LOGOUT
type current_user = public_user & { role: string; };

export type PubSubEvents = { 'VOTE_ADDED': [message: string] }
export const pubsub = createPubSub<PubSubEvents>()

async function get_user_from_cookie(request: Request): Promise<current_user | null> {
    const cookie = await request.cookieStore?.get('session_id');
    if (!cookie) return null;
    if (!cookie.value) return null;

    // HOW TO HANDLE INVALID JWT?
    const decoded_jwt = verify(cookie.value, 'SUPER_SECRET') as { role: string, email: string; };

    // HOW TO HANDLE INVALID USER?
    const retrieved_user = await user.findOne({ email: decoded_jwt.email });
    if (!retrieved_user) return null;

    return Object.assign({ role: decoded_jwt.role }, retrieved_user.toObject());
}

const yoga = createYoga({
    graphiql: {
        subscriptionsProtocol: 'WS'
    },
    schema,
    plugins: [
        useCookies(),
        useOpenTelemetry(
            {
                resolvers: true,
                variables: true,
                result: false,
            },
            provider,
        ),
        useResponseCache({
            session: (ctx) => ctx.headers.get('authentication')
        })
    ],
    context: async (context) => {
        const user = await get_user_from_cookie(context.request);
        return { ...context, user, pubsub };
    }
});

const server = createServer(yoga);

const ws_server = new WebSocketServer({
    server,
    path: yoga.graphqlEndpoint
})

useServer(
    {
        execute: (args) => (args.rootValue as { execute: Function }).execute(args),
        subscribe: (args) => (args.rootValue as { subscribe: Function }).subscribe(args),
        onSubscribe: async (ctx, _id, params) => {
            const { schema, execute, subscribe, contextFactory, parse, validate } = yoga.getEnveloped({
                ...ctx,
                req: ctx.extra.request,
                socket: ctx.extra.socket,
                params
            })

            const args = {
                schema,
                operationName: params.operationName,
                document: parse(params.query),
                variableValues: params.variables,
                contextValue: await contextFactory({ request: ctx.extra.request }),
                rootValue: {
                    execute,
                    subscribe
                }
            }
            const errors = validate(args.schema, args.document)
            if (errors.length) return errors
            return args
        }
    },
    ws_server
)

mongoose.connect(process.env.MONGODB_URL || 'mongodb://admin:super_admin@localhost:27017/graphql-db?authSource=admin')
    .then(() => {
        server.listen(3000, () => {
            console.log('Server running on http://localhost:3000/graphql');
        });
    })
    .catch(err =>
        console.error('Error while connection to database: ', err)
    );
