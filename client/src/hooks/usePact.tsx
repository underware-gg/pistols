import { useMemo, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { isPositiveBigint, bigintToU256, stringToFelt, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { useSdkState, getEntityMapModels, formatQueryValue } from '@underware_gg/pistols-sdk/dojo'
import { PistolsGetQuery, PistolsSubQuery, models } from '@underware_gg/pistols-sdk/pistols'


// IMPORTANT!!!
// must be in sync with:
// pistols::models::pact::PactTrait::make_pair()
export const usePactPair = (address_a: BigNumberish, address_b: BigNumberish): bigint => {
  const pair = useMemo(() => {
    const aa = BigInt(bigintToU256(address_a ?? 0).low)
    const bb = BigInt(bigintToU256(address_b ?? 0).low)
    const pair = (aa && bb) ? (aa ^ bb) : 0n
    // console.log(`usePactPair()`, bigintToHex(aa), '^', bigintToHex(bb), ':', bigintToHex(pair))
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
            table_id: { $eq: formatQueryValue(stringToFelt(table_id)) },
            pair: { $eq: formatQueryValue(pair) },
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
            table_id: { $is: formatQueryValue(stringToFelt(table_id)) },
            pair: { $is: formatQueryValue(pair) },
          },
        },
      },
    },
  }), [table_id, pair])
  
  const { entities } = useSdkState({
    query_get,
    query_sub,
    enabled: (Boolean(table_id) && isPositiveBigint(pair)),
  })
  const pacts = useMemo(() => getEntityMapModels<models.Pact>(entities, 'Pact'), [entities])
  // useEffect(() => console.log(`usePact()`, bigintToHex(stringToFelt(table_id)), bigintToHex(pair), pacts), [table_id, pair, pacts])

  const pactDuelId = useMemo(() => BigInt(pacts?.[0]?.duel_id ?? 0n), [pacts])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])

  return {
    pactDuelId,
    hasPact,
  }
}
