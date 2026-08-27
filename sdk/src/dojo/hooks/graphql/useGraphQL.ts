import { useMemo } from 'react'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

//---------------------------
// QL Client
// https://www.apollographql.com/docs/react/data/queries
//
export const ql_client = (GQLUrl: string) => {
  return new ApolloClient({
    link: new HttpLink({ uri: GQLUrl }),
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
    cache: new InMemoryCache(),
  });
};

type Variables = Record<string, string | number | number[] | boolean | null | undefined | Date>;

export const useGraphQLQuery = <TData = unknown>({
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
  const { data, loading: isLoading, refetch } = useQuery<TData>(query, {
    client,
    variables,
    skip: !enabled,
    pollInterval: (watch ? pollInterval : undefined),
  });
  return { data, isLoading, refetch };
};
