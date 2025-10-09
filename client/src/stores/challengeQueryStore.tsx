import { useEffect, useMemo } from 'react';
import { BigNumberish } from 'starknet';
import { useAccount } from '@starknet-react/core';
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { useTokenContracts } from '../hooks/useTokenContracts';
import { useFetchChallengeIds } from './challengeStore';
import { usePlayer } from '/src/stores/playerStore';
import { useCurrentSeason } from '/src/stores/seasonStore';
import { bigintToAddress, bigintToHex128, isPositiveBigint } from '@underware/pistols-sdk/utils';
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore';
import { constants } from '@underware/pistols-sdk/pistols/gen';
import { useCallToChallenges } from './eventsModelStore';


//--------------------------------
// SQL query hooks
// use SQL to find Duel IDs and add to challengeStore
//

// format returned by sql query
type UseQueryChallengeIdsResponseRaw = Array<{
  duel_id: string;
  count: number;
}>;
// format we need
type UseQueryChallengeIdsResponse = {
  duelIds: bigint[];
  totalCount: number;
};
function formatFn(rows: UseQueryChallengeIdsResponseRaw): UseQueryChallengeIdsResponse {
  return {
    duelIds: rows.map((row) => BigInt(row.duel_id)),
    totalCount: rows[0]?.count ?? 0,
  };
}

export const useQueryChallengeIdsForMatchmaking = (
  duelType: constants.DuelType,
) => {
  const { requiredDuelIds } = useCallToChallenges();

  const { query } = useMemo(() => {
    const columns = ["A.duel_id", "COUNT(*) OVER() AS count"];
    const tables = [`'pistols-Challenge' A`];
    const conditions = [];

    // filter by duel type - handle both ranked and unranked modes
    conditions.push(`(A.duel_type = "${duelType}")`);

    // filter to only include duel IDs that are in requiredDuelIds
    conditions.push(
      `A.duel_id in (${requiredDuelIds
        .map((id) => `"${bigintToHex128(id)}"`)
        .join(",")})`
    );

    // build query
    let query = `select ${columns.join(", ")}`;
    query += `\nfrom ${tables.join(", ")}`;
    if (conditions.length > 0) {
      query += `\nwhere ${conditions.join(" and ")}`;
    }

    return { query };
  }, [duelType, requiredDuelIds]);

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  // If no required duel IDs, return empty results immediately
  if (requiredDuelIds.length === 0) {
    return {
      challengeIds: [],
      totalCount: 0,
      isLoading: false,
      queryHash: 0n,
    };
  }

  return {
    challengeIds: data?.duelIds ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    queryHash,
  };
}

export const useQueryChallengeIds = (
  filterStates: constants.ChallengeState[],
  filterName: string,
  filterBookmarked: boolean,
  playerAddress: BigNumberish,
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
  filterSeason: number,
  filterDuelType: 'all' | 'ranked' | 'casual' | 'practice' = 'all',
  pageSize = 8,
  pageStartIndex = 0,
  pageFetchCount = 2,
) => {
  const { address } = useAccount()
  const { duelContractAddress } = useTokenContracts()
  const { bookmarkedDuels } = usePlayer(address)
  const { seasonId: currentSeasonId } = useCurrentSeason()
  const { requiredDuelIds } = useCallToChallenges()

  console.log('useQueryChallengeIds() =>', requiredDuelIds)

  const { query } = useMemo(() => {
    const columns = ['A.duel_id', 'COUNT(*) OVER() AS count']
    const tables = [`'pistols-Challenge' A`]
    const conditions = []

    // filter by states
    let filterCondition = `(A.state in (${filterStates.map((s) => `"${s}"`).join(',')})`;
    // handle required action duels
    if (requiredDuelIds.length > 0) {
      if (filterStates.includes(constants.ChallengeState.InProgress)) {
        filterCondition += ` or A.duel_id in (${requiredDuelIds.map((id) => `"${bigintToHex128(id)}"`).join(',')})`;
      } else if (filterStates.includes(constants.ChallengeState.Resolved)) {
        filterCondition += ` and A.duel_id not in (${requiredDuelIds.map((id) => `"${bigintToHex128(id)}"`).join(',')})`;
      }
    }
    filterCondition += `)`;
    conditions.push(filterCondition)

    // filter by duel type
    if (filterDuelType !== 'all') {
      if (filterDuelType === 'ranked') {
        conditions.push(`(A.duel_type = "${constants.DuelType.Ranked}")`)
      } else if (filterDuelType === 'practice') {
        conditions.push(`(A.duel_type = "${constants.DuelType.Practice}")`)
      } else if (filterDuelType === 'casual') {
        conditions.push(`(A.duel_type not in ("${constants.DuelType.Ranked}", "${constants.DuelType.Practice}"))`)
      }
    }

    // filter by player address
    if (isPositiveBigint(playerAddress)) {
      conditions.push(`(A.address_a="${bigintToAddress(playerAddress)}" or A.address_b="${bigintToAddress(playerAddress)}")`)
    }

    // filter by season
    if (filterSeason > 0) {
      if (filterSeason == currentSeasonId) {
        conditions.push(`(A.season_id=0 or A.season_id=${filterSeason})`)
      } else {
        conditions.push(`A.season_id=${filterSeason}`)
      }
    }

    // filter by bookmarked duels
    if (filterBookmarked) {
      conditions.push(`A.duel_id=(select target_id from 'pistols-PlayerBookmarkEvent' where player_address="${bigintToAddress(playerAddress)}" and target_address="${bigintToAddress(duelContractAddress)}")`)
    }

    // filter by name
    if (filterName) {
      const filterNameLower = filterName.toLowerCase();
      columns.push(`(select username from controllers where address=A.address_a) as name_a`);
      columns.push(`(select username from controllers where address=A.address_b) as name_b`);
      conditions.push(`(name_a like '%${filterNameLower}%' or name_b like '%${filterNameLower}%')`)
    }

    // build query
    let query = `select ${columns.join(', ')}`
    query += `\nfrom ${tables.join(', ')}`
    if (conditions.length > 0) {
      query += `\nwhere ${conditions.join(' and ')}`
    }

    // sort...
    const sort_column = (sortColumn == ChallengeColumn.Status ? `state` : `MAX(A."timestamps.start", A."timestamps.end")`);
    const sort_direction = (sortDirection == SortDirection.Ascending ? `ASC` : `DESC`);
    query += `\norder by ${sort_column} ${sort_direction}`

    if (pageSize > 0) {
      query += `\nlimit ${pageSize * pageFetchCount} offset ${(pageStartIndex ?? 0) * pageSize}`
    }

    console.log('CHALLENGE SQL QUERY:', query)

    return {
      query,
    }
  }, [filterStates, playerAddress, filterName, filterBookmarked, bookmarkedDuels, filterSeason, filterDuelType, sortColumn, sortDirection, pageSize, pageStartIndex, pageFetchCount, requiredDuelIds])

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  console.log('useQueryChallengeIds() DATA =>', data?.duelIds)

  // fetch only NEW duels (not already in the store)
  useFetchChallengeIds(data?.duelIds ?? []);

  useEffect(() => console.log('CHALLENGE SQL QUERY:', query), [query])
  // useEffect(() => console.log('SQL CHALLENGE IDs:', isLoading, data), [isLoading, data])

  const totalCount = useMemo(() => (data?.totalCount ?? 0), [data?.totalCount])
  const pageCount = useMemo(() => (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0), [totalCount, pageSize])

  return {
    challengeIds: data?.duelIds ?? [],
    totalCount,
    pageCount,
    isLoading,
    queryHash,
  }
}
