import { useMemo } from 'react'
import { PistolsClauseBuilder, PistolsQueryBuilder } from '@underware/pistols-sdk/pistols'
import { useSdkStateEventsGet, formatQueryValue, getEntityModel } from '@underware/pistols-sdk/dojo'
import { feltToString, parseCustomEnum, stringToFelt } from '@underware/pistols-sdk/utils/starknet'
import { models, constants } from '@underware/pistols-sdk/pistols/gen'

export const useLordsReleaseEvents = (season_table_id: string) => {
  const query = useMemo<PistolsQueryBuilder>(() => (
    (Boolean(season_table_id))
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ["pistols-LordsReleaseEvent"],
            [formatQueryValue(stringToFelt(season_table_id))]
          ).build()
        )
        .withEntityModels(
          ["pistols-LordsReleaseEvent"]
        )
        .withLimit(1000)
        .includeHashedKeys()
      : null
  ), [season_table_id])

  const { entities } = useSdkStateEventsGet({
    query,
    historical: true,
  })
  const events = useMemo(() => (
    entities.map(e => getEntityModel<models.LordsReleaseEvent>(e, 'LordsReleaseEvent'))
      .filter(Boolean) // TODO: remove when dojo.js#423 is fixed
  ), [entities])

  const bills = useMemo(() => (
    events.map(e => {
      const { variant, value } = parseCustomEnum<constants.ReleaseReason>(e.bill.reason)
      const bill = {
        seasonId: feltToString(e.season_table_id),
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
