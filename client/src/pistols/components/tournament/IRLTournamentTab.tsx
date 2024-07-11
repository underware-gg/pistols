import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Grid, Table } from 'semantic-ui-react'
import { Entity, HasValue } from '@dojoengine/recs'
import { useAccount } from '@starknet-react/core'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useEntityQuery } from '@dojoengine/react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { arrayUnique, bigintEquals, bigintToHex, entityIdToKey } from '@/lib/utils/types'
import { useOpener } from '@/lib/ui/useOpener'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import IRLTournamentModal from '@/pistols/components/tournament/IRLTournamentModal'
import { ChallengeState } from '@/pistols/utils/pistols'
import { usePlayerId } from '@/lib/dojo/hooks/usePlayerId'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { BigNumberish } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column


export const useChallengeToSelf = () => {
  const { address } = useAccount()
  const { Challenge } = useDojoComponents()
  const ids_a: Entity[] = useEntityQuery([HasValue(Challenge, { address_a: BigInt(address ?? 0n), state: ChallengeState.Awaiting })]) ?? []
  const ids_b: Entity[] = useEntityQuery([HasValue(Challenge, { address_a: BigInt(address ?? 0n), state: ChallengeState.InProgress })]) ?? []
  const ids_c: Entity[] = useEntityQuery([HasValue(Challenge, { address_b: BigInt(address ?? 0n), state: ChallengeState.Awaiting })]) ?? []
  const ids_d: Entity[] = useEntityQuery([HasValue(Challenge, { address_b: BigInt(address ?? 0n), state: ChallengeState.InProgress })]) ?? []
  const ids = useMemo(() => arrayUnique([...ids_a, ...ids_b, ...ids_c, ...ids_d]), [ids_a, ids_b, ids_c, ids_d])
  const duelKey = useMemo(() => (ids[0] ?? ids[0] ?? null), [ids])
  const duelId = useMemo(() => (duelKey ? entityIdToKey(Challenge, 'duel_id', duelKey) : null), [duelKey])
  return {
    duelId
  }
}


export const useTornaDuelistIds = () => {
  const { playerId } = usePlayerId()
  const duelistIds = useMemo(() => {
    let ids = playerId?.split(',') ?? []
    return ids.length == 3 ? ids.map(v => Number(v)) : []
  }, [playerId])
  return {
    duelistIds,
    validIds: (duelistIds.length == 3),
  }
}


export const useTornaChallenge = () => {
  const { duelId } = useChallengeToSelf()
  const { duelistId } = useSettings()
  const { duelistIdA, duelistIdB, state, isLive, isAwaiting, isInProgress } = useChallenge(duelId ?? 0)
  const iAmChallenger = useMemo(() => bigintEquals(duelistId, duelistIdA), [duelistId, duelistIdA])
  const iAmChallenged = useMemo(() => bigintEquals(duelistId, duelistIdB), [duelistId, duelistIdB])
  return {
    duelId,
    iAmChallenger,
    iAmChallenged,
    state, isLive, isAwaiting, isInProgress,
  }
}

export function IRLTournamentTab() {
  const { duelId, iAmChallenger, iAmChallenged, state, isLive, isAwaiting, isInProgress } = useTornaChallenge()
  const { dispatchSelectDuel } = usePistolsContext()

  // modal control
  const inChallenge = (duelId && (isInProgress || (isAwaiting && iAmChallenger)))
  const opener = useOpener()
  const _open = () => {
    if (inChallenge) {
      opener.close()
      dispatchSelectDuel(duelId)
    } else {
      opener.open()
    }
  }

  // detect new challenge
  useEffect(() => {
    if (inChallenge && opener.isOpen) {
      _open()
    }
  }, [inChallenge, opener.isOpen])

  const { validIds } = useTornaDuelistIds()

  const _disabled = (!validIds)

  return (
    <div>
      <Divider hidden />

      <Grid>
        <Row columns={'equal'}>
          <Col></Col>
          <Col>
            <ActionButton fill disabled={_disabled} label='Challenge!' onClick={() => _open()} />
          </Col>
          <Col></Col>
        </Row>
      </Grid>

      <IRLTournamentModal opener={opener} inChallenge={inChallenge}/>      
    </div>
  )
}

