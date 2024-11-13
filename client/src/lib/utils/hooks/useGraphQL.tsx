import { useMemo } from "react";
import { ApolloClient, InMemoryCache, useQuery } from "@apollo/client";

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

export const useGraphQLQuery = (
  toriiUrl: string,
  query: any,
  variables?: Variables,
  skip?: boolean,
  watch?: boolean,
) => {
  const client = useMemo(() => {
    return ql_client(toriiUrl);
  }, [toriiUrl]);
  const { data, refetch } = useQuery(query, {
    client: client,
    variables: variables,
    skip: skip,
    pollInterval: (watch ? 1000 : undefined),
  });
  return { data, refetch };
};
