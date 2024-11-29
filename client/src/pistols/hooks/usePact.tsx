import { useMemo, useEffect } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { isPositiveBigint } from '@/lib/utils/types'
import { bigintToU256, poseidon, stringToFelt } from '@/lib/utils/starknet'
import { PistolsGetQuery, useSdkGet, filterEntitiesByModel } from '@/lib/dojo/hooks/useSdkGet'
import * as models from '@/games/pistols/generated/typescript/models.gen'


export const usePactPair = (duelist_id_or_address_a: BigNumberish, duelist_id_or_address_b: BigNumberish): BigNumberish => {
  const pair = useMemo(() => {
    if (!isPositiveBigint(duelist_id_or_address_a) || !isPositiveBigint(duelist_id_or_address_b)) return 0n
    // same as pistols::libs::pact::make_pact_pair()
    const a_u256 = bigintToU256(duelist_id_or_address_a)
    const b_u256 = bigintToU256(duelist_id_or_address_b)
    const aa = poseidon([a_u256.low, a_u256.low])
    const bb = poseidon([b_u256.low, b_u256.low])
    const pair = bigintToU256(aa ^ bb).low
    return pair
  }, [duelist_id_or_address_a, duelist_id_or_address_b])
  return pair
}

export const usePact = (table_id: string, duelist_id_or_address_a: BigNumberish, duelist_id_or_address_b: BigNumberish) => {
  const pair = usePactPair(duelist_id_or_address_a, duelist_id_or_address_b)
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Pact: {
        $: {
          where: {
            table_id: { $eq: addAddressPadding(stringToFelt(table_id)) },
            pair: { $eq: addAddressPadding(pair) },
          },
        },
      },
    },
  }), [table_id, pair])
  
  const { entities, isLoading, refetch } = useSdkGet({ query })
  const pacts = useMemo(() => filterEntitiesByModel<models.Pact>(entities, 'Pact'), [entities])
  // useEffect(() => console.log(`usePact()`, pacts), [pacts])

  const pactDuelId = useMemo(() => BigInt(pacts?.[0]?.duel_id ?? 0n), [pacts])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])

  return {
    pactDuelId,
    hasPact,
  }
}
