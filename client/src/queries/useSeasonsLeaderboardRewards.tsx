import { useEffect, useMemo } from 'react'
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { models } from '@underware/pistols-sdk/pistols/gen'

// format returned by sql query
type QueryResponseRaw = Array<{
  data: string;
}>;
// format we need
type QueryResponse = {
  seasonId: number;
  leaderboardPosition: number;
  duelistId: bigint;
  recipient: bigint;
  peggedFame: bigint;
  peggedLords: bigint;
  sponsoredLords: bigint;
  // bill: models.LordsReleaseBill;
};
function formatFn(rows: QueryResponseRaw): QueryResponse[] {
  return rows.map((row) => {
    const event = JSON.parse(row.data) as models.LordsReleaseEvent;
    const result: QueryResponse = {
      seasonId: Number(event.season_id),
      //@ts-ignore
      leaderboardPosition: Number(event.bill.reason.LeaderboardPrize),
      duelistId: BigInt(event.bill.duelist_id),
      recipient: BigInt(event.bill.recipient),
      peggedFame: BigInt(event.bill.pegged_fame),
      peggedLords: BigInt(event.bill.pegged_lords),
      sponsoredLords: BigInt(event.bill.sponsored_lords),
      // bill: event.bill,
    }
    return result;
  });
}

export type SeasonLeaderboardPrizes = {
  totalLords: bigint;
  duelists: {
    [duelistId: string]: bigint;
  }
}

export const useSeasonsLeaderboardRewards = () => {
  const query = `select * from "event_messages_historical" where data like "%LeaderboardPrize%"`;
  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  const rewardsPerSeason = useMemo(() => {
    return data.reduce((acc, reward) => {
      if (!acc[reward.seasonId]) {
        acc[reward.seasonId] = {
          totalLords: 0n,
          duelists: {},
        };
      }
      const totalLords = (reward.peggedLords + reward.sponsoredLords);
      acc[reward.seasonId].totalLords += totalLords;
      acc[reward.seasonId].duelists[bigintToDecimal(reward.duelistId)] = totalLords;
      return acc;
    }, {} as Record<number, SeasonLeaderboardPrizes>);
  }, [data]);

  // useEffect(() => console.log(`leaderboardPrizes:`, data, prizesPerSeason), [data, prizesPerSeason]);

  return rewardsPerSeason;
}
