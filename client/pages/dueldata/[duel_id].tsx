import React from 'react'
import { useRouter } from 'next/router'
import { Container, Divider, Table } from 'semantic-ui-react'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useWager } from '@/pistols/hooks/useWager'
import { useTable } from '@/pistols/hooks/useTable'
import { ActionEmojis, ActionNames, ChallengeStateNames, RoundStateNames } from '@/pistols/utils/pistols'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { formatTimestamp } from '@/lib/utils/timestamp'
import { bigintToHex, shortAddress } from '@/lib/utils/types'
import { weiToEth } from '@/lib/utils/starknet'
import AppPistols from '@/pistols/components/AppPistols'
import { useChallenge } from '@/pistols/hooks/useChallenge'

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
          <Cell>
            <b>{shortAddress(bigintToHex(challenge.duelistAddressA))}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>
            Account B
          </Cell>
          <Cell>
            <b>{shortAddress(bigintToHex(challenge.duelistAddressB))}</b>
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
            {challenge.winner}: {challenge.winner == 1 ? 'Challenger' : challenge.winner == 2 ? 'Challenged' : null}
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

      <MovesStats moves={round.moves_a} movesNumber='A' title={nameA} />
      <MovesStats moves={round.moves_b} movesNumber='B' title={nameB} />
    </>
  )
}

function MovesStats({
  movesNumber,
  title,
  moves,
}) {
  return (
    <>
      <Table attached='top'>
        <Header fullWidth>
          <Row>
            <HeaderCell width={4}><h5>Moves {movesNumber}</h5></HeaderCell>
            <HeaderCell><h5>{title}</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>Hash</Cell>
            <Cell>
              {bigintToHex(moves.hash)}
            </Cell>
          </Row>
          <Row>
            <Cell>Salt</Cell>
            <Cell>
              {bigintToHex(moves.salt)}
            </Cell>
          </Row>
          <Row>
            <Cell>Action</Cell>
            <Cell>
              {moves.action}: {ActionNames[moves.action]} {ActionEmojis[moves.action]}
            </Cell>
          </Row>
          <Row>
            <Cell>Crit</Cell>
            <Cell>
              🎲 {moves.dice_crit} / {moves.chance_crit} %
            </Cell>
          </Row>
          <Row>
            <Cell>Hit</Cell>
            <Cell>
              🎲 {moves.dice_hit} / {moves.chance_hit} %
            </Cell>
          </Row>
          <Row>
            <Cell>Lethal</Cell>
            <Cell>
              🎲 {moves.chance_lethal > 0 ? moves.dice_hit : 0} / {moves.chance_lethal} %
            </Cell>
          </Row>
        </Body>
      </Table>

      <Table attached>
        <Header fullWidth>
          <Row textAlign='center'>
            <HeaderCell><h5>Damage</h5></HeaderCell>
            <HeaderCell><h5>Block</h5></HeaderCell>
            <HeaderCell><h5>Health</h5></HeaderCell>
            <HeaderCell><h5>Honour</h5></HeaderCell>
            <HeaderCell><h5>Win</h5></HeaderCell>
            <HeaderCell><h5>Wager</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row textAlign='center'>
            <Cell>{moves.damage}</Cell>
            <Cell>{moves.block}</Cell>
            <Cell>{moves.health}</Cell>
            <Cell>{moves.honour}</Cell>
            <Cell>{moves.win}</Cell>
            <Cell>{moves.wager}</Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}
