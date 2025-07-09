import { useEffect, useMemo } from 'react'
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'

type QueryResponseRaw = {
  duelist_id: number;
  total_wins: number;
  total_losses: number;
};
type QueryResponse = {
  duelistId: string;
  wins: number;
  losses: number;
};
function formatFn(rows: QueryResponseRaw[]): QueryResponse[] {
  return rows.map((row) => ({
    duelistId: bigintToDecimal(row.duelist_id),
    wins: row.total_wins,
    losses: row.total_losses,
  }));
}

export type SeasonDuelistsStats = {
  wins: number;
  losses: number;
}

export const useSeasonDuelistsStats = (seasonId: number) => {
  const query = useMemo(() => (`
select duelist_id, sum(wins) as total_wins, sum(losses) as total_losses from (
  select duelist_id_a as duelist_id,
  SUM(CASE WHEN winner=1 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN winner<>1 THEN 1 ELSE 0 END) as losses
  from "pistols-Challenge"
  where season_id=${seasonId}
  and (state="Resolved" or state="Draw" or state="Expired")
  group by duelist_id
union all
  select duelist_id_b as duelist_id,
  SUM(CASE WHEN winner=2 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN winner<>2 THEN 1 ELSE 0 END) as losses
  from "pistols-Challenge"
  where season_id=${seasonId}
  and (state="Resolved" or state="Draw" or state="Expired")
  group by duelist_id
)
group by duelist_id
order by total_wins desc, total_losses asc
`.replaceAll('\n', ' ')), [seasonId]);

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  const duelistsStats = useMemo(() => {
    return data.reduce((acc, row) => {
      return {
        ...acc,
        [row.duelistId]: {
          wins: row.wins,
          losses: row.losses,
        },
      }
    }, {} as Record<string, SeasonDuelistsStats>);
  }, [data]);

  return duelistsStats;
}
