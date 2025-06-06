import { useEffect, useMemo } from 'react';
import { BigNumberish } from 'starknet';
import { useAccount } from '@starknet-react/core';
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { useTokenContracts } from '../hooks/useTokenContracts';
import { useFetchChallengeIds } from './challengeStore';
import { usePlayer } from '/src/stores/playerStore';
import { bigintToAddress, isPositiveBigint } from '@underware/pistols-sdk/utils';
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore';
import { constants } from '@underware/pistols-sdk/pistols/gen';


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

export const useQueryChallengeIds = (
  filterStates: constants.ChallengeState[],
  filterName: string,
  filterBookmarked: boolean,
  playerAddress: BigNumberish,
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
  pageSize = 8,
  pageIndex = 0,
) => {
  const { address } = useAccount()
  const { duelContractAddress } = useTokenContracts()
  const { bookmarkedDuels } = usePlayer(address)

  const { query } = useMemo(() => {
    const columns = ['A.duel_id', 'COUNT(*) OVER() AS count']
    const tables = [`'pistols-Challenge' A`]
    const conditions = []

    // filter by states, with special handling for required action duels
    conditions.push(`A.state in (${filterStates.map((s) => `"${s}"`).join(',')})`)

    // filter by player address
    if (isPositiveBigint(playerAddress)) {
      conditions.push(`(A.address_a="${bigintToAddress(playerAddress)}" or A.address_b="${bigintToAddress(playerAddress)}")`)
    }

    // filter by bookmarked duels
    if (filterBookmarked) {
      conditions.push(`A.duel_id=(select target_id from 'pistols-PlayerBookmarkEvent' where player_address="${bigintToAddress(playerAddress)}" and target_address="${bigintToAddress(duelContractAddress)}")`)
    }

    // filter by name
    if (filterName) {
      const filterNameLower = filterName.toLowerCase();
      // columns.push(`(select username from controllers where address=A.address_a) as name_a`);
      // columns.push(`(select username from controllers where address=A.address_b) as name_b`);
      // TORII 1.5.7 BUG:
      // controller address is not 0x0000 padded, so we remove '0x' and look the rest
      columns.push(`(select username from controllers where INSTR(A.address_a, SUBSTRING(address, 3, 64)) > 0) as name_a`);
      columns.push(`(select username from controllers where INSTR(A.address_b, SUBSTRING(address, 3, 64)) > 0) as name_b`);
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
      query += `\nlimit ${pageSize} offset ${(pageIndex ?? 0) * pageSize}`
    }

    return {
      query,
    }
  }, [filterStates, playerAddress, filterName, filterBookmarked, bookmarkedDuels, sortColumn, sortDirection, pageSize, pageIndex])

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });

  // fetch only NEW duels (not already in the store)
  useFetchChallengeIds(data?.duelIds ?? []);

  // useEffect(() => console.log('SQL QUERY:', query), [query])
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
