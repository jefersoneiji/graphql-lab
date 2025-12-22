import { createYoga } from "graphql-yoga";
import { createServer } from 'node:http';
import { schema } from "./schema";
import mongoose from "mongoose";

const yoga = createYoga({ schema });

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
