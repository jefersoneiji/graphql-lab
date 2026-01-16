import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import RelayPlugin from "@pothos/plugin-relay";
import SchemaBuilder from "@pothos/core";

import { DateTimeResolver } from "graphql-scalars";
import { YogaInitialContext } from "graphql-yoga";
import { user_interface } from "./schema/user";

export type public_user = Omit<user_interface, 'password'>;

interface Context extends YogaInitialContext {
    request: YogaInitialContext['request'] & {
        cookieStore?: CookieStore;
    };
    user: (public_user & { role: string; }) | null;
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
    plugins: [RelayPlugin, ScopeAuthPlugin],
    scopeAuth: {
        authScopes: async context => ({
            guest: () => !context.user,
            user: () => context.user?.role === "role:user",
            admin: () => context.user?.role === "role:admin",
        })
    },
    relay: {}
});

builder.addScalarType('Date', DateTimeResolver);

builder.globalConnectionField('totalCount', t =>
    t.int({
        nullable: false,
        resolve: parent => parent.totalCount
    })
);