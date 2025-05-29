import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Button, Container, Icon, Table } from 'semantic-ui-react'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useTokenIdsOfPlayer } from '/src/stores/tokenStore'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { SeasonChallengeStoreSync, SeasonScoreboardStoreSync } from '/src/stores/sync/SeasonEntityStoreSync'
import { useERC721TokenUri, useMemoAsync } from '@underware/pistols-sdk/utils/hooks'
import { duelist_token, duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { Connect } from '/src/pages/tests/ConnectTestPage'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { DuelistTokenArt } from '/src/components/cards/DuelistTokenArt'
import { DuelTokenArt } from '/src/components/cards/DuelTokenArt'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useAccount } from '@starknet-react/core'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { LordsFaucet } from '/src/components/account/LordsFaucet'
import { FameBalanceDuelist, FameLivesDuelist, LordsBalance } from '/src/components/account/LordsBalance'
import { usePacksOfPlayer } from '/src/hooks/useTokenPacks'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import CurrentChainHint from '/src/components/CurrentChainHint'
import AppDojo from '/src/components/AppDojo'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function TokensTestPage() {
  return (
    <AppDojo>
      <Container>
        <TestPageMenu />
        <CurrentChainHint />
        <Connect />

        <TestImages />
        <Purchases />
        <Tokens />

        <EntityStoreSync />
        <TokenStoreSync />
        <SeasonChallengeStoreSync />
        <SeasonScoreboardStoreSync />
      </Container>
    </AppDojo>
  );
}

const _style = {
  minWidth: '70px',
  width: 'auto',
  height: '200px',
}

function Purchases() {
  const { account, address, isConnected } = useAccount()
  const { pack_token } = useDojoSystemCalls()
  const { packIds } = usePacksOfPlayer()
  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(Math.min(duelistIds.length, 1))
  if (!isConnected) return <></>
  return (
    <>
      <LordsFaucet />
      &nbsp;&nbsp;<LordsBalance address={address} size='big' />
      &nbsp;&nbsp;<span className='Code'>(mint test LORDS, if available)</span>
      <br />
      <Button disabled={!canClaimStarterPack} onClick={() => pack_token.claim_starter_pack(account)}>Claim Starter Pack</Button>
      &nbsp;&nbsp;<span className='Code'>(mint PACK + burn PACK + mint 2 DUELISTS)</span>
      <br />
      <Button disabled={canClaimStarterPack} onClick={() => pack_token.purchase(account, constants.PackType.GenesisDuelists5x)}>Purchase Pack</Button>
      &nbsp;&nbsp;<span className='Code'>(transfer $LORDS + mint PACK)</span>
      <br />
      <Button disabled={packIds.length === 0} onClick={() => pack_token.open(account, packIds[0])}>Open Pack {packIds[0] ?? ''}</Button>
      &nbsp;&nbsp;<span className='Code'>[{packIds.join(',')}] (burn PACK + mint 5 DUELISTS)</span>
    </>
  );
}

function Tokens() {
  const {
    packContractAddress,
    duelistContractAddress,
    duelContractAddress,
  } = useTokenContracts()
  const { isConnected } = useAccount()
  if (!isConnected) return <></>
  return (
    <>
      <br />
      <TokenContract contractAddress={packContractAddress} tokenName='Packs' attributes={['Is Open']} />
      <br />
      <TokenContract contractAddress={duelistContractAddress} tokenName='Duelists' hasFame
        renderer={(tokenId: bigint) => <DuelistTokenArt duelistId={tokenId} style={_style} />}
      />
      <br />
      <TokenContract contractAddress={duelContractAddress} tokenName='Duels'
        renderer={(tokenId: bigint) => <DuelTokenArt duelId={tokenId} style={_style} />}
      />
    </>
  );
}

function TokenContract({
  contractAddress,
  tokenName,
  attributes = [],
  renderer = null,
  hasFame = false,
}: {
  contractAddress: BigNumberish,
  tokenName: string,
  attributes?: string[],
  renderer?: (tokenId: bigint) => React.ReactNode,
  hasFame?: boolean,
}) {
  // const { address } = useAccount()
  // const { tokens } = useTokenIdsByAccount(contractAddress, address) // direct get
  const { tokenIds } = useTokenIdsOfPlayer(contractAddress) // from the store

  const rows = useMemo(() => {
    return tokenIds.sort((a, b) => Number(a - b)).map((tokenId) => {
      return (
        <TokenRow key={tokenId}
          contractAddress={contractAddress}
          tokenId={tokenId}
          // cached_metadata={token.metadata}
          cached_metadata={'{}'}
          attributes={attributes}
          rendered_token={renderer?.(tokenId)}
          hasFame={hasFame}
        />
      )
    })
  }, [tokenIds])

  return (
    <Table attached>
      <Header fullWidth>
        <Row>
          <HeaderCell width={2}><h3 className='Important'>{tokenName}: {tokenIds.length}</h3></HeaderCell>
          {/* <HeaderCell width={4}><h3 className='Important'>{bigintToHex(contractAddress)}</h3></HeaderCell> */}
          <HeaderCell><h3 className='Important'>Props</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Cached {`<img>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Cached {`<embed>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>RPC {`<img>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>RPC {`<embed>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Render {`<img>`}</h3></HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell colSpan={10}>
            <span className='Code'>{bigintToHex(contractAddress)}</span>
          </Cell>
        </Row>
        {rows}
      </Body>
    </Table>
  )
}



function TokenRow({
  contractAddress,
  tokenId,
  cached_metadata,
  attributes = [],
  rendered_token = null,
  hasFame = false,
}: {
  contractAddress: BigNumberish,
  tokenId: bigint,
  cached_metadata: string,
  attributes?: string[],
  rendered_token?: React.ReactNode,
  hasFame?: boolean,
}) {
  const { id, name, description, image: cached_image, metadata: attr } = useMemo(() => JSON.parse(cached_metadata), [cached_metadata])
  // const img = image.replace('https', 'http')
  const { image: rpc_image, metadata: rpc_metadata } = useERC721TokenUri(contractAddress, tokenId)
  return (
    <Row key={tokenId}>
      <Cell verticalAlign='top'>
        <h1>#{bigintToDecimal(tokenId)}</h1>
        {hasFame && <>
          <FameBalanceDuelist duelistId={tokenId} size='huge' />
          <br />
          <FameLivesDuelist duelistId={tokenId} size='huge' />
        </>}
      </Cell>
      <Cell verticalAlign='top'>
        <h3>{name}</h3>
        {attributes.map((a) => (
          <li key={a}>{a}: <b>{attr?.[a] ?? '?'}</b></li>
        ))}
      </Cell>
      <Cell verticalAlign='top'>
        {/* <img src={cached_image} alt={name} style={_style} /> */}
        {/* &nbsp;<a href={cached_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a> */}
      </Cell>
      <Cell verticalAlign='top'>
        {/* <embed src={cached_image} style={_style} /> */}
        {/* &nbsp;<a href={cached_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a> */}
      </Cell>
      <Cell verticalAlign='top'>
        <img src={rpc_image} alt={name} style={_style} />
        &nbsp;<a href={rpc_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='top'>
        <embed src={rpc_image} style={_style} />
        &nbsp;<a href={rpc_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='top'>
        {rendered_token}
      </Cell>
    </Row>
  )
}


function TestImages() {
  const { value: duelist_svg } = useMemoAsync<string>(async () => {
    return await duelist_token.renderSvg({
      // base_uri: 'https://localhost:5173',
      duelist_id: 16,
      owner: '0x0',
      username: 'Patron',
      honour: 99,
      archetype: constants.Archetype.Honourable,
      profile_type: constants.DuelistProfile.Genesis,
      profile_id: 2,
      total_duels: 10,
      total_wins: 5,
      total_losses: 2,
      total_draws: 3,
      fame: 4250,
      lives: 4,
      is_memorized: false,
      duel_id: 0,
      pass_id: 0,
      timestamp_registered: 0x1,
      timestamp_active: 0x6814fbaa,
      level: 2,
    }, {
      includeMimeType: true,
    })
  }, [], undefined, null)
  const { value: duel_svg } = useMemoAsync<string>(async () => {
    return await duel_token.renderSvg({
      // base_uri: 'https://localhost:5173',
      duel_id: 16,
      duel_type: constants.DuelType.Seasonal,
      premise: constants.Premise.Honour,
      message: 'Die scum!!!',
      state: constants.ChallengeState.Resolved,
      winner: 1,
      season_id: 1,
      profile_type_a: constants.DuelistProfile.Genesis,
      profile_type_b: constants.DuelistProfile.Bot,
      profile_id_a: 11,
      profile_id_b: 2,
      username_a: 'Mataleone',
      username_b: 'Recipromancer',
      address_a: '0xc1bba2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befe',
      address_b: '0xc079a1283c88c1bba2af9427c5a2774740ee8a6f0f8fbf73ce969c08d88befe',
    }, {
      includeMimeType: true,
    })
  }, [], undefined, null)
  const { value: duel_pending_svg } = useMemoAsync<string>(async () => {
    return await duel_token.renderSvg({
      // base_uri: 'https://localhost:5173',
      duel_id: 16,
      duel_type: constants.DuelType.Seasonal,
      premise: constants.Premise.Honour,
      message: 'Die scum!!!',
      state: constants.ChallengeState.Awaiting,
      winner: 1,
      season_id: 1,
      profile_type_a: constants.DuelistProfile.Genesis,
      profile_type_b: constants.DuelistProfile.Undefined,
      profile_id_a: 11,
      profile_id_b: 0,
      username_a: 'Mataleone',
      username_b: 'Undefined',
      address_a: '0xc1bba2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befe',
      address_b: '0xc079a1283c88c1bba2af9427c5a2774740ee8a6f0f8fbf73ce969c08d88befe',
    }, {
      includeMimeType: true,
    })
  }, [], undefined, null)
  // const duelist_svg_no_mime = duelist_svg.replace('data:image/svg+xml,', '')
  // const duel_svg_no_mime = duel_svg.replace('data:image/svg+xml,', '')

  return (
    <Table attached>
      <Header fullWidth>
        <Row>
          <HeaderCell>
            <h3 className='Important'>TEST DUELIST<br />{`<img>`}</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST DUELIST<br />{`<embed>`}</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST DUEL<br />{`<img>`}</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST DUEL<br />{`<embed>`}</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>PENDING DUEL<br />{`<img>`}</h3>
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>
            <img src={duelist_svg} style={_style} />
          </Cell>
          <Cell>
            <embed src={duelist_svg} style={_style} />
          </Cell>
          <Cell>
            <img src={duel_svg} style={_style} />
          </Cell>
          <Cell>
            <embed src={duel_svg} style={_style} />
          </Cell>
          <Cell>
            <img src={duel_pending_svg} style={_style} />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}

