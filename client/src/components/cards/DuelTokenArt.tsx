import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { bigintToHex } from '@underware/pistols-sdk/utils'

export function DuelTokenArt({
  duelId,
  className,
  style = {},
}: {
  duelId: BigNumberish,
  className?: string,
  style?: React.CSSProperties,
}) {
  const { seasonId, duelType, premise, message, state, winner, duelistIdA, duelistIdB, duelistAddressA, duelistAddressB } = useChallenge(duelId)
  const { profileType: profileTypeA, profilePic: profilePicA } = useDuelist(duelistIdA)
  const { profileType: profileTypeB, profilePic: profilePicB } = useDuelist(duelistIdB)
  const { name: usernameA } = usePlayer(duelistAddressA)
  const { name: usernameB } = usePlayer(duelistAddressB)

  const props = useMemo<duel_token.DuelSvgProps>(() => ({
    duel_id: duelId,
    duel_type: duelType,
    premise,
    message,
    state,
    winner,
    season_id: seasonId,
    profile_type_a: profileTypeA,
    profile_type_b: profileTypeB,
    profile_id_a: profilePicA,
    profile_id_b: profilePicB,
    username_a: usernameA,
    username_b: usernameB,
    address_a: bigintToHex(duelistAddressA),
    address_b: bigintToHex(duelistAddressB),
  }), [duelId, seasonId, premise, message, state, winner, profileTypeA, profilePicA, profileTypeB, profilePicB, usernameA, usernameB, duelistAddressA, duelistAddressB])

  return <DuelTokenImage props={props} className={className} style={style} />
}
