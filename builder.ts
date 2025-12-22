import SchemaBuilder from "@pothos/core";
import { DateResolver } from "graphql-scalars";

interface builder {
    Scalars: {
        Date: {
            Input: Date;
            Output: Date;
        };
    };
}
export const builder = new SchemaBuilder<builder>({});

builder.addScalarType('Date', DateResolver);