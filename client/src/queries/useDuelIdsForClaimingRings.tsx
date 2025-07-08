import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core';
import { useSdkSqlQuery } from '@underware/pistols-sdk/dojo/sql';
import { bigintToAddress } from '@underware/pistols-sdk/utils';
import { constants } from '@underware/pistols-sdk/pistols/gen';

// format returned by sql query
type QueryResponseRaw = Array<{
  ring_type: string;
  duel_id: string;
  season_id: number;
}>;
// format we need
type QueryResponse = {
  ring_type: constants.RingType;
  duel_id: bigint;
  season_id: number;
};
function formatFn(rows: QueryResponseRaw): QueryResponse[] {
  return rows.map((row) => ({
    ring_type: row.ring_type as constants.RingType,
    duel_id: BigInt(row.duel_id),
    season_id: row.season_id,
  }));
}

export const useDuelIdsForClaimingRings = () => {
  const { address } = useAccount();

  const query = useMemo(() => {
    const _address = bigintToAddress(address);
    let queries = [
      `select "${constants.RingType.GoldSignetRing}" as ring_type, duel_id, season_id from "pistols-Challenge" where season_id=1 and (address_a="${_address}" or address_b="${_address}")`,
      `union all`,
      `select "${constants.RingType.SilverSignetRing}" as ring_type, duel_id, season_id from "pistols-Challenge" where season_id>=2 and season_id<=4 and (address_a="${_address}" or address_b="${_address}")`,
      `union all`,
      `select "${constants.RingType.LeadSignetRing}" as ring_type, duel_id, season_id from "pistols-Challenge" where season_id>=5 and season_id<=9 and (address_a="${_address}" or address_b="${_address}")`,
      `order by 3, 2`,
    ];
    return queries.join(' ');
  }, [address])

  const { data, isLoading, queryHash } = useSdkSqlQuery({
    query,
    formatFn,
  });
  // console.log ('SQL RINGS data', data)

  const goldRingDuelIds = useMemo(() => (
    data.filter((row) => (row.ring_type === constants.RingType.GoldSignetRing)).map((row) => row.duel_id)
  ), [data])
  const silverRingDuelIds = useMemo(() => (
    data.filter((row) => (row.ring_type === constants.RingType.SilverSignetRing)).map((row) => row.duel_id)
  ), [data])
  const leadRingDuelIds = useMemo(() => (
    data.filter((row) => (row.ring_type === constants.RingType.LeadSignetRing)).map((row) => row.duel_id)
  ), [data])
  
  // useEffect(() => {
  //   console.log("DUEL RINGS =>", goldRingDuelIds, silverRingDuelIds, leadRingDuelIds)
  // }, [goldRingDuelIds, silverRingDuelIds, leadRingDuelIds])

  return {
    goldRingDuelIds,
    silverRingDuelIds,
    leadRingDuelIds,
  }
}
