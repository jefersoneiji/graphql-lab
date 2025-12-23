import SchemaBuilder from "@pothos/core";
import RelayPlugin from "@pothos/plugin-relay";
import { DateResolver } from "graphql-scalars";

interface builder {
    Scalars: {
        Date: {
            Input: Date;
            Output: Date;
        };
    };
}
export const builder = new SchemaBuilder<builder>({
    plugins: [RelayPlugin],
    relay:{}
});

builder.addScalarType('Date', DateResolver);