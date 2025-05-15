import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useSdkEventsGetState, formatQueryValue, useEntitiesModel } from '@underware/pistols-sdk/dojo'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { models, constants } from '@underware/pistols-sdk/pistols/gen'

export const useDuelistFameOnDuel = (duel_id: BigNumberish, duelist_id: BigNumberish) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    (isPositiveBigint(duel_id) && isPositiveBigint(duelist_id))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-ChallengeRewardsEvent"],
            [undefined, formatQueryValue(duelist_id)]
          ).build()
        )
        .withEntityModels(
          ["pistols-ChallengeRewardsEvent"]
        )
        .includeHashedKeys()
      : null
  ), [duel_id, duelist_id])

  const { entities } = useSdkEventsGetState({ query })
  const events = useEntitiesModel<models.ChallengeRewardsEvent>(entities, 'ChallengeRewardsEvent')
  // useEffect(() => console.log(`FAME events...`, duel_id, duelist_id, events), [events])

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


//
// apparently we dont need this, events are already sorted by event_id
//

// const _useSortedRewardsEvents = (events: models.ChallengeRewardsEvent[]) => {
//   const needsSorting = (events.length > 1)
//   const query = useMemo<PistolsQueryBuilder>(() => (
//     needsSorting
//       ? new PistolsQueryBuilder()
//         .withClause(
//           new PistolsClauseBuilder().compose().or(
//             events.map(e =>
//               new PistolsClauseBuilder().keys(
//                 ["pistols-Challenge"],
//                 [formatQueryValue(e.duel_id)]
//               )
//             )
//           ).build()
//         )
//         .withEntityModels(
//           ["pistols-Challenge"]
//         )
//         .includeHashedKeys()
//       : null
//   ), [events, needsSorting])

//   const { entities } = useSdkEntitiesGetState({ query })
//   const challenges = useEntitiesModel<models.Challenge>(entities, 'Challenge')

//   const sortedEvents = useMemo(() => {
//     if (!needsSorting) return events
//     return [...events].sort((a, b) => {
//       const challengeA = challenges.find(c => bigintEquals(c.duel_id, a.duel_id))
//       const challengeB = challenges.find(c => bigintEquals(c.duel_id, b.duel_id))
//       return (Number(challengeB?.timestamps.end ?? 0)) - (Number(challengeA?.timestamps.end ?? 0))
//     })
//   }, [events, needsSorting, challenges])

//   useEffect(() => console.log(`FAME challenges...`, events.map(e => Number(e.duel_id)), '>', sortedEvents.map(e => Number(e.duel_id)), challenges), [events, sortedEvents, challenges])

//   return {
//     sortedEvents,
//   }
// }