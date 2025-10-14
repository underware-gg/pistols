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

export const useToriiTransactionCount = ({
  toriiUrl,
  enabled = true,
}: {
  toriiUrl?: string,
  enabled?: boolean,
}) => {
  const query = useMemo(() => (`
select "transactions" as type, count(*) as count from transactions
union all
select "entities" as type, count(*) as count from entities
union all
select "controllers" as type, count(*) as count from controllers
`), [toriiUrl])
  const { data, isLoading } = useSqlQuery({
    query: enabled ? query : null,
    formatFn: (rows: { type: string, count: string }[]) => rows.map(row => ({
      type: row.type,
      count: Number(row.count),
    })),
    toriiUrl,
  });
  return {  
    transactionCount: (data?.find(item => item.type === 'transactions')?.count ?? 0),
    entityCount: (data?.find(item => item.type === 'entities')?.count ?? 0),
    controllerCount: (data?.find(item => item.type === 'controllers')?.count ?? 0),
    isLoading,
  }
}
