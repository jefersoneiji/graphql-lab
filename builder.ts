import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import ComplexityPlugin from '@pothos/plugin-complexity';
import DataLoaderPlugin from '@pothos/plugin-dataloader'
import { DateTimeResolver } from "graphql-scalars";
import { YogaInitialContext } from "graphql-yoga";
import ErrorsPlugin from '@pothos/plugin-errors';
import RelayPlugin from "@pothos/plugin-relay";
import SchemaBuilder from "@pothos/core";

import { user_interface } from "./schema/user";
import { pubsub } from './server';

export type public_user = Omit<user_interface, 'password'>;

interface Context extends YogaInitialContext {
    request: YogaInitialContext['request'] & { cookieStore?: CookieStore; };
    user: (public_user & { role: string; }) | null;
    pubsub: typeof pubsub
}

interface builder {
    Connection: {
        totalCount: number;
    },
    Scalars: {
        Date: {
            Input: Date;
            Output: Date;
        };
    };
    Context: Context;
    AuthScopes: {
        guest: boolean,
        user: boolean,
        admin: boolean,
    };
}

export const builder = new SchemaBuilder<builder>({
    plugins: [
        RelayPlugin,
        ScopeAuthPlugin,
        ErrorsPlugin,
        ComplexityPlugin,
        DataLoaderPlugin,
    ],
    scopeAuth: {
        authScopes: async context => ({
            guest: () => !context.user,
            user: () => context.user?.role === "role:user",
            admin: () => context.user?.role === "role:admin",
        })
    },
    relay: {},
    complexity: {
        defaultComplexity: 1,
        defaultListMultiplier: 10,
        limit: {
            complexity: 2000,
        },
    },
    errors: {
        defaultTypes: [Error]
    }
});

const ErrorInterface = builder.interfaceRef<Error>('Error').implement({
    fields: t => ({
        message: t.exposeString('message'),
    })
})

builder.objectType(Error, {
    name: "BaseError",
    fields: t => ({ message: t.exposeString('message') }),
    interfaces: [ErrorInterface]
})
export class BadRequestError extends Error {
    constructor(message: string = 'Bad request.') {
        super(message);
        this.name = 'BadRequestError';
    }
}

builder.objectType(BadRequestError, {
    name: "BadRequestError",
    fields: t => ({ message: t.exposeString('message'), code: t.string({ resolve: () => '400' }) }),
    interfaces: [ErrorInterface],
})

export class NotFoundError extends Error {
    constructor(message: string = 'Not found.') {
        super(message);
        this.name = 'NotFoundError';
    }
}

builder.objectType(NotFoundError, {
    name: "NotFoundError",
    fields: t => ({ message: t.exposeString('message'), code: t.string({ resolve: () => '404' }) }),
    interfaces: [ErrorInterface],
})

builder.addScalarType('Date', DateTimeResolver);

builder.globalConnectionField('totalCount', t =>
    t.int({
        nullable: false,
        resolve: parent => parent.totalCount
    })
);