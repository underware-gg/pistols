import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { bigintToAddress, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useEntityModel, useSdkEntitiesGetState, useSdkEntitiesSubState } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { make_pact_pair } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

const usePactQuery = (duel_type: constants.DuelType, address_a: BigNumberish, address_b: BigNumberish): PistolsQueryBuilder => {
  const pair = useMemo(() => make_pact_pair(address_a, address_b), [address_a, address_b])
  const query = useMemo<PistolsQueryBuilder>(() => (
    (duel_type !== constants.DuelType.Undefined && isPositiveBigint(pair))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-Pact"],
            [bigintToAddress(constants.getDuelTypeValue(duel_type)), bigintToAddress(pair)]
          ).build()
        )
        .withEntityModels(
          ["pistols-Pact"]
        )
        .includeHashedKeys()
      : null
  ), [duel_type, pair])
  return query
}

export const usePactGet = (duel_type: constants.DuelType, address_a: BigNumberish, address_b: BigNumberish) => {
  const query = usePactQuery(duel_type, address_a, address_b)
  const { entities } = useSdkEntitiesGetState({
    query,
    enabled: (isPositiveBigint(address_a) && isPositiveBigint(address_b)),
  })
  const pact = useEntityModel<models.Pact>(entities?.[0], 'Pact')
  const pactDuelId = useMemo(() => BigInt(pact?.duel_id ?? 0n), [pact])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])
  // useEffect(() => console.log(`usePactGet()`, duel_type, bigintToHex(pair), pacts), [duel_type, pair, pacts])
  return {
    pactDuelId,
    hasPact,
  }
}

export const usePactSubscription = (duel_type: constants.DuelType, address_a: BigNumberish, address_b: BigNumberish, enabled: boolean) => {
  const query = usePactQuery(duel_type, address_a, address_b)
  const { entities } = useSdkEntitiesSubState({
    query,
    enabled: (enabled && isPositiveBigint(address_a) && isPositiveBigint(address_b)),
  })
  const pact = useEntityModel<models.Pact>(entities?.[0], 'Pact')
  const pactDuelId = useMemo(() => BigInt(pact?.duel_id ?? 0n), [pact])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])
  // useEffect(() => console.log(`usePactSubscription()`, duel_type, bigintToHex(pair), pacts), [duel_type, pair, pacts])
  return {
    pactDuelId,
    hasPact,
  }
}
