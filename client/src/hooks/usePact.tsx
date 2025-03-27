import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { getEntityMapModels, formatQueryValue, useSdkStateEntitiesSub } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder, makePactPair } from '@underware/pistols-sdk/pistols'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const usePactPair = (address_a: BigNumberish, address_b: BigNumberish): bigint => {
  const pair = useMemo(() => makePactPair(address_a, address_b), [address_a, address_b])
  return pair
}

export const usePact = (table_id: string, address_a: BigNumberish, address_b: BigNumberish, enabled: boolean) => {
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
    enabled,
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
