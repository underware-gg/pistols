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

  const isDuelistA = useMemo(() => (BigInt(account?.address) == duelistA), [account, duelistA])
  const isDuelistB = useMemo(() => (BigInt(account?.address) == duelistB), [account, duelistB])

  return (
    <>
      <div className='TavernTitle' style={{maxWidth: '250px'}}>
        <h1 className='Quote'>{`“${message}”`}</h1>
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelProfile duelId={duelId} floated='left' address={duelistA} />
        </div>
        <DuelProgress duelId={duelId} isDuelistA={isDuelistA} floated='left' />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelProfile duelId={duelId} floated='right' address={duelistB} />
        </div>
        <DuelProgress duelId={duelId} isDuelistB={isDuelistB} floated='right' />
      </div>
    </>
  )
}

function DuelProfile({
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
  Null,
  StepsCommit,
  StepsReveal,
  PistolsShootout,
  BladesCommit,
  BladesReveal,
  BladesClash,
  Finished,
}

function DuelProgress({
  duelId,
  isDuelistA = null,
  isDuelistB = null,
  floated,
}) {
  const { challenge, round1, round2 } = useDuel(duelId)

  const _commitSteps = () => _commit(1)
  const _commitBlades = () => _commit(2)
  const _commit = (round_number:number) => {
    console.log(`COMMIT`, round_number)
  }

  const _revealSteps = () => _reveal(1)
  const _revealBlades = () => _reveal(2)
  const _reveal = (round_number: number) => {
    console.log(`REVEAL`, round_number)
  }

  const currentStage = useMemo(() => {
    if (!round1 || round1.state == RoundState.Null) return DuelStage.Null
    if (round1.state == RoundState.Commit) return DuelStage.StepsCommit
    if (round1.state == RoundState.Reveal) return DuelStage.StepsReveal
    if (!round2 || round2.state == RoundState.Null) return DuelStage.PistolsShootout
    if (round2.state == RoundState.Commit) return DuelStage.BladesCommit
    if (round2.state == RoundState.Reveal) return DuelStage.BladesReveal
    return DuelStage.BladesClash
  }, [round1, round2])

  const [completed, onClick] = useMemo(() => {
    if (currentStage == DuelStage.StepsCommit) {
      if (isDuelistA) return round1.duelist_a.hash ? [true, null] : [false, _commitSteps]
      if (isDuelistB) return round1.duelist_b.hash ? [true, null] : [false, _commitSteps]
    }
    if (currentStage == DuelStage.StepsReveal) {
      if (isDuelistA) return round1.duelist_a.move ? [true, null] : [false, _revealSteps]
      if (isDuelistB) return round1.duelist_b.move ? [true, null] : [false, _revealSteps]
    }
    if (currentStage == DuelStage.BladesCommit) {
      if (isDuelistA) return round2.duelist_a.hash ? [true, null] : [false, _commitBlades]
      if (isDuelistB) return round2.duelist_b.hash ? [true, null] : [false, _commitBlades]
    }
    if (currentStage == DuelStage.BladesReveal) {
      if (isDuelistA) return round2.duelist_a.move ? [true, null] : [false, _revealBlades]
      if (isDuelistB) return round2.duelist_b.move ? [true, null] : [false, _revealBlades]
    }
    return [false, null]
  }, [currentStage, round1, round2])

  return (
    <Step.Group vertical size='small'>
      <ProgressItem
        stage={DuelStage.StepsCommit}
        currentStage={currentStage}
        completed={completed}
        title='Commit Steps'
        description=''
        icon='street view'
        floated={floated}
        onClick={onClick}
      />
      <ProgressItem
        stage={DuelStage.StepsReveal}
        currentStage={currentStage}
        completed={completed}
        title='Reveal Steps'
        description=''
        icon='eye'
        floated={floated}
        onClick={onClick}
      />
      <ProgressItem
        stage={DuelStage.PistolsShootout}
        currentStage={currentStage}
        completed={completed}
        title='Pistols shootout!'
        description=''
        icon='target'
        floated={floated}
        onClick={onClick}
      />

      <ProgressItem
        stage={DuelStage.BladesCommit}
        currentStage={currentStage}
        completed={completed}
        title='Commit Blades'
        description=''
        icon='shield'
        floated={floated}
        onClick={onClick}
      />
      <ProgressItem
        stage={DuelStage.BladesReveal}
        currentStage={currentStage}
        completed={completed}
        title='Reveal Blades'
        description=''
        icon='eye'
        floated={floated}
        onClick={onClick}
      />
      <ProgressItem
        stage={DuelStage.BladesClash}
        currentStage={currentStage}
        completed={completed}
        title='Blades clash!'
        description=''
        icon='target'
        floated={floated}
        onClick={onClick}
      />
    </Step.Group>
  )
}

function ProgressItem({
  stage,
  currentStage,
  completed = false,
  title,
  description,
  icon = null,
  floated,
  onClick = null,
}) {
  const _completed = (currentStage > stage) || completed
  const _active = (currentStage == stage)
  const _disabled = (currentStage < stage)
  const _left = (floated == 'left')
  const _right = (floated == 'right')
  const _link = (onClick && _active && !completed)
  let classNames = []
  if (_right) classNames.push('AlignRight')
  if (!_link) classNames.push('NoMouse')
  return (
    <Step
      className={classNames.join(' ')}
      completed={_completed}
      active={_active}
      disabled={_disabled}
      link={_link}
      onClick={_link ? onClick : null}
    >
      {_left && icon && <Icon name={icon} />}
      <Step.Content>
        <Step.Title>{title}</Step.Title>
        <Step.Description>{description}</Step.Description>
      </Step.Content>
      {_right && icon && <Icon name={icon} style={{margin: '0 0 0 1rem'}} />}
    </Step>
  )
}
