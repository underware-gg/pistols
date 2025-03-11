import { useMemo, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { isPositiveBigint, bigintToU256, stringToFelt, bigintToHex } from '@underware/pistols-sdk/utils'
import { getEntityMapModels, formatQueryValue, useSdkStateEntitiesSub } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { models } from '@underware/pistols-sdk/pistols/gen'


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
  // const query_get = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     Pact: {
  //       $: {
  //         where: {
  //           table_id: { $eq: formatQueryValue(stringToFelt(table_id)) },
  //           pair: { $eq: formatQueryValue(pair) },
  //         },
  //       },
  //     },
  //   },
  // }), [table_id, pair])
  const query = useMemo<PistolsQueryBuilder>(() => (
    (Boolean(table_id) && isPositiveBigint(pair))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Pact"],
            [formatQueryValue(stringToFelt(table_id)), formatQueryValue(pair)]
          ).build()
        )
        .withEntityModels(
          ["pistols-Pact"]
        )
        .includeHashedKeys()
      : null
  ), [table_id, pair])

  const { entities } = useSdkStateEntitiesSub({
    query,
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
