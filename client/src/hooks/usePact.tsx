import { useMemo, useEffect } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { isPositiveBigint, bigintToU256, poseidon, stringToFelt } from '@underware_gg/pistols-sdk/utils'
import { useSdkState, getEntityMapModels } from '@underware_gg/pistols-sdk/dojo'
import { PistolsGetQuery, PistolsSubQuery, models } from '@underware_gg/pistols-sdk/pistols'


export const usePactPair = (address_a: BigNumberish, address_b: BigNumberish): BigNumberish => {
  const pair = useMemo(() => {
    if (!isPositiveBigint(address_a) || !isPositiveBigint(address_b)) return 0n
    // same as pistols::models::pact::make_pair()
    const a_u256 = bigintToU256(address_a)
    const b_u256 = bigintToU256(address_b)
    const pair = (BigInt(a_u256.low) ^ BigInt(b_u256.low))
    return pair
  }, [address_a, address_b])
  return pair
}

export const usePact = (table_id: string, address_a: BigNumberish, address_b: BigNumberish) => {
  const pair = usePactPair(address_a, address_b)
  const query_get = useMemo<PistolsGetQuery>(() => ({
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
  const query_sub = useMemo<PistolsSubQuery>(() => ({
    pistols: {
      Pact: {
        $: {
          where: {
            table_id: { $is: addAddressPadding(stringToFelt(table_id)) },
            pair: { $is: addAddressPadding(pair) },
          },
        },
      },
    },
  }), [table_id, pair])
  
  const { entities } = useSdkState({ query_get, query_sub })
  const pacts = useMemo(() => getEntityMapModels<models.Pact>(entities, 'Pact'), [entities])
  // useEffect(() => console.log(`usePact()`, pacts), [pacts])

  const pactDuelId = useMemo(() => BigInt(pacts?.[0]?.duel_id ?? 0n), [pacts])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])

  return {
    pactDuelId,
    hasPact,
  }
}
