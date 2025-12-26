import SchemaBuilder from "@pothos/core";
import RelayPlugin from "@pothos/plugin-relay";
import { DateTimeResolver } from "graphql-scalars";

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
}
export const builder = new SchemaBuilder<builder>({
    plugins: [RelayPlugin],
    relay: {}
});

builder.addScalarType('Date', DateTimeResolver);

builder.globalConnectionField('totalCount', t =>
    t.int({
        nullable: false,
        resolve: parent => parent.totalCount
    })
);