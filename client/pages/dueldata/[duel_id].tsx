import React from 'react'
import { useRouter } from 'next/router'
import { Container, Divider, Table } from 'semantic-ui-react'
import { bigintToHex } from '@/lib/utils/type'
import { formatTimestamp } from '@/lib/utils/timestamp'
import AppPistols from '@/pistols/components/AppPistols'
import { useDuel } from '@/pistols/hooks/useDuel'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { ActionEmojis, ActionNames, ChallengeStateNames, RoundStateNames } from '@/pistols/utils/pistols'
import { BigNumberish } from 'starknet'
import { useWager } from '@/pistols/hooks/useWager'
import { weiToEth } from '@/lib/utils/starknet'
import { useCoin } from '@/pistols/hooks/useConfig'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function StatsPage() {
  const router = useRouter()
  const { duel_id } = router.query

  return (
    <AppPistols title={'Duel'} backgroundImage={null}>
      {router.isReady &&
        <Stats duelId={BigInt(duel_id as string)} />
      }
    </AppPistols>
  );
}

function Stats({
  duelId
}: {
  duelId: bigint
}) {
  const { round1, round2, round3 } = useDuel(duelId)

  return (
    <Container text>
      <Divider hidden />

      <div className='Code'>
        <DuelStats duelId={duelId} />
        <WagerStats duelId={duelId} />

        {round1 && <>
          <RoundStats duelId={duelId} roundNumber={1} round={round1} />
          <br />
        </>}
        {round2 && <>
          <RoundStats duelId={duelId} roundNumber={2} round={round2} />
          <br />
        </>}
        {round3 && <>
          <RoundStats duelId={duelId} roundNumber={3} round={round3} />
          <br />
        </>}

      </div>

    </Container>
  )
}

function DuelStats({
  duelId
}: {
  duelId: bigint
}) {
  const { challenge } = useDuel(duelId)
  const { name: nameA } = useDuelist(challenge.duelistA)
  const { name: nameB } = useDuelist(challenge.duelistB)

  return (
    <Table celled striped color='red'>
      <Header>
        <Row>
          <HeaderCell width={4}><h5>Challenge</h5></HeaderCell>
          <HeaderCell>{bigintToHex(duelId)}</HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>
            Duelist A
            <br />
            (Challenger)
          </Cell>
          <Cell>
            <b>{nameA}</b>
            <br />
            {bigintToHex(challenge.duelistA)}
          </Cell>
        </Row>
        <Row>
          <Cell>
            Duelist B
            <br />
            (Challenged)
          </Cell>
          <Cell>
            <b>{nameB}</b>
            <br />
            {bigintToHex(challenge.duelistB)}
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
            {challenge.message}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}

function WagerStats({
  duelId
}: {
  duelId: bigint
}) {
  const wager = useWager(duelId)
  const coin = useCoin(wager?.coin)
  console.log(coin)
  if (wager.value == 0) return <></>
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
          <Cell>Coin</Cell>
          <Cell>
            {wager.coin} ({coin.description})
          </Cell>
        </Row>
        <Row>
          <Cell>Value</Cell>
          <Cell>
            {wager.value.toString()} wei : {weiToEth(wager.value).toString()}
          </Cell>
        </Row>
        <Row>
          <Cell>Fee</Cell>
          <Cell>
            {wager.fee.toString()} wei : {weiToEth(wager.fee).toString()}
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}

function RoundStats({
  roundNumber,
  round,
}: {
  duelId: bigint
  roundNumber: number
  round: any
}) {

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

      <ShotStats shot={round.shot_a} shotNumber='A' title='Challenger' />
      <ShotStats shot={round.shot_b} shotNumber='B' title='Challenged' />
    </>
  )
}

function ShotStats({
  shotNumber,
  title,
  shot,
}) {
  return (
    <>
      <Table attached='top'>
        <Header fullWidth>
          <Row>
            <HeaderCell width={4}><h5>Shot {shotNumber}</h5></HeaderCell>
            <HeaderCell><h5>{title}</h5></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>Hash</Cell>
            <Cell>
              {bigintToHex(shot.hash)}
            </Cell>
          </Row>
          <Row>
            <Cell>Salt</Cell>
            <Cell>
              {bigintToHex(shot.salt)}
            </Cell>
          </Row>
          <Row>
            <Cell>Action</Cell>
            <Cell>
              {shot.action}: {ActionNames[shot.action]} {ActionEmojis[shot.action]}
            </Cell>
          </Row>
          <Row>
            <Cell>Crit Dice / Chances</Cell>
            <Cell>
              {shot.dice_crit} / {shot.chance_crit}
            </Cell>
          </Row>
          <Row>
            <Cell>Hit Dice / Chances</Cell>
            <Cell>
              {shot.dice_hit} / {shot.chance_hit}
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
            <Cell>{shot.damage}</Cell>
            <Cell>{shot.block}</Cell>
            <Cell>{shot.health}</Cell>
            <Cell>{shot.honour}</Cell>
            <Cell>{shot.win}</Cell>
            <Cell>{shot.wager}</Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}
