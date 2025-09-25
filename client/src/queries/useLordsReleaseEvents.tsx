import { useMemo } from 'react'
import { PistolsClauseBuilder, PistolsHistoricalQueryBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useSdkEventsGetState, useEntitiesModel } from '@underware/pistols-sdk/dojo'
import { useMemoGate } from '@underware/pistols-sdk/utils/hooks'
import { parseCustomEnum } from '@underware/pistols-sdk/starknet'
import { bigintToAddress } from '@underware/pistols-sdk/utils'
import { models, constants } from '@underware/pistols-sdk/pistols/gen'

export type Bill = {
  seasonId: number,
  duelistId: bigint,
  duelId: bigint,
  timestamp: number,
  recipient: bigint,
  reason: constants.ReleaseReason,
  position: number,
  peggedFame: bigint,
  peggedLords: bigint,
  sponsoredLords: bigint,
}

export const useLordsReleaseEvents = (season_id: number) => {
  const query = useMemoGate<PistolsHistoricalQueryBuilder>(() => (
    new PistolsHistoricalQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          ["pistols-LordsReleaseEvent"],
          [bigintToAddress(season_id)]
        ).build()
      )
      .withEntityModels(
        ["pistols-LordsReleaseEvent"]
      )
      .withLimit(2000)
      .includeHashedKeys()
  ), [season_id])

  const { entities } = useSdkEventsGetState({
    query,
  })
  const events = useEntitiesModel<models.LordsReleaseEvent>(entities, 'LordsReleaseEvent')

  const bills = useMemo(() => (
    events.map(e => {
      const { variant, value } = parseCustomEnum<constants.ReleaseReason, number>(e.bill.reason)
      const bill: Bill = {
        seasonId: Number(e.season_id),
        duelistId: BigInt(e.bill.duelist_id),
        duelId: BigInt(e.duel_id ?? 0),
        timestamp: Number(e.timestamp),
        recipient: BigInt(e.bill.recipient),
        reason: variant,
        position: value,
        peggedFame: BigInt(e.bill.pegged_fame),
        peggedLords: BigInt(e.bill.pegged_lords),
        sponsoredLords: BigInt(e.bill.sponsored_lords),
      }
      return bill
    }).sort((a, b) => (a.timestamp - b.timestamp))
  ), [events])

  console.log(`useLordsReleaseEvents() => entities(${entities.length})`, entities, events, bills)

  return {
    bills,
  }
}
