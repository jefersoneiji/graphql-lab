import { beforeEach, expect, test } from 'vitest';
import { execute, parse } from 'graphql';

import { schema } from '../..';
import mongoose from 'mongoose';

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const mock_context = { request: { cookieStore: { set: () => { } } } };

test('create user', async () => {
  const user_fixture = { email: "lim@email.com", name: 'Lim', password: '123456', role: 'ADMIN' };
  const document = parse(`
    mutation test_user {
      create_user(email: "${user_fixture.email}", name: "${user_fixture.name}", password: "${user_fixture.password}", role: ADMIN) {
      ... on MutationCreate_userSuccess {
      __typename
      data {
        email
        name
      }
    }

    ... on Error {
      message
    }
      }
    }
  `);

  const result = await execute({
    schema,
    document,
    contextValue: mock_context
  });

  expect(result.data).toMatchInlineSnapshot(`
    {
      "create_user": {
        "__typename": "MutationCreate_userSuccess",
        "data": {
          "email": "lim@email.com",
          "name": "Lim",
        },
      },
    }
  `);
});

test('should throw error for "e-mail already used"', async () => {
  const user_fixture = { email: "lim@email.com", name: 'Lim', password: '123456', role: 'ADMIN' };
  const document = parse(`
    mutation test_user {
      create_user(email: "${user_fixture.email}", name: "${user_fixture.name}", password: "${user_fixture.password}", role: ADMIN) {
      ... on MutationCreate_userSuccess {
      __typename
      data {
        email
        name
      }
    }

    ... on Error {
      message
    }
      }
    }
  `);

  const created = await execute({
    schema,
    document,
    contextValue: mock_context
  });

  expect(created.data).toMatchInlineSnapshot(`
    {
      "create_user": {
        "__typename": "MutationCreate_userSuccess",
        "data": {
          "email": "lim@email.com",
          "name": "Lim",
        },
      },
    }
  `);

  const error = await execute({
    schema,
    document,
    contextValue: mock_context
  });

  expect(error.data).toMatchInlineSnapshot(`
    {
      "create_user": {
        "message": "E-mail already used.",
      },
    }
  `);
});

test('should return user based on his e-mail', async () => {
  const user_fixture = { email: "lim@email.com", name: 'Lim', password: '123456', role: 'ADMIN' };
  const document = parse(`
    mutation test_user {
      create_user(email: "${user_fixture.email}", name: "${user_fixture.name}", password: "${user_fixture.password}", role: ADMIN) {
      ... on MutationCreate_userSuccess {
      __typename
      data {
        email
        name
      }
    }

    ... on Error {
      message
    }
      }
    }
  `);

  const created = await execute({
    schema,
    document,
    contextValue: mock_context
  });

  expect(created.data).toMatchInlineSnapshot(`
    {
      "create_user": {
        "__typename": "MutationCreate_userSuccess",
        "data": {
          "email": "lim@email.com",
          "name": "Lim",
        },
      },
    }
  `);

  const document_login = parse(`
  mutation test_login {
  login(email: "${user_fixture.email}", password: "${user_fixture.password}") {
    ... on MutationLoginSuccess {
      __typename
      data {
        email
        name
      }
    }
    ... on BaseError {
      message
    }
   }
  }
  `);

  const login = await execute({
    schema,
    document: document_login,
    contextValue: mock_context
  });
  
  expect(login.data).toMatchInlineSnapshot(`
    {
      "login": {
        "__typename": "MutationLoginSuccess",
        "data": {
          "email": "lim@email.com",
          "name": "Lim",
        },
      },
    }
  `);
});