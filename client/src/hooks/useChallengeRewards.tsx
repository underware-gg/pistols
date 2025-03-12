import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { useSdkStateEventsGet, formatQueryValue, getEntityMapModels } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { weiToEth } from '@underware/pistols-sdk/utils/starknet'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useGetChallengeRewards = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    (isPositiveBigint(duel_id) && isPositiveBigint(duelist_id))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-ChallengeRewards"],
            [formatQueryValue(duel_id), formatQueryValue(duelist_id)]
          ).build()
        )
        .withEntityModels(
          ["pistols-ChallengeRewards"]
        )
        .includeHashedKeys()
      : null
  ), [duel_id, duelist_id])

  const { entities } = useSdkStateEventsGet({
    query,
    historical: false,
  })
  const rewards = useMemo(() => getEntityMapModels<models.ChallengeRewards>(entities, 'ChallengeRewards')?.[0]?.rewards, [entities])

  const fame_lost_wei = useMemo(() => BigInt(rewards?.fame_lost ?? 0), [rewards])
  const fame_gained_wei = useMemo(() => BigInt(rewards?.fame_gained ?? 0), [rewards])
  const fools_gained_wei = useMemo(() => BigInt(rewards?.fools_gained ?? 0), [rewards])
  // const fame_burned_wei = useMemo(() => BigInt(rewards?.fame_burned ?? 0), [rewards])
  // const lords_unlocked_wei = useMemo(() => BigInt(rewards?.lords_unlocked ?? 0), [rewards])

  const fame_lost_eth = useMemo(() => Number(weiToEth(fame_lost_wei)), [fame_lost_wei])
  const fame_gained_eth = useMemo(() => Number(weiToEth(fame_gained_wei)), [fame_gained_wei])
  const fools_gained_eth = useMemo(() => Number(weiToEth(fools_gained_wei)), [fools_gained_wei])
  // const fame_burned_eth = useMemo(() => Number(weiToEth(fame_burned_wei)), [fame_burned_wei])
  // const lords_unlocked_eth = useMemo(() => Number(weiToEth(lords_unlocked_wei)), [lords_unlocked_wei])

  return {
    hasProcessedRewards: Boolean(rewards),
    // on win...
    fame_gained_wei, fame_gained_eth,
    fools_gained_wei, fools_gained_eth,
    points_scored: rewards?.points_scored ?? 0,
    position: rewards?.position ?? 0,
    // on loss...
    fame_lost_wei, fame_lost_eth,
    survived: rewards?.survived ?? undefined,
  }
}
