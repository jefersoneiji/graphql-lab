import './user';
import './post';
import './comment';
import './subscriptions';

import { builder } from '../builder';

builder.queryType({});
builder.mutationType({});
builder.subscriptionType({});

export const schema = builder.toSchema();