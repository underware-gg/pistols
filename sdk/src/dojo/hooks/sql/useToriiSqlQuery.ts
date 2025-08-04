import { useMemo } from "react";
import type { NoInfer, UseQueryOptions } from "@tanstack/react-query";
import { useToriiSQLQuery } from "@dojoengine/sdk/sql";
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { poseidonString } from "src/starknet/starknet";


export type UseSdkSqlQueryProps<Input, Output> = {
  query: string,
  formatFn: (rows: Input) => Output,
  defaultValue?: UseQueryOptions<Output>["placeholderData"],
  // if pageSize is provided, paginate the query
  pageSize?: number,
  pageIndex?: number,
}
export type UseSdkSqlQueryResult<Output> = {
  data: NoInfer<Output>,
  error: Error,
  isLoading: boolean,
  isRefetching: boolean,
  queryHash: bigint,
}

//---------------------------------------
// TokenBalances get/subscribe
//
// export function useSdkSqlQuery<Input, Output>({
export const useSdkSqlQuery = <Input, Output>({
  query,
  formatFn,
}: UseSdkSqlQueryProps<Input, Output>): UseSdkSqlQueryResult<Output> => {
  const { selectedNetworkConfig } = useDojoSetup()
  const {
    data,
    error,
    isPending,
    isRefetching,
  } = useToriiSQLQuery(
    query,
    formatFn,
    undefined,
    selectedNetworkConfig.sqlUrl,
  );
  const queryHash = useMemo(() => poseidonString(query), [query])
  return {
    data,
    error,
    isLoading: isPending,
    isRefetching,
    queryHash,
  }
}
