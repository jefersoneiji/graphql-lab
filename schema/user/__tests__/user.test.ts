import { expect, test } from 'vitest'
import { graphql } from 'graphql'

import { schema } from '../..'
import { afterEach } from 'node:test'
import mongoose from 'mongoose'

afterEach(async () => {
  await mongoose.connection.db?.dropDatabase()
})

const mock_context = { request: { cookieStore: { set: () => { } } } }

test('create user', async () => {
  const user_fixture = { email: "lim@email.com", name: 'Lim', password: '123456', role: 'ADMIN' }
  const source = `
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
  `;

  const result = await graphql({
    schema,
    source,
    contextValue: mock_context
  });

  expect(result.data).toMatchSnapshot()
})

test('should throw error for "e-mail already used"', async () => {
  const user_fixture = { email: "lim@email.com", name: 'Lim', password: '123456', role: 'ADMIN' }
  const source = `
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
  `;

  const created = await graphql({
    schema,
    source,
    contextValue: mock_context
  });

  const error = await graphql({
    schema,
    source,
    contextValue: mock_context
  });

  console.log('RESULT IS: ', JSON.stringify(error.data))

  expect(error.data).toMatchSnapshot()
})