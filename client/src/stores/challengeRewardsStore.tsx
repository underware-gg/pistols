import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { formatQueryValue, useAllStoreModels, useSdkEventsGet } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, PistolsQueryBuilder, PistolsClauseBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { bigintEquals, bigintToDecimal } from '@underware/pistols-sdk/utils'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { useChallengeRewardsFetchStore } from '/src/stores/fetchStore'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { debug } from '@underware/pistols-sdk/pistols'

export const useChallengeRewardsStore = createDojoStore<PistolsSchemaType>();


//------------------------------------------------
// consummer hooks
//

// get a single reward event for a duelist on a duel
export const useChallengeRewardsEvent = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  const entities = useChallengeRewardsStore((state) => state.entities);
  const allEvents = useAllStoreModels<models.ChallengeRewardsEvent>(entities, 'ChallengeRewardsEvent')

  const results = useMemo<models.ChallengeRewardsEvent[]>(() => (
    allEvents.filter((event) => bigintEquals(event.duel_id, duel_id) && bigintEquals(event.duelist_id, duelist_id))
  ), [allEvents, duel_id, duelist_id])

  return results[0] ?? null
}

// get all rewards for a duelist
export const useDuelistChallengeRewardsEvents = (duelist_id: BigNumberish) => {
  const entities = useChallengeRewardsStore((state) => state.entities);
  const allEvents = useAllStoreModels<models.ChallengeRewardsEvent>(entities, 'ChallengeRewardsEvent')

  const results = useMemo<models.ChallengeRewardsEvent[]>(() => (
    allEvents.filter((event) => bigintEquals(event.duelist_id, duelist_id))
  ), [allEvents, duelist_id])

  return results
}


//------------------------------------------------
// rewards for a duelist on a duel
//
export const useChallengeRewards = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  // fetch if not in the store...
  // NO NEED! rewards are fetched with Duelists!
  // useFetchChallengeRewardsByDuelist(duelist_id)

  const event = useChallengeRewardsEvent(duel_id, duelist_id)
  const rewards = useMemo<models.RewardValues>(() => (event?.rewards), [event])

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

export const useDuelistFameOnDuel = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  const events = useDuelistChallengeRewardsEvents(duelist_id)

  const { fameBefore, fameAfter } = useMemo(() => {
    let fameBefore = constants.FAME.MINT_GRANT_AMOUNT;
    let fameAfter = fameBefore
    for (const event of [...events].reverse()) {
      // amount this reward...
      if (BigInt(event.rewards.fame_gained) > 0n) {
        fameAfter = fameAfter + BigInt(event.rewards.fame_gained)
      } else if (BigInt(event.rewards.fame_lost) > 0n) {
        fameAfter = fameAfter - BigInt(event.rewards.fame_lost)
      }
      // console.log(`FAME duel...`, duelist_id, event.duel_id, '=', weiToEth(fameBefore), '>', weiToEth(fameAfter))
      // if this is the duel we want, stop!
      if (bigintEquals(event.duel_id, duel_id)) {
        break
      }
      // use updated fame for next duel...
      fameBefore = fameAfter
    }
    return { fameBefore, fameAfter }
  }, [events])

  return {
    fameBefore,
    fameAfter,
  }
}







//------------------------------------------------
// Fetch past rewards to the store, by duelist
//

export const useFetchChallengeRewardsByDuelist = (duelistId: BigNumberish) => {
  const duelistIds = useMemo(() => [duelistId], [duelistId])
  return useFetchChallengeRewardsByDuelistIds(duelistIds)
}

export const useFetchChallengeRewardsByDuelistIds = (duelistIds: BigNumberish[]) => {
  const setEntities = useChallengeRewardsStore((state) => state.setEntities);
  const fetchState = useChallengeRewardsFetchStore((state) => state);

  const newDuelistIds = useMemo(() => (
    fetchState.getNewIds(duelistIds)
  ), [duelistIds, fetchState.ids])

  const query = useMemo<PistolsQueryBuilder>(() => (
    newDuelistIds.length > 0
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().where(
            "pistols-ChallengeRewardsEvent",
            "duelist_id",
            "In",
            newDuelistIds.map(formatQueryValue)
          ).build()
        )
        .withEntityModels(
          ["pistols-ChallengeRewardsEvent"]
        )
        .includeHashedKeys()
      : null
  ), [newDuelistIds])

  const { isLoading, isFinished } = useSdkEventsGet({
    query,
    // enabled: !result.challengeExists,
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`useFetchChallengeRewardsByDuelistIds() GOT`, newDuelistIds.map(bigintToDecimal), entities);
      fetchState.setFetchedIds(newDuelistIds.map(BigInt));
      setEntities(entities);
    },
  })

  // useEffect(() => {
  //   console.log(`::useFetchChallengeRewardsByDuelistIds...`, isLoading, isFinished, newDuelistIds, fetchState.ids.length)
  // }, [isLoading, isFinished, newDuelistIds.length, fetchState.ids.length])

  return {
    isLoading,
    isFinished,
  }
}


