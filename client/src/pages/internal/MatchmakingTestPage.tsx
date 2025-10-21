import React, { useEffect, useState } from 'react'
import { Button, Container, Tab, Table, TabPane } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useMatchQueue, useMatchPlayer, _useDuelistsInMatchMakingByAddress } from '/src/stores/matchStore'
import { usePlayersAvailableForMatchmaking, getPlayernameFromAddress, useUsernameFromPlayerAddress } from '/src/stores/playerStore'
import { useFetchAccountsBalances, useFoolsBalance } from '/src/stores/coinStore'
import { PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import { bigintToDecimal, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { FoolsBalance } from '/src/components/account/LordsBalance'
import { Balance } from '/src/components/account/Balance'
import { Address } from '/src/components/ui/Address'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { InternalPageMenu, InternalPageWrapper } from '/src/pages/internal/InternalPageIndex'
import CurrentChainHint from '/src/components/CurrentChainHint'
import ChallengeModal from '/src/components/modals/ChallengeModal'
import StoreSync from '/src/stores/sync/StoreSync'
import ActivityOnline from '/src/components/ActivityOnline'
import AppDojo from '/src/components/AppDojo'
import { WalletAddressRow } from './AdminPage'
import { useTokenContracts } from '/src/hooks/useTokenContracts'

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

        <InternalPageWrapper>
          <Matchmaking />
        </InternalPageWrapper>

        <StoreSync />
        <ChallengeModal />
      </Container>
    </AppDojo>
  );
}

function Matchmaking() {
  const { address } = useAccount()
  const [playerAddress, setPlayerAddress] = useState<string>()
  const playerName = useUsernameFromPlayerAddress(playerAddress)
  // init from connected account
  useEffect(() => setPlayerAddress(address), [address])
  // fetch balances
  const { foolsContractAddress } = useTokenContracts()
  useFetchAccountsBalances(foolsContractAddress, [playerAddress], isPositiveBigint(playerAddress))
  return (
    <>
      <Table celled stackable size='small' color='green'>
        <Body>
          <WalletAddressRow address={playerAddress} setAddress={setPlayerAddress} label='Player' />
        </Body>
      </Table>

      <br />
      <Tab panes={[
        { menuItem: 'Unranked', render: () => <TabPane className='NoBorder'><MatchQueue queueId={constants.QueueId.Unranked} playerAddress={playerAddress} playerName={playerName} /></TabPane> },
        { menuItem: 'Ranked', render: () => <TabPane className='NoBorder'><MatchQueue queueId={constants.QueueId.Ranked} playerAddress={playerAddress} playerName={playerName} /></TabPane> },
      ]} />
    </>
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


function MatchQueue({
  queueId,
  playerAddress,
  playerName,
}: {
  queueId: constants.QueueId
  playerAddress: string
  playerName: string
}) {
  const { account } = useAccount();
  const { balance: foolsBalance } = useFoolsBalance(playerAddress)
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
  } = _useDuelistsInMatchMakingByAddress(queueId, playerAddress);
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
                matchmaker.clear_player_queue(account, queueId, playerAddress)
              }}>
                Clear [{playerName}]
              </Button>
            </Cell>
          </Row>
        </Body>
      </Table>

      <Table celled striped size='small' color='green'>
        <Body className='H5'>

          <Row>
            <Cell className='ModalText' width={3}>In Queue ({inQueueIds.length})</Cell>
            <Cell className='Code'>
              {inQueueIds.map((duelistId) => (
                <Button key={duelistId} disabled={true}>
                  {bigintToDecimal(duelistId)}
                </Button>
              ))}
            </Cell>
          </Row>

          <Row>
            <Cell className='ModalText' width={3}>Dueling ({duellingIds.length})</Cell>
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
              <Cell className='ModalText'>
                <span className='Important'>Enlist Duelists ({duelistIds.length})</span>
                <br />Balance: 
                <span className={(foolsBalance < entryTokenAmount) ? 'Negative' : 'Positive'}>
                  <FoolsBalance address={playerAddress} size='big' />
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
                Enlisted Duelists ({rankedEnlistedIds.length})
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
              <Cell className='ModalText' width={3}>Enter {queueId} FAST ({duelistIds.length})</Cell>
              <Cell className='Code'>
                {duelistIds.map((duelistId) => (
                  <MatchMakeMeButton
                    key={duelistId}
                    duelistId={duelistId}
                    queueId={queueId}
                    queueMode={constants.QueueMode.Fast}
                    disabled={!canMatchMakeIds.includes(duelistId)}
                  />
                ))}
              </Cell>
            </Row>
          </>}

          <Row>
            <Cell className='ModalText' width={3}>Enter {queueId} SLOW ({duelistIds.length})</Cell>
            <Cell className='Code'>
              {duelistIds.map((duelistId) => (
                <MatchMakeMeButton
                  key={duelistId}
                  duelistId={duelistId}
                  queueId={queueId}
                  queueMode={constants.QueueMode.Slow}
                  disabled={!canMatchMakeIds.includes(duelistId)}
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
  const { slot, duelistId, duelId, nextDuelists } = useMatchPlayer(playerAddress, queueId)
  return (
    <li>
      {getPlayernameFromAddress(playerAddress)}:
      <Address address={playerAddress} />
      / Duel#{duelId ? Number(duelId) : '-'} / Duelist#{Number(duelistId)}{nextDuelists.length > 0 ? `+${nextDuelists.length}(${nextDuelists.map(id => Number(id)).join(',')})` : ''} / SLOT: {slot}
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
}: {
  duelistId: BigNumberish
  queueId: constants.QueueId
  queueMode: constants.QueueMode
  disabled?: boolean
}) {
  const { account } = useAccount();
  const { matchmaker } = useDojoSystemCalls();
  return (
    <Button disabled={disabled} onClick={() => {
      matchmaker.match_make_me(account, duelistId, queueId, queueMode)
    }}>
      {bigintToDecimal(duelistId)}
    </Button>
  )
}
