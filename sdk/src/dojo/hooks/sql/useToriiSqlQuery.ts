import type { NoInfer, UseQueryOptions } from "@tanstack/react-query";
import { useDojoSetup } from "src/exports/dojo";
import { useToriiSQLQuery } from "@dojoengine/sdk/sql";


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
}

//---------------------------------------
// TokenBalances get/subscribe
//
// export function useSdkSqlQuery<Input, Output>({
export const useSdkSqlQuery = <Input, Output>({
  query,
  formatFn,
  defaultValue,
  pageSize,
  pageIndex,
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
    defaultValue,
    selectedNetworkConfig.sqlUrl,
  );
  return {
    data,
    error,
    isLoading: isPending,
    isRefetching,
  }
}
