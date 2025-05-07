import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { useSdkStateEventsGet, formatQueryValue, getEntityModel } from '@underware/pistols-sdk/dojo'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useGetChallengeRewards = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    (isPositiveBigint(duel_id) && isPositiveBigint(duelist_id))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-ChallengeRewardsEvent"],
            [formatQueryValue(duel_id), formatQueryValue(duelist_id)]
          ).build()
        )
        .withEntityModels(
          ["pistols-ChallengeRewardsEvent"]
        )
        .includeHashedKeys()
      : null
  ), [duel_id, duelist_id])

  const { entities } = useSdkStateEventsGet({
    query,
    retryInterval: 1000,
  })
  const rewards = useMemo(() => getEntityModel<models.ChallengeRewardsEvent>(entities?.[0], 'ChallengeRewardsEvent')?.rewards, [entities])

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

  const getPositionText = (position: number | undefined) => {
    if (!position) return '';
    
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const specialCase = position % 100;
    const suffix = (specialCase >= 11 && specialCase <= 13) ? 'th' : 
                  suffixes[position % 10] || 'th';
    
    return `${position}${suffix} Place`;
  }

  return {
    hasProcessedRewards: Boolean(rewards),
    // on win...
    fame_gained_wei, fame_gained_eth,
    fools_gained_wei, fools_gained_eth,
    points_scored: rewards?.points_scored ?? 0,
    position: rewards?.position ?? 0,
    position_string: getPositionText(Number(rewards?.position)),
    // on loss...
    fame_lost_wei, fame_lost_eth,
    survived: rewards?.survived ?? undefined,
  }
}
