import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Segment, Icon, Step } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useCommitMove } from '@/pistols/hooks/useCommitReveal'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { BladesNames, FULL_HEALTH, RoundState } from '@/pistols/utils/pistols'
import CommitModal from '@/pistols/components/CommitModal'

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
      <div className='TavernTitle' style={{ maxWidth: '250px' }}>
        <h1 className='Quote'>{`“${message}”`}</h1>
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelProfile duelId={duelId} floated='left' address={duelistA} />
        </div>
        <DuelProgress isA account={account} duelId={duelId} duelistA={duelistA} floated='left' />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelProfile duelId={duelId} floated='right' address={duelistB} />
        </div>
        <DuelProgress isB account={account} duelId={duelId} duelistB={duelistB} floated='right' />
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
  account,
  duelId,
  isA = false,
  isB = false,
  duelistA = null,
  duelistB = null,
  floated,
}) {
  const { name } = useDuelist(isA ? duelistA : duelistB)
  const { challenge, round1, round2 } = useDuel(duelId)
  // console.log(`Challenge:`, challenge)
  // console.log(`Round 1:`, round1)
  // console.log(`Round 2:`, round2)

  //-------------------------
  // Duel progression
  //
  const currentStage = useMemo(() => {
    if (!round1 || round1.state == RoundState.Null) return DuelStage.Null
    if (round1.state == RoundState.Commit) return DuelStage.StepsCommit
    if (round1.state == RoundState.Reveal) return DuelStage.StepsReveal
    if (!round2 || round2.state == RoundState.Null) return DuelStage.PistolsShootout
    if (round2.state == RoundState.Commit) return DuelStage.BladesCommit
    if (round2.state == RoundState.Reveal) return DuelStage.BladesReveal
    return DuelStage.BladesClash
  }, [round1, round2])

  const roundNumber = useMemo(() => {
    if (currentStage == DuelStage.StepsCommit || currentStage == DuelStage.StepsReveal) return 1
    if (currentStage == DuelStage.BladesCommit || currentStage == DuelStage.BladesReveal) return 2
    return 0
  }, [currentStage])

  const completedStages = useMemo(() => {
    return {
      [DuelStage.StepsCommit]: (isA && Boolean(round1?.duelist_a.hash)) || (isB && Boolean(round1?.duelist_b.hash)),
      [DuelStage.StepsReveal]: (isA && Boolean(round1?.duelist_a.move)) || (isB && Boolean(round1?.duelist_b.move)),
      [DuelStage.BladesCommit]: (isA && Boolean(round2?.duelist_a.hash)) || (isB && Boolean(round2?.duelist_b.hash)),
      [DuelStage.BladesReveal]: (isA && Boolean(round2?.duelist_a.move)) || (isB && Boolean(round2?.duelist_b.move)),
    }
  }, [isA, isB, round1, round2])

  const _healthResult = (round: any) => {
    const health = isA ? round.duelist_a.health : round.duelist_b.health
    return (health == 0 ? 'DEAD!' : health < FULL_HEALTH ? 'INJURED!' : 'ALIVE!')
  }

  const pistolsResult = useMemo(() => {
    if (round1?.state == RoundState.Finished) {
      const steps = isA ? round1.duelist_a.move : round1.duelist_b.move
      const health = _healthResult(round1)
      return <span>{name} walks {steps} steps<br />and is {health}</span>
    }
    return null
  }, [round1])

  const bladesResult = useMemo(() => {
    if(round2?.state == RoundState.Finished) {
      const blade = isA ? round2.duelist_a.move : round2.duelist_b.move
      const health = _healthResult(round2)
      return <span>{name} clashes with {BladesNames[blade]}<br />and is {health}</span>
    }
    return null
  }, [round2])

  //------------------------------
  // Duelist interaction
  //

  // Commit modal control
  const [commitStepsIsOpen, setCommitStepsIsOpen] = useState(false)
  const [commitBladesIsOpen, setCommitBladesIsOpen] = useState(false)
  const _commit = () => {
    if (roundNumber == 1) setCommitStepsIsOpen(true)
    if (roundNumber == 2) setCommitBladesIsOpen(true)
  }

  // Reveal
  const { reveal_move } = useDojoSystemCalls()
  const { hash, salt, move } = useCommitMove(duelId, roundNumber)
  const _reveal = () => {
    // console.log(`REVEAL`, duelId, roundNumber, hash, salt, move, pedersen(salt, move).toString(16))
    reveal_move(account, duelId, roundNumber, salt, move)
  }

  // onClick
  const isDuelistA = useMemo(() => (BigInt(account?.address) == duelistA), [account, duelistA])
  const isDuelistB = useMemo(() => (BigInt(account?.address) == duelistB), [account, duelistB])
  const onClick = useMemo(() => {
    if (!completedStages[currentStage] && (isDuelistA || isDuelistB)) {
      if (currentStage == DuelStage.StepsCommit || currentStage == DuelStage.BladesCommit) {
        return _commit
      }
      if (currentStage == DuelStage.StepsReveal || currentStage == DuelStage.BladesReveal) {
        return _reveal
      }
    }
    return null
  }, [completedStages, currentStage, isDuelistA, isDuelistB])


  //------------------------------
  return (
    <>
      <CommitModal duelId={duelId} roundNumber={1} isOpen={commitStepsIsOpen} setIsOpen={setCommitStepsIsOpen} />
      <CommitModal duelId={duelId} roundNumber={2} isOpen={commitBladesIsOpen} setIsOpen={setCommitBladesIsOpen} />
      <Step.Group vertical size='small'>
        <ProgressItem
          stage={DuelStage.StepsCommit}
          currentStage={currentStage}
          completedStages={completedStages}
          title='Commit Steps'
          description=''
          icon='street view'
          floated={floated}
          onClick={onClick}
        />
        <ProgressItem
          stage={DuelStage.StepsReveal}
          currentStage={currentStage}
          completedStages={completedStages}
          title='Reveal Steps'
          description=''
          icon='eye'
          floated={floated}
          onClick={onClick}
        />
        <ProgressItem
          stage={DuelStage.PistolsShootout}
          currentStage={currentStage}
          completedStages={completedStages}
          title={pistolsResult ?? 'Pistols shootout!'}
          description=''
          icon={pistolsResult ? null : 'target'}
          floated={floated}
          onClick={onClick}
        />

        {round2 &&
          <>
            <ProgressItem
              stage={DuelStage.BladesCommit}
              currentStage={currentStage}
              completedStages={completedStages}
              title='Commit Blades'
              description=''
              icon='shield'
              floated={floated}
              onClick={onClick}
            />
            <ProgressItem
              stage={DuelStage.BladesReveal}
              currentStage={currentStage}
              completedStages={completedStages}
              title='Reveal Blades'
              description=''
              icon='eye'
              floated={floated}
              onClick={onClick}
            />
            <ProgressItem
              stage={DuelStage.BladesClash}
              currentStage={currentStage}
              completedStages={completedStages}
              title={bladesResult ?? 'Blades clash!'}
              description=''
              icon={bladesResult ? null : 'target'}
              floated={floated}
              onClick={onClick}
            />
          </>
        }
      </Step.Group>
    </>
  )
}

function ProgressItem({
  stage,
  currentStage,
  completedStages = {},
  title,
  description,
  icon = null,
  floated,
  onClick = null,
}) {
  const _completed = (stage < currentStage) || (stage == currentStage && completedStages[stage] === true)
  const _active = (currentStage == stage)
  const _disabled = (currentStage < stage)
  const _left = (floated == 'left')
  const _right = (floated == 'right')
  const _link = (onClick && _active && !_completed)
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
      <Step.Content className='AutoMargin'>
        <Step.Title>{title}</Step.Title>
        <Step.Description>{description}</Step.Description>
      </Step.Content>
      {_right && icon && <Icon name={icon} style={{ margin: '0 0 0 1rem' }} />}
    </Step>
  )
}
