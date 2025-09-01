import { useEffect, useMemo, useState } from "react";
import type { NoInfer, UseQueryOptions } from "@tanstack/react-query";
import { useToriiSQLQuery } from "@dojoengine/sdk/sql";
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { poseidonString } from "src/starknet/starknet";
import { queryToriiSql } from "src/utils/misc/sql";


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
  const [data, setData] = useState<Output | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [latency, setLatency] = useState<number>();
  const [error, setError] = useState<Error>();
  const { selectedNetworkConfig } = useDojoSetup()

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      setIsLoading(true);
      setError(undefined);
      try {
        const startTime = Date.now();
        const result = await queryToriiSql<Input, Output>(
          `${toriiUrl || selectedNetworkConfig.toriiUrl}/sql`,
          query,
          formatFn,
        );
        const endTime = Date.now();
        if (_mounted) {
          setData(result);
          setIsLoading(false);
          setLatency(endTime - startTime);
        }
      } catch (e) {
        console.error(e)
        if (_mounted) {
          setIsLoading(false);
          setLatency(0);
          setError(e as Error);
        }
      }
    }
    setData(undefined);
    if (query) {
      _fetch()
    }
    return () => {
      _mounted = false
    }
  }, [query, toriiUrl])

  const queryHash = useMemo(() => query ? poseidonString(query) : 0n, [query])

  return {
    data,
    error,
    isLoading,
    latency,
    queryHash,
  }
}
