import React from 'react'
import { useRouter } from 'next/router'
import { Container, Divider, Table } from 'semantic-ui-react'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useChallenge } from '@/pistols/hooks/useChallenge'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useWager } from '@/pistols/hooks/useWager'
import { useTable } from '@/pistols/hooks/useTable'
import { useFinishedDuelProgress } from '@/pistols/hooks/useContractCalls'
import { ChallengeStateNames, RoundStateNames } from '@/pistols/utils/pistols'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { formatTimestamp } from '@/lib/utils/timestamp'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { weiToEth } from '@/lib/utils/starknet'
import { BladesIcon, PacesIcon } from '@/pistols/components/ui/PistolsIcon'
import AppPistols from '@/pistols/components/AppPistols'
import { EMOJI } from '@/pistols/data/messages'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function StatsPage() {
  return (
    <AppPistols headerData={{ title: 'Duel' }} backgroundImage={null}>
      <StatsLoader />
    </AppPistols>
  );
}

function StatsLoader() {
  const { isInitialized } = useDojoStatus()

  const router = useRouter()
  const { duel_id } = router.query

  return (
    <Container text>
      {(isInitialized && duel_id)
        ? <Stats duelId={BigInt(duel_id as string)} />
        : <DojoStatus />
      }
    </Container>
  )
}


function Stats({
  duelId
}: {
  duelId: bigint
}) {
  const { challenge: { tableId }, round1 } = useDuel(duelId)

  const challenge = useChallenge(duelId)

  return (
    <>
      <Divider hidden />

      <div className='Code'>
        <DuelStats duelId={duelId} />
        <WagerStats duelId={duelId} tableId={tableId} />

        {round1 && <>
          <RoundStats duelId={duelId} roundNumber={1} round={round1} />
          <DuelProgress duelId={duelId} />
          <br />
        </>}

      </div>

    </>
  )
}

function DuelStats({
  duelId
}: {
  duelId: bigint
}) {
  const { challenge } = useDuel(duelId)
  const { description } = useTable(challenge.tableId)
  const { nameDisplay: nameA } = useDuelist(challenge.duelistIdA)
  const { nameDisplay: nameB } = useDuelist(challenge.duelistIdB)

  return (
    <Table celled striped color='red'>
      <Header>
        <Row>
          <HeaderCell width={4}><h5>Challenge</h5></HeaderCell>
          <HeaderCell>
            {bigintToHex(duelId)}
            <br />
            {duelId.toString()}
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>
            Account A
          </Cell>
          <Cell className='Smaller'>
            <b>{bigintToHex(challenge.duelistAddressA)}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>
            Account B
          </Cell>
          <Cell className='Smaller'>
            <b>{bigintToHex(challenge.duelistAddressB)}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>
            Duelist A
          </Cell>
          <Cell>
            <b>{nameA}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>
            Duelist B
          </Cell>
          <Cell>
            <b>{nameB}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>Table</Cell>
          <Cell>
            {challenge.tableId} ({description})
          </Cell>
        </Row>
        <Row>
          <Cell>State</Cell>
          <Cell>
            {challenge.state}: {ChallengeStateNames[challenge.state]}
          </Cell>
        </Row>
        <Row>
          <Cell>Round Number</Cell>
          <Cell>
            {challenge.roundNumber}
          </Cell>
        </Row>
        <Row>
          <Cell>Winner</Cell>
          <Cell>
            {challenge.winner}: {challenge.winner == 1 ? nameA : challenge.winner == 2 ? nameB : '-'}
          </Cell>
        </Row>
        <Row>
          <Cell>Timestamp Start</Cell>
          <Cell>
            {formatTimestamp(challenge.timestamp_end)}
          </Cell>
        </Row>
        <Row>
          <Cell>Timestamp End</Cell>
          <Cell>
            {formatTimestamp(challenge.timestamp_end)}
          </Cell>
        </Row>
        <Row>
          <Cell>Message</Cell>
          <Cell>
            {challenge.quote}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}

function WagerStats({
  duelId,
  tableId,
}: {
  duelId: bigint
  tableId: string
}) {
  const { value, fee } = useWager(duelId)
  const { description } = useTable(tableId)
  if (!value) return <></>
  return (
    <Table celled striped color='green'>
      <Header>
        <Row>
          <HeaderCell width={4}><h5>Wager</h5></HeaderCell>
          <HeaderCell>{bigintToHex(duelId)}</HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>Table</Cell>
          <Cell>
            {tableId} ({description})
          </Cell>
        </Row>
        <Row>
          <Cell>Value</Cell>
          <Cell>
            {value?.toString() ?? 0} wei : {weiToEth(value ?? 0).toString()}
          </Cell>
        </Row>
        <Row>
          <Cell>Fee</Cell>
          <Cell>
            {fee?.toString() ?? 0} wei : {weiToEth(fee ?? 0).toString()}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


//-----------------------------------
// ROUND
//

function RoundStats({
  duelId,
  roundNumber,
  round,
}: {
  duelId: bigint
  roundNumber: number
  round: any
}) {
  const { challenge } = useDuel(duelId)
  const { nameDisplay: nameA } = useDuelist(challenge.duelistIdA)
  const { nameDisplay: nameB } = useDuelist(challenge.duelistIdB)
  // console.log('round', round)
  return (
    <>
      <Table celled striped color='orange'>
        <Header>
          <Row>
            <HeaderCell width={4}><h5>Round</h5></HeaderCell>
            <HeaderCell><h2>{roundNumber}</h2></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>State</Cell>
            <Cell>
              {round.state}: {RoundStateNames[round.state]}
            </Cell>
          </Row>
        </Body>
      </Table>

      <StateRow state_a={round.state_a} state_b={round.state_b} />

      <MovesStats hand={round.hand_a} moves={round.moves_a} state={round.state_a} playerNumber='A' title={nameA} />
      <MovesStats hand={round.hand_b} moves={round.moves_b} state={round.state_b} playerNumber='B' title={nameB} />
    </>
  )
}

function MovesStats({
  playerNumber,
  title,
  hand,
  moves,
  state,
}) {
  return (
    <>
      <Table attached>
        <Header fullWidth>
          <Row>
            <HeaderCell width={4}><h5 className='Important'>Moves {playerNumber}</h5></HeaderCell>
            <HeaderCell><h5 className='Important'>{title}</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>Hash</Cell>
            <Cell className='Smaller'>
              {bigintToHex(moves.hashed)}
            </Cell>
          </Row>
          <Row>
            <Cell>Salt</Cell>
            <Cell className='Smaller'>
              {bigintToHex(moves.salt)}
            </Cell>
          </Row>
          {/* <Row>
            <Cell>Fire Dice</Cell>
            <Cell>
              {EMOJI.DICE} {state.dice_fire} over {state.chances}%
            </Cell>
          </Row> */}
        </Body>
      </Table>

      <Table attached>
        <Header fullWidth>
          <Row textAlign='center'>
            <HeaderCell><h5>Fire</h5></HeaderCell>
            <HeaderCell><h5>Dodge</h5></HeaderCell>
            <HeaderCell><h5>Tactics</h5></HeaderCell>
            <HeaderCell><h5>Blades</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row textAlign='center'>
            <Cell><PacesIcon paces={hand.card_fire} /> {hand.card_fire}
            </Cell>
            <Cell><PacesIcon paces={hand.card_dodge} dodge /> {hand.card_dodge}</Cell>
            <Cell>{hand.card_tactics}</Cell>
            <Cell><BladesIcon blade={hand.card_blades} /> {hand.card_blades}</Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}


function StateRow({
  state_a,
  state_b,
  card_a,
  card_b,
} : {
  state_a: any
  state_b: any
  card_a?: string
  card_b?: string
}) {
  return (
    <Table attached>
      <Header fullWidth>
        <Row textAlign='center'>
          <HeaderCell><h5>{' '}</h5></HeaderCell>
          {(card_a || card_b) && <HeaderCell><h5>Card</h5></HeaderCell>}
          <HeaderCell><h5>Dice</h5></HeaderCell>
          <HeaderCell><h5>Chances</h5></HeaderCell>
          <HeaderCell><h5>Damage</h5></HeaderCell>
          <HeaderCell><h5>Health</h5></HeaderCell>
          <HeaderCell><h5>Honour</h5></HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row textAlign='center'>
          <Cell>Duelist A</Cell>
          {(card_a || card_b) && <Cell>{card_a}</Cell>}
          <Cell>{EMOJI.DICE} {state_a.dice_fire.toString()}</Cell>
          <Cell>{state_a.chances.toString()}%</Cell>
          <Cell>{EMOJI.FIRE} {state_a.damage.toString()}</Cell>
          <Cell>{EMOJI.LIFE} {state_a.health.toString()}</Cell>
          <Cell>{EMOJI.HONOUR} {state_a.honour.toString()}</Cell>
        </Row>
        <Row textAlign='center'>
          <Cell>Duelist B</Cell>
          {(card_a || card_b) && <Cell>{card_b}</Cell>}
          <Cell>{EMOJI.DICE} {state_b.dice_fire.toString()}</Cell>
          <Cell>{state_b.chances.toString()}%</Cell>
          <Cell>{EMOJI.FIRE} {state_b.damage.toString()}</Cell>
          <Cell>{EMOJI.LIFE} {state_b.health.toString()}</Cell>
          <Cell>{EMOJI.HONOUR} {state_b.honour.toString()}</Cell>
        </Row>
      </Body>
    </Table>
  )
}



//-----------------------------------
// ENV
//

function DuelProgress({
  duelId,
}: {
  duelId: bigint
}) {
  const duelProgress = useFinishedDuelProgress(duelId)
  console.log('duelProgress', duelProgress)
  if (!duelProgress) return <></>
  return (
    <>
      <Table celled striped color='green'>
        <Header>
          <Row>
            <HeaderCell width={4}><h5>Duel Progress / Animations</h5></HeaderCell>
            <HeaderCell><h2>{' '}</h2></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>Winner</Cell>
            <Cell>
              {duelProgress.winner.toString()}
            </Cell>
          </Row>
        </Body>
      </Table>

      {duelProgress.steps.map((step, index) => (
        <DuelStep key={`${index}`} index={index} step={step} />
      ))}
    </>
  )
}

function DuelStep({
  index,
  step,
}) {
  const _card = (card) => {
    return card?.fire ? <><PacesIcon paces={card.fire}/> {card.fire}</>
      : card?.dodge ? <><PacesIcon paces={card.dodge} dodge/> {card.dodge}</>
        : card?.blades ? <><BladesIcon blade={card.blades} /> {card.blades}</>
          : card?.tactics ?? '-'
  }
  const card_a = _card(step.card_a)
  const card_b = _card(step.card_b)
  return (
    <>
      <Table attached>
        <Header fullWidth>
          <Row>
            <HeaderCell width={4}><h5 className='Important'>Step {index}</h5></HeaderCell>
            <HeaderCell><h5 className='Important'>{' '}</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>Pace</Cell>
            <Cell>
              <PacesIcon paces={step.pace} /> {step.pace}
            </Cell>
          </Row>
          <Row>
            <Cell>Env Card</Cell>
            <Cell>
              {step.card_env}
            </Cell>
          </Row>
          <Row>
            <Cell>Env Shuffle</Cell>
            <Cell>
              {EMOJI.DICE} {step.dice_env.toString()}
            </Cell>
          </Row>
        </Body>
      </Table>

      <StateRow state_a={step.state_a} state_b={step.state_b} card_a={card_a} card_b={card_b} />

    </>
  )
}
