import React from 'react'
import { Button, Container, Tab, Table, TabPane } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useDuelistsOwnedByPlayer } from '/src/hooks/useTokenDuelists'
import { useMatchQueue, useMatchPlayer, useDuelistsInMatchMaking } from '/src/stores/matchStore'
import { usePlayersAvailableForMatchmaking, getPlayernameFromAddress } from '/src/stores/playerStore'
import { useFoolsBalance } from '/src/stores/coinStore'
import { PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { FoolsBalance } from '/src/components/account/LordsBalance'
import { Balance } from '/src/components/account/Balance'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { InternalPageMenu } from '/src/pages/internal/InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import ActivityOnline from '/src/components/ActivityOnline'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function MatchmakingTestPage() {
  return (
    <AppDojo subtitle='Test: Matchmaking' autoConnect>
      <Container>
        <InternalPageMenu />
        <CurrentChainHint />

        <Connect>
          <FoolsRow />
        </Connect>

        {/* <br /> */}
        {/* <OnlineStatus /> */}

        <br />
        <Tab panes={[
          { menuItem: 'Unranked', render: () => <TabPane className='NoBorder'><MatchQueue queueId={constants.QueueId.Unranked} /></TabPane> },
          { menuItem: 'Ranked', render: () => <TabPane className='NoBorder'><MatchQueue queueId={constants.QueueId.Ranked} /></TabPane> },
        ]} />

        <StoreSync />
        <ChallengeModal />
      </Container>
    </AppDojo>
  );
}

function FoolsRow() {
  const { address } = useAccount()
  return (
    <Row className='H5'>
      <Cell>FOOLS</Cell>
      <Cell className='Code'>
        <FoolsBalance address={address} size='big' />
      </Cell>
      <Cell></Cell>
    </Row>

  )
}

function OnlineStatus() {
  const { playerIds } = usePlayersAvailableForMatchmaking()
  return (
    <Table celled striped size='small' color='orange'>
      <Body className='H5'>
        <Row>
          <Cell className='ModalText' width={3}>Publish</Cell>
          <Cell>
            <PublishOnlineStatusButton absolute={false} available={false} />
            &nbsp;&nbsp;
            <PublishOnlineStatusButton absolute={false} available={true} />
          </Cell>
        </Row>

        <Row>
          <Cell className='ModalText'>Online panel</Cell>
          <Cell>
            <ActivityOnline />
          </Cell>
        </Row>

        <Row>
          <Cell className='ModalText'>Players available</Cell>
          <Cell>
            <ul>
              {playerIds.map((playerId) => (
                <li key={playerId}>{getPlayernameFromAddress(playerId)} : {playerId}</li>
              ))}
            </ul>
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}


function MatchQueue({ queueId }: { queueId: constants.QueueId }) {
  const { account, address } = useAccount();
  const { balance: foolsBalance } = useFoolsBalance(address)
  const { slotSize, requiresEnlistment, entryTokenAddress, entryTokenAmount, players } = useMatchQueue(queueId);
  const {
    // current queue
    currentDuelistId,
    currentDuelId,
    inQueueIds,
    // ranked only
    rankedCanEnlistIds,
    rankedEnlistedIds,
    // all queues
    canMatchMakeIds,
    duellingIds,
    duelsByDuelistId,
    // all duelist ids
    duelistIds,
  } = useDuelistsInMatchMaking(queueId);
  const { matchmaker } = useDojoSystemCalls();
  return (
    <>
      <Table celled striped size='small' color='orange'>
        <Body className='H5'>
          <Row>
            <Cell className='ModalText' width={3}>Slot size</Cell>
            <Cell>{slotSize}</Cell>
          </Row>
          <Row>
            <Cell className='ModalText'>Enlist Fee</Cell>
            <Cell>{requiresEnlistment ? <Balance fools size='large' wei={entryTokenAmount} /> : 'None'}</Cell>
          </Row>
          <Row>
            <Cell className='ModalText'>Players in queue ({players.length})</Cell>
            <Cell className='Code'>
              <ul>
                {players.map((address) => (
                  <MatchPlayer key={address} queueId={queueId} playerAddress={address} />
                ))}
              </ul>
            </Cell>
          </Row>
          <Row>
            <Cell className='ModalText'></Cell>
            <Cell className='Code'>
              <Button onClick={() => {
                matchmaker.clear_queue(account, queueId)
              }}>
                Clear Queue
              </Button>
              &nbsp;&nbsp;&nbsp;
              <Button onClick={() => {
                matchmaker.clear_player_queue(account, queueId, address)
              }}>
                Clear Player Queue
              </Button>
            </Cell>
          </Row>
        </Body>
      </Table>

      <Table celled striped size='small' color='green'>
        <Body className='H5'>

          <Row>
            <Cell className='ModalText' width={3}>In Queue</Cell>
            <Cell className='Code'>
              {inQueueIds.map((duelistId) => (
                <Button key={duelistId} disabled={true}>
                  {bigintToDecimal(duelistId)}
                </Button>
              ))}
            </Cell>
          </Row>

          <Row>
            <Cell className='ModalText' width={3}>Dueling</Cell>
            <Cell className='Code'>
              {duellingIds.map((duelistId) => (
                <Button key={duelistId} onClick={() => window.open(`/duel/${duelsByDuelistId[duelistId.toString()]}`, '_blank')}>
                  {bigintToDecimal(duelistId)}: Duel#{duelsByDuelistId[duelistId.toString()].toString()}
                </Button>
              ))}
            </Cell>
          </Row>

          {queueId == constants.QueueId.Ranked && <>
            <Row>
              <Cell className='ModalText Important'>
                Enlist Duelists
                <span className={(foolsBalance < entryTokenAmount) ? 'Negative' : 'Positive'}>
                  <FoolsBalance address={address} size='big' />
                </span>
              </Cell>
              <Cell className='Code'>
                {duelistIds.map((duelistId) => (
                  <EnlistDuelistButton
                    key={duelistId}
                    duelistId={duelistId}
                    queueId={queueId}
                    disabled={!rankedCanEnlistIds.includes(duelistId)}
                  />
                ))}
              </Cell>
            </Row>
            <Row>
              <Cell className='ModalText Important'>
                Enlisted Duelists
              </Cell>
              <Cell className='Code'>
                {rankedEnlistedIds.map((duelistId) => (
                  <EnlistDuelistButton
                    key={duelistId}
                    duelistId={duelistId}
                    queueId={queueId}
                    disabled={true}
                  />
                ))}
              </Cell>
            </Row>
            <Row>
              <Cell className='ModalText' width={3}>Enter {queueId} FAST</Cell>
              <Cell className='Code'>
                {duelistIds.map((duelistId) => (
                  <MatchMakeMeButton
                    key={duelistId}
                    duelistId={duelistId}
                    queueId={queueId}
                    queueMode={constants.QueueMode.Fast}
                    disabled={!canMatchMakeIds.includes(duelistId)}
                    needs_vrf={inQueueIds.length == 0}
                  />
                ))}
              </Cell>
            </Row>
          </>}

          <Row>
            <Cell className='ModalText' width={3}>Enter {queueId} SLOW</Cell>
            <Cell className='Code'>
              {duelistIds.map((duelistId) => (
                <MatchMakeMeButton
                  key={duelistId}
                  duelistId={duelistId}
                  queueId={queueId}
                  queueMode={constants.QueueMode.Slow}
                  disabled={!canMatchMakeIds.includes(duelistId)} 
                  needs_vrf={inQueueIds.length == 0}
                />
              ))}
            </Cell>
          </Row>
        </Body>
      </Table>
    </>
  )
}

function MatchPlayer({
  queueId,
  playerAddress,
}: {
  queueId: constants.QueueId
  playerAddress: BigNumberish
}) {
  const { slot, duelistId, duelId } = useMatchPlayer(playerAddress, queueId)
  return (
    <li>
      {getPlayernameFromAddress(playerAddress)}:
      <Address address={playerAddress} />
      / Duelist#{Number(duelistId)} / Duel#{duelId ? Number(duelId) : '-'} / SLOT: {slot}
    </li>
  )
}

function EnlistDuelistButton({
  duelistId,
  queueId,
  disabled,
}: {
  duelistId: BigNumberish
  queueId: constants.QueueId
  disabled?: boolean
}) {
  const { account } = useAccount();
  const { matchmaker } = useDojoSystemCalls();
  return (
    <Button disabled={disabled} onClick={() => {
      matchmaker.enlist_duelist(account, duelistId, queueId)
    }}>
      {bigintToDecimal(duelistId)}
    </Button>
  )
}

function MatchMakeMeButton({
  duelistId,
  queueId,
  queueMode,
  disabled,
  needs_vrf,
}: {
  duelistId: BigNumberish
  queueId: constants.QueueId
  queueMode: constants.QueueMode
  disabled?: boolean
  needs_vrf: boolean
}) {
  const { account } = useAccount();
  const { matchmaker } = useDojoSystemCalls();
  return (
    <Button disabled={disabled} onClick={() => {
      matchmaker.match_make_me(account, duelistId, queueId, queueMode, needs_vrf)
    }}>
      {bigintToDecimal(duelistId)}
    </Button>
  )
}
