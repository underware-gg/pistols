import {
  ApolloClient as ApolloClient3,
  HttpLink as HttpLink3,
  InMemoryCache as InMemoryCache3,
  gql as gql3,
} from 'apollo-client-3'
import { useQuery as useQuery3 } from 'apollo-client-3/react'
import {
  ApolloClient as ApolloClient4,
  HttpLink as HttpLink4,
  InMemoryCache as InMemoryCache4,
  gql as gql4,
} from '@apollo/client'
import { useQuery as useQuery4 } from '@apollo/client/react'
import { describe, expect, test } from 'vitest'

describe.each([
  ['Apollo Client 3', ApolloClient3, HttpLink3, InMemoryCache3, gql3, useQuery3],
  ['Apollo Client 4', ApolloClient4, HttpLink4, InMemoryCache4, gql4, useQuery4],
])('%s published GraphQL API compatibility', (_name, ApolloClient, HttpLink, InMemoryCache, gql, useQuery) => {
  test('provides every public API used by the SDK GraphQL subpath', () => {
    expect(ApolloClient).toBeTypeOf('function')
    expect(HttpLink).toBeTypeOf('function')
    expect(InMemoryCache).toBeTypeOf('function')
    expect(gql).toBeTypeOf('function')
    expect(useQuery).toBeTypeOf('function')
    expect(gql`query CompatibilityProbe { __typename }`.kind).toBe('Document')
  })
})
