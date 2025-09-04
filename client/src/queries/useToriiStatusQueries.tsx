import { useMemo } from 'react'
import { useSqlQuery } from '@underware/pistols-sdk/dojo/sql';

export const useToriiBlockHead = ({
  toriiUrl,
  blockNumber = 999999999, // to force update
  enabled = true,
}: {
  toriiUrl?: string,
  blockNumber?: number,
  enabled?: boolean,
}) => {
  const query = useMemo(() => (
    `select head from contracts where contract_type = "WORLD" and contract_type != "${blockNumber}"`
  ), [toriiUrl, blockNumber])
  const { data, isLoading, latency } = useSqlQuery({
    query: enabled ? query : null,
    formatFn: (rows) => Number(rows[0]?.head ?? 0),
    toriiUrl,
  });
  return {
    blockHead: data,
    isLoading,
    latency,
  }
}
