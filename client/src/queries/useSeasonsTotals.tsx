import { useEffect, useMemo } from 'react'
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql'

type QueryResponse = {
  season_id: number;
  duelist_count: number;
  player_count: number;
  duel_count: number;
};
function formatFn(rows: QueryResponse[]): QueryResponse[] {
  return rows;
}

export type SeasonTotals = {
  duelistCount: number;
  playerCount: number;
  duelCount: number;
}

export const useSeasonsTotals = () => {
  const query = `
select season_id,
(select count(*) from(
    select duelist_id_a from "pistols-Challenge" where season_id=A.season_id
    union
    select duelist_id_b from "pistols-Challenge" where season_id=a.season_id
)) as duelist_count,
(select count(*) from(
    select address_a from "pistols-Challenge" where season_id=A.season_id
    union
    select address_b from "pistols-Challenge" where season_id=a.season_id
)) as player_count,
count(*) duel_count
from "pistols-Challenge" A
group by season_id
`.replaceAll('\n', ' ');

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  const totalsPerSeason = useMemo(() => {
    return data.reduce((acc, total) => {
      if (!acc[total.season_id]) {
        acc[total.season_id] = {
          duelistCount: 0,
          playerCount: 0,
          duelCount: 0,
        };
      }
      acc[total.season_id].duelistCount += total.duelist_count;
      acc[total.season_id].playerCount += total.player_count;
      acc[total.season_id].duelCount += total.duel_count;
      return acc;
    }, {} as Record<number, SeasonTotals>);
  }, [data]);

  return totalsPerSeason;
}
