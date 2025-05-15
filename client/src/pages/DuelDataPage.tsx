import React, { useMemo } from 'react'
import { Container, Divider, Table } from 'semantic-ui-react'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useDuel } from '/src/hooks/useDuel'
import { useDuelist } from '/src/stores/duelistStore'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { useRouteSlugs } from '/src/hooks/useRoute'
import { useDuelProgress } from '/src/hooks/usePistolsContractCalls'
import { usePlayer } from '/src/stores/playerStore'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { SeasonChallengeStoreSync, SeasonScoreboardStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { ChallengeStateNames, RoundStateNames } from '/src/utils/pistols'
import { bigintToDecimal, bigintToHex, formatTimestampLocal } from '@underware/pistols-sdk/utils'
import { BladesIcon, PacesIcon } from '/src/components/ui/PistolsIcon'
import { DuelIconsAsRow } from '/src/components/DuelIcons'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { Address } from '/src/components/ui/Address'
import AppDojo from '/src/components/AppDojo'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function DuelDataPage() {
  return (
    <AppDojo backgroundImage={null}>
      <EntityStoreSync />
      <SeasonChallengeStoreSync />
      <SeasonScoreboardStoreSync />
      <PlayerNameSync />
      <StatsLoader />
    </AppDojo>
  );
}

function StatsLoader() {
  const { duel_id } = useRouteSlugs()

  return (
    <Container>
      {Boolean(duel_id) && <Stats duelId={BigInt(duel_id as string)} />}
    </Container>
  )
}


function Stats({
  duelId
}: {
  duelId: bigint
}) {
  const { round1 } = useDuel(duelId)
  const challenge = useGetChallenge(duelId)

  return (
    <>
      <Divider hidden />

      <div className='Code'>
        <DuelStats duelId={duelId} />

        {round1 && <>
          <RoundStats duelId={duelId} round={round1} challenge={challenge} />
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
  const { seasonName: currentSeasonName } = useCurrentSeason()
  const seasonDescription = useMemo(() => (challenge.seasonName ?? currentSeasonName), [challenge.seasonName, currentSeasonName])

  const { username: usernameA } = usePlayer(challenge.duelistAddressA)
  const { username: usernameB } = usePlayer(challenge.duelistAddressB)
  const { name: nameA } = useDuelist(challenge.duelistIdA)
  const { name: nameB } = useDuelist(challenge.duelistIdB)

  return (
    <Table celled striped color='red'>
      <Header>
        <Row>
          <HeaderCell width={4}><h5>Challenge</h5></HeaderCell>
          <HeaderCell>
            {duelId.toString()}
            <br />
            {bigintToHex(duelId)}
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>
            Account A
          </Cell>
          <Cell>
            {usernameA} : <Address address={challenge.duelistAddressA} />
          </Cell>
        </Row>
        <Row>
          <Cell>
            Account B
          </Cell>
          <Cell>
            {usernameB} : <Address address={challenge.duelistAddressB} />
          </Cell>
        </Row>
        <Row>
          <Cell>
            Duelist A
          </Cell>
          <Cell>
            <b>#{bigintToDecimal(challenge.duelistIdA)}: {nameA}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>
            Duelist B
          </Cell>
          <Cell>
            <b>#{bigintToDecimal(challenge.duelistIdB)}: {nameB}</b>
          </Cell>
        </Row>
        <Row>
          <Cell>Season</Cell>
          <Cell>
            {seasonDescription}
          </Cell>
        </Row>
        <Row>
          <Cell>State</Cell>
          <Cell>
            {challenge.state}: {ChallengeStateNames[challenge.state]}
          </Cell>
        </Row>
        <Row>
          <Cell>Winner</Cell>
          <Cell>
            ({bigintToDecimal(challenge.winner)})
            {' '}
            {challenge.winner == 1 && <b>#{bigintToDecimal(challenge.duelistIdA)}: {nameA}</b>}
            {challenge.winner == 2 && <b>#{bigintToDecimal(challenge.duelistIdB)}: {nameB}</b>}
            {challenge.winner == 0 && <b>-</b>}
          </Cell>
        </Row>
        <Row>
          <Cell>Timestamp Start</Cell>
          <Cell>
            {formatTimestampLocal(challenge.timestampEnd)}
          </Cell>
        </Row>
        <Row>
          <Cell>Timestamp End</Cell>
          <Cell>
            {formatTimestampLocal(challenge.timestampEnd)}
          </Cell>
        </Row>
        <Row>
          <Cell>Message</Cell>
          <Cell>
            {challenge.message}
          </Cell>
        </Row>
        <Row>
          <Cell>Progress A</Cell>
          <Cell>
            <DuelIconsAsRow duelId={duelId} duelistId={challenge.duelistIdA} size={'large'} />
          </Cell>
        </Row>
        <Row>
          <Cell>Progress B</Cell>
          <Cell>
            <DuelIconsAsRow duelId={duelId} duelistId={challenge.duelistIdB} size={'large'} />
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
  round,
  challenge,
}: {
  duelId: bigint
  round: any
  challenge: any
}) {
  const { name: nameA } = useDuelist(challenge.duelistIdA)
  const { name: nameB } = useDuelist(challenge.duelistIdB)
  return (
    <>
      <Table celled striped color='orange'>
        <Header>
          <Row>
            <HeaderCell width={4}><h5>Round</h5></HeaderCell>
            <HeaderCell><h2>Single Round</h2></HeaderCell>
          </Row>
        </Header>

        <Body>
          <Row>
            <Cell>State</Cell>
            <Cell>
              {round.state}: {RoundStateNames[round.state]}
            </Cell>
          </Row>
          <Row>
            <Cell>Final Blow</Cell>
            <Cell>
              {round.finalBlow}:&nbsp;
              {
                round.endedInPaces ? <PacesIcon paces={round.finalBlowValue} /> :
                  round.endedInBlades ? <>{round.finalBlowValue} <BladesIcon blade={round.finalBlowValue} /></> :
                    '-'
              }
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
              {bigintToHex(moves?.hashed)}
            </Cell>
          </Row>
          <Row>
            <Cell>Salt</Cell>
            <Cell className='Smaller'>
              {bigintToHex(moves?.salt)}
            </Cell>
          </Row>
          {/* <Row>
            <Cell>Fire Dice</Cell>
            <Cell>
              {EMOJIS.DICE} {state.dice_fire} over {state.chances}%
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

        {hand &&
          <Body>
            <Row textAlign='center'>
              <Cell><PacesIcon paces={hand.card_fire} /> {hand.card_fire}
              </Cell>
              <Cell><PacesIcon paces={hand.card_dodge} dodge /> {hand.card_dodge}</Cell>
              <Cell>{hand.card_tactics}</Cell>
              <Cell><BladesIcon blade={hand.card_blades} /> {hand.card_blades}</Cell>
            </Row>
          </Body>
        }
      </Table>
    </>
  )
}

function _dice(dice: number) {
  if (dice == 0) return '-'
  return <>{EMOJIS.DICE} {dice.toString()}</>
}

function _env_card_name(card: any) {
  return (card ? constants.ENV_POINTS[card]?.name : '-') ?? '-'
}

function StateRow({
  state_a,
  state_b,
  card_a,
  card_b,
  specials_a,
  specials_b,
} : {
  state_a: any
  state_b: any
  card_a?: string
  card_b?: string
  specials_a?: any
  specials_b?: any
}) {
  if (!state_a || !state_b) return <></>
  return (
    <Table attached>
      <Header fullWidth>
        <Row textAlign='center'>
          <HeaderCell><h5>{' '}</h5></HeaderCell>
          {(card_a || card_b) && <HeaderCell><h5>Card<br />Drawn</h5></HeaderCell>}
          <HeaderCell><h5>Dice</h5></HeaderCell>
          <HeaderCell><h5>Chances</h5></HeaderCell>
          <HeaderCell><h5>Damage</h5></HeaderCell>
          <HeaderCell><h5>Health</h5></HeaderCell>
          <HeaderCell><h5>Honour</h5></HeaderCell>
          <HeaderCell><h5>Coin<br />Toss</h5></HeaderCell>
          <HeaderCell><h5>Reversal</h5></HeaderCell>
          <HeaderCell><h5>Shots<br />Mod</h5></HeaderCell>
          <HeaderCell><h5>Tactics<br />Mod</h5></HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row textAlign='center'>
          <Cell>Duelist A</Cell>
          {(card_a || card_b) && <Cell>{card_a}</Cell>}
          <Cell>{_dice(state_a.dice_fire)}</Cell>
          <Cell>{state_a.chances.toString()}%</Cell>
          <Cell>{EMOJIS.FIRE} {state_a.damage.toString()}</Cell>
          <Cell>{EMOJIS.LIFE} {state_a.health.toString()}</Cell>
          <Cell>{EMOJIS.HONOUR} {state_a.honour.toString()}</Cell>
          <Cell>{specials_a?.coin_toss ? 'Yes' : '-'}</Cell>
          <Cell>{specials_a?.reversal ? 'Yes' : '-'}</Cell>
          <Cell>{_env_card_name(specials_a?.shots_modifier)}</Cell>
          <Cell>{_env_card_name(specials_a?.tactics_modifier)}</Cell>
        </Row>
        <Row textAlign='center'>
          <Cell>Duelist B</Cell>
          {(card_a || card_b) && <Cell>{card_b}</Cell>}
          <Cell>{_dice(state_b.dice_fire)}</Cell>
          <Cell>{state_b.chances.toString()}%</Cell>
          <Cell>{EMOJIS.FIRE} {state_b.damage.toString()}</Cell>
          <Cell>{EMOJIS.LIFE} {state_b.health.toString()}</Cell>
          <Cell>{EMOJIS.HONOUR} {state_b.honour.toString()}</Cell>
          <Cell>{specials_b?.coin_toss ? 'Yes' : '-'}</Cell>
          <Cell>{specials_b?.reversal ? 'Yes' : '-'}</Cell>
          <Cell>{_env_card_name(specials_b?.shots_modifier)}</Cell>
          <Cell>{_env_card_name(specials_b?.tactics_modifier)}</Cell>
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
  const { duelProgress } = useDuelProgress(duelId)
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
            <HeaderCell width={4}><h5 className='Important ModalText'>Step {index}</h5></HeaderCell>
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
              {_env_card_name(step.card_env)}
            </Cell>
          </Row>
          <Row>
            <Cell>Env Shuffle</Cell>
            <Cell>
              {_dice(step.dice_env)}
            </Cell>
          </Row>
        </Body>
      </Table>

      <StateRow state_a={step.state_a} state_b={step.state_b} card_a={card_a} card_b={card_b} specials_a={step.specials_a} specials_b={step.specials_b} />

    </>
  )
}
