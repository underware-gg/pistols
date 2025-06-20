import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {  Container, Menu, MenuItem, Table } from 'semantic-ui-react'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'
import { NetworkId } from '@underware/pistols-sdk/pistols/config'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { useDuelistStackStore, useDuelistStore } from '/src/stores/duelistStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { usePlayerEntityStore } from '/src/stores/playerStore'
import { useScoreboardStore } from '/src/stores/scoreboardStore'
import { usePlayerDataStore } from '/src/stores/playerStore'
import { usePackStore } from '/src/stores/packStore'
import { useBankStore } from '/src/stores/bankStore'
import { useSeasonStore } from '/src/stores/seasonStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { useConfigStore } from '/src/stores/configStore'
import { SeasonChallengeStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'

//@ts-ignore
BigInt.prototype.toJSON = function () { return bigintToHex(this) }

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function SignTestPage() {
  const location = useLocation()
  const [networkId, setNetworkId] = useState<NetworkId>(location.search.split('=')[1] as NetworkId ?? NetworkId.ACADEMY)

  let navigate = useNavigate();
  const _click = (networkId: NetworkId) => {
    setNetworkId(networkId)
    navigate({
      pathname: "/tests/chainswitch",
      search: `?networkId=${networkId}`,
    });
  }

  if (!networkId) return <div>Loading...</div>

  return (
    <AppDojo networkId={networkId} autoConnect={networkId === NetworkId.ACADEMY}>
      <TestPageMenu />
      <CurrentChainHint />

      <Container text>
        <Menu size='small' inverted fluid widths={3}>
          <MenuItem name='mainnet' active={networkId === NetworkId.MAINNET} onClick={() => _click(NetworkId.MAINNET)} />
          <MenuItem name='sepolia' active={networkId === NetworkId.SEPOLIA} onClick={() => _click(NetworkId.SEPOLIA)} />
          <MenuItem name='academy' active={networkId === NetworkId.ACADEMY} onClick={() => _click(NetworkId.ACADEMY)} />
        </Menu>
        <Connect />

        <StoreStats />

        <EntityStoreSync />
        <SeasonChallengeStoreSync />
      </Container>
    </AppDojo>
  )
}

function StoreStats() {
  // misc
  const configState = useConfigStore((state) => state)
  const tokenState = useTokenConfigStore((state) => state)
  const seasonState = useSeasonStore((state) => state)
  const bankState = useBankStore((state) => state)
  const packState = usePackStore((state) => state)
  // players
  const playerState = usePlayerEntityStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  // duelists
  const duelistState = useDuelistStore((state) => state)
  const duelistStackState = useDuelistStackStore((state) => state)
  // per season (update only)
  const challengeState = useChallengeStore((state) => state)
  const scoreboardState = useScoreboardStore((state) => state)


  return (
    <Table celled striped size='small' color={'green'}>
      <Body className='ModalText'>
        <StoreCountRow name='Config' entities={configState.entities} />
        <StoreCountRow name='TokenConfig' entities={tokenState.entities} />
        <StoreCountRow name='Season' entities={seasonState.entities} />
        <StoreCountRow name='Bank' entities={bankState.entities} />
        <StoreCountRow name='Pack' entities={packState.entities} />
        <StoreCountRow name='Player' entities={playerState.entities} />
        {/* <StoreCountRow name='PlayerData' entities={playerDataState.entities} /> */}
        <StoreCountRow name='Duelists' entities={duelistState.entities} important />
        <StoreCountRow name='Stacks' entities={duelistStackState.entities} />
        <StoreCountRow name='Challenges' entities={challengeState.entities} important />
        {/* <StoreCountRow name='Scoreboard' entities={scoreboardState.entities} /> */}
      </Body>
    </Table>
  )
}

function StoreCountRow({
  name,
  entities,
  important = false,
}: {
  name: string,
  entities: any,
  important?: boolean,
}) {
  return (
    <Row columns={'equal'} className={important ? 'Important' : ''}>
      <Cell>{name}</Cell>
      <Cell>{Object.keys(entities).length}</Cell>
    </Row>
  )
}

