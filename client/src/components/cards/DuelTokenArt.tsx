import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'

export function DuelistTokenArt({
  duelId,
  className,
  style = {},
}: {
  duelId: BigNumberish,
  className?: string,
  style?: React.CSSProperties,
}) {
  const { tableId, premise, quote, state, winner, duelistIdA, duelistIdB } = useChallenge(duelId)
  const { profileType: profileTypeA, profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profileType: profileTypeB, profilePic: profilePicB } = useDuelist(duelistIdB)

  const props = useMemo<duel_token.DuelSvgProps>(() => ({
    duel_id: duelId,
    table_id: tableId,
    premise,
    quote,
    state,
    winner,
    profile_type_a: profileTypeA,
    profile_id_a: profilePicA,
    profile_type_b: profileTypeB,
    profile_id_b: profilePicB,
  }), [duelId, tableId, premise, quote, state, winner, profileTypeA, profilePicA, profileTypeB, profilePicB])

  return <DuelTokenImage props={props} className={className} style={style} />
}
