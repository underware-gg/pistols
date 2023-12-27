import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Segment, Icon, Step } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { useDuel } from '@/pistols/hooks/useDuel'
import { RoundState } from '../utils/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function Duel({
  duelId
}) {
  const { dispatchSetDuel } = usePistolsContext()
  const { state, message, duelistA, duelistB, winner, lords } = useChallenge(duelId)
  const { account } = useDojoAccount()

  useEffect(() => dispatchSetDuel(duelId), [duelId])

  return (
    <>
      <div className='TavernTitle'>
        <h1>A Duel!</h1>
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelDuelist duelId={duelId} floated='left' address={duelistA} />
        </div>
        <DuelProgress duelId={duelId} isPlaying={BigInt(account?.address) == duelistA} address={duelistA} floated='left' />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelDuelist duelId={duelId} floated='right' address={duelistB} />
        </div>
        <DuelProgress duelId={duelId} isPlaying={BigInt(account?.address) == duelistB} address={duelistB} floated='right' />
      </div>
    </>
  )
}

function DuelDuelist({
  duelId,
  address,
  floated,
}) {
  const { name, profilePic } = useDuelist(address)

  return (
    <>
      {floated == 'left' &&
        <Segment compact className='NoMargin'>
          <ProfilePic duel profilePic={profilePic} />
        </Segment>
      }
      <Segment compact floated={floated} className='NoMargin'>
        <ProfileDescription address={address} />
      </Segment>
      {floated == 'right' &&
        <Segment compact className='NoMargin'>
          <ProfilePic duel profilePic={profilePic} />
        </Segment>
      }
    </>
  )
}

enum DuelStage {
  Disabled,
  Active,
  Finished,
}

function DuelProgress({
  duelId,
  isPlaying,
  address,
  floated,
}) {
  const { challenge, round1, round2 } = useDuel(duelId)

  const pistolsCommitComplete = useMemo(() => (false), [round1])
  const pistolsRevealComplete = useMemo(() => (false), [round1])

  const states = useMemo(() => {
    let result: any = {
      pistols: round1?.state ?? RoundState.Null,
      blades: round2?.state ?? RoundState.Null,
    }
    return result
  }, [round1, round2])

  const left = useMemo(() => (floated == 'left'), [floated])
  const right = useMemo(() => (floated == 'right'), [floated])

  return (
    <Step.Group vertical size='small'>
      <ProgressItem
        completed={pistolsCommitComplete}
        title='Commit Steps'
        description=''
        icon='street view'
        floated={floated}
      />
      <ProgressItem
        completed={pistolsRevealComplete}
        title='Reveal Steps'
        description=''
        icon='eye'
        floated={floated}
      />
      <ProgressItem
        completed={pistolsRevealComplete}
        title='Pistols Round'
        description=''
        icon='target'
        floated={floated}
      />

      <ProgressItem
        completed={pistolsRevealComplete}
        title='Commit Blades'
        description=''
        icon='shield'
        floated={floated}
      />
      <ProgressItem
        completed={pistolsRevealComplete}
        title='Reveal Blades'
        description=''
        icon='eye'
        floated={floated}
      />
      <ProgressItem
        completed={pistolsRevealComplete}
        title='Blades Round'
        description=''
        icon='target'
        floated={floated}
      />
    </Step.Group>
  )
}

function ProgressItem({
  title,
  description,
  active = false,
  completed = false,
  disabled = false,
  icon = null,
  floated,
}) {
  const left = useMemo(() => (floated == 'left'), [floated])
  const right = useMemo(() => (floated == 'right'), [floated])

  return (
    <Step completed={completed} active={active} disabled={disabled} className={right ? 'AlignRight' : ''}>
      {left && icon && <Icon name={icon} />}
      <Step.Content>
        <Step.Title>{title}</Step.Title>
        <Step.Description>{description}</Step.Description>
      </Step.Content>
      {right && icon && <Icon name={icon} style={{margin: '0 0 0 1rem'}} />}
    </Step>
  )
}
