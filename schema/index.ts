import './user';
import './post';
import './comment';

import { builder } from '../builder';

builder.queryType({});
builder.mutationType({});

export const schema = builder.toSchema();