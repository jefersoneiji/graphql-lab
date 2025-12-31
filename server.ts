import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { createYoga } from "graphql-yoga";
import { createServer } from 'node:http';
import mongoose from "mongoose";

import { schema } from "./schema";

const yoga = createYoga({ schema, plugins:[useCookies()] });

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
