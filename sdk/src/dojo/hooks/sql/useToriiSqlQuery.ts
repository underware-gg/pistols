import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NoInfer, UseQueryOptions } from "@tanstack/react-query";
import { useToriiSQLQuery } from "@dojoengine/sdk/sql";
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { poseidonString } from "src/starknet/starknet";
import { queryToriiSqlRaw } from "src/utils/misc/sql";
import { QUERY_ONCE } from "src/utils/hooks/queryOnce";


export type UseSdkSqlQueryProps<Input, Output> = {
  query: string,
  formatFn: (rows: Input) => Output,
  toriiUrl?: string,
}
export type UseSdkSqlQueryResult<Output> = {
  data: NoInfer<Output>,
  error: Error,
  isLoading: boolean,
  isRefetching?: boolean,
  latency?: number,
  queryHash: bigint,
  refetch?: () => void,
}


//---------------------------------------
// Calls sql via Dojo sdk (tanstack)
//
export const useSdkSqlQuery = <Input, Output>({
  query,
  formatFn,
  toriiUrl,
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
    toriiUrl || selectedNetworkConfig.toriiUrl,
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


//---------------------------------------
// Calls sql directly (allows concurrent)
//
export const useSqlQuery = <Input, Output>({
  query,
  formatFn,
  toriiUrl,
}: UseSdkSqlQueryProps<Input, Output>): UseSdkSqlQueryResult<Output> => {
  const { selectedNetworkConfig } = useDojoSetup()
  const url = toriiUrl || selectedNetworkConfig.toriiUrl

  // Was a useEffect driving four useState calls. react-query owns the request
  // lifecycle instead, which is what react-hooks/set-state-in-effect was pointing
  // at: the mounted-flag dance, the manual loading flag and the reset-on-change
  // are all things it already does.
  //
  // Raw rows are cached by request identity. Formatting stays observer-local so
  // two consumers can safely use different output types for the same SQL.
  const { data, error, isLoading, refetch } = useQuery({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'sql', url, query],
    enabled: Boolean(query),
    queryFn: async () => {
      const startedAt = Date.now()
      const rows = await queryToriiSqlRaw<Input>(`${url}/sql`, query)
      return { rows, latency: Date.now() - startedAt }
    },
    select: ({ rows, latency }) => ({ result: formatFn(rows), latency }),
  })
  const refresh = useCallback(() => { void refetch() }, [refetch])

  const queryHash = useMemo(() => query ? poseidonString(query) : 0n, [query])

  return {
    data: data?.result,
    error: error as Error,
    isLoading,
    latency: data?.latency,
    queryHash,
    refetch: refresh,
  }
}
