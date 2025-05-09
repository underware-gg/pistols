import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { formatQueryValue, getEntityModel, useSdkStateEntitiesSub } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { makePactPair } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const usePactPair = (address_a: BigNumberish, address_b: BigNumberish): bigint => {
  const pair = useMemo(() => makePactPair(address_a, address_b), [address_a, address_b])
  return pair
}

export const usePact = (duel_type: constants.DuelType, address_a: BigNumberish, address_b: BigNumberish, enabled: boolean) => {
  const pair = usePactPair(address_a, address_b)
  const query = useMemo<PistolsQueryBuilder>(() => (
    (duel_type !== constants.DuelType.Undefined && isPositiveBigint(pair))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Pact"],
            [formatQueryValue(constants.getDuelTypeValue(duel_type)), formatQueryValue(pair)]
          ).build()
        )
        .withEntityModels(
          ["pistols-Pact"]
        )
        .includeHashedKeys()
      : null
  ), [duel_type, pair])

  const { entities } = useSdkStateEntitiesSub({
    query,
    enabled,
  })
  const pact = useMemo(() => entities.map(e => getEntityModel<models.Pact>(e, 'Pact'))?.[0], [entities])
  // useEffect(() => console.log(`usePact()`, duel_type, bigintToHex(pair), pacts), [duel_type, pair, pacts])

  const pactDuelId = useMemo(() => BigInt(pact?.duel_id ?? 0n), [pact])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])

  return {
    pactDuelId,
    hasPact,
  }
}
