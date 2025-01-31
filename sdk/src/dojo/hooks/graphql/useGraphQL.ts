import { useMemo } from 'react'
import { ApolloClient, InMemoryCache, useQuery } from '@apollo/client'

//---------------------------
// QL Client
// https://www.apollographql.com/docs/react/data/queries
//
export const ql_client = (GQLUrl: string) => {
  return new ApolloClient({
    uri: GQLUrl,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "no-cache",
        nextFetchPolicy: "no-cache",
      },
      query: {
        fetchPolicy: "no-cache",
      },
      mutate: {
        fetchPolicy: "no-cache",
      },
    },
    cache: new InMemoryCache({
      addTypename: false,
    }),
  });
};

type Variables = Record<string, string | number | number[] | boolean | null | undefined | Date>;

export const useGraphQLQuery = ({
  graphqlUrl,
  query,
  variables,
  enabled = true,
  watch = false,
  pollInterval = 1000,
}: {
  graphqlUrl: string,
  query: any,
  variables: Variables,
  enabled?: boolean,
  watch?: boolean,
  pollInterval?: number,
}) => {
  const client = useMemo(() => ql_client(graphqlUrl), [graphqlUrl]);
  const { data, loading: isLoading, refetch } = useQuery(query, {
    client,
    variables,
    skip: !enabled,
    pollInterval: (watch ? pollInterval : undefined),
  });
  return { data, isLoading, refetch };
};
