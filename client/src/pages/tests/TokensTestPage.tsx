import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Icon, Table } from 'semantic-ui-react'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { useTokenIdsOfPlayer, useTokensByOwner } from '/src/stores/tokenStore'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { ChallengeStoreSync } from '/src/stores/sync/ChallengeStoreSync'
import { useERC721TokenUri } from '@underware/pistols-sdk/utils/hooks'
import { duelist_token, duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { Connect } from './ConnectTestPage'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
import { DuelistTokenArt } from '/src/components/cards/DuelistTokenArt'
import { DuelTokenArt } from '/src/components/cards/DuelTokenArt'
import { constants } from '@underware/pistols-sdk/pistols/gen'
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

        <EntityStoreSync />
        <TokenStoreSync />
        <ChallengeStoreSync />

        <TestImages />
        <Tokens />
      </Container>
    </AppDojo>
  );
}

const _style = {
  minWidth: '70px',
  width: 'auto',
  height: '100px',
}

function Tokens() {
  const { packContractAddress } = usePackTokenContract()
  const { duelistContractAddress } = useDuelistTokenContract()
  const { duelContractAddress } = useDuelTokenContract()
  // useSdkTokenBalancesTest();
  return (
    <>
      <br />
      <TokenContract contractAddress={packContractAddress} tokenName='Packs' attributes={['Is Open']} />
      <br />
      <TokenContract contractAddress={duelistContractAddress} tokenName='Duelists'
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
}: {
  contractAddress: BigNumberish,
  tokenName: string,
  attributes?: string[],
  renderer?: (tokenId: bigint) => React.ReactNode,
}) {
  // const { address } = useAccount()
  // const { tokens } = useTokensByOwner(contractAddress, address) // direct get
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
        />
      )
    })
  }, [tokenIds])

  return (
    <Table attached>
      <Header fullWidth>
        <Row>
          <HeaderCell width={4}><h3 className='Important'>{tokenName}</h3></HeaderCell>
          {/* <HeaderCell width={4}><h3 className='Important'>{bigintToHex(contractAddress)}</h3></HeaderCell> */}
          <HeaderCell><h3 className='Important'>Name</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Cached {`<img>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Cached {`<embed>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>RPC {`<img>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>RPC {`<embed>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>Render {`<img>`}</h3></HeaderCell>
        </Row>
      </Header>

      <Body>
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
}: {
  contractAddress: BigNumberish,
  tokenId: bigint,
  cached_metadata: string,
  attributes?: string[],
  rendered_token?: React.ReactNode,
}) {
  const { id, name, description, image: cached_image, metadata: attr } = useMemo(() => JSON.parse(cached_metadata), [cached_metadata])
  // const img = image.replace('https', 'http')
  const { image: rpc_image, metadata: rpc_metadata } = useERC721TokenUri(contractAddress, tokenId)
  return (
    <Row key={tokenId}>
      <Cell verticalAlign='top'>
        <h3>{bigintToDecimal(tokenId)}</h3>
      </Cell>
      <Cell verticalAlign='top'>
        <h3>{name}</h3>
        {attributes.map((a) => (
          <li key={a}>{a}: <b>{attr?.[a] ?? '?'}</b></li>
        ))}
      </Cell>
      <Cell verticalAlign='bottom'>
        <img src={cached_image} alt={name} style={_style} />
        &nbsp;<a href={cached_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='bottom'>
        <embed src={cached_image} style={_style} />
        &nbsp;<a href={cached_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='bottom'>
        <img src={rpc_image} alt={name} style={_style} />
        &nbsp;<a href={rpc_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='bottom'>
        <embed src={rpc_image} style={_style} />
        &nbsp;<a href={rpc_image} target='_blank'><Icon className='Anchor' name='external' size='small' /></a>
      </Cell>
      <Cell verticalAlign='bottom'>
        {rendered_token}
      </Cell>
    </Row>
  )
}


function TestImages() {
  const duelist_svg = duelist_token.renderSvg({
    // base_uri: 'https://localhost:5173',
    duelist_id: 16,
    owner: '0x0',
    username: 'Patron',
    honour: 99,
    archetype: constants.Archetype.Honourable,
    profile_type: constants.ProfileType.Duelist,
    profile_id: 16,
    total_duels: 10,
    total_wins: 5,
    total_losses: 2,
    total_draws: 3,
    fame: 4250,
    lives: 4,
    is_memorized: false,
    duel_id: 0,
  }, {
    includeMimeType: true,
  })
  const duel_svg = duel_token.renderSvg({
    // base_uri: 'https://localhost:5173',
    duel_id: 16,
    table_id: 'Table1',
    premise: constants.Premise.Honour,
    quote: 'Die scum!!!',
    state: constants.ChallengeState.Resolved,
    winner: 1,
    profile_type_a: constants.ProfileType.Duelist,
    profile_type_b: constants.ProfileType.Bot,
    profile_id_a: 11,
    profile_id_b: 2,
    username_a: 'Mataleone',
    username_b: 'Recipromancer',
    address_a: '0xc1bba2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befe',
    address_b: '0xc079a1283c88c1bba2af9427c5a2774740ee8a6f0f8fbf73ce969c08d88befe',
  }, {
    includeMimeType: true,
  })
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
        </Row>
      </Body>
    </Table>
  )
}




// import { useAccount } from '@starknet-react/core'
// import { useDojoSetup } from '@underware/pistols-sdk/dojo'
// import * as torii from '@dojoengine/torii-client'
// const useSdkTokenBalancesTest = () => {
//   const { sdk } = useDojoSetup();
//   useEffect(() => {
//     const _get = async () => {
//       await sdk.getTokenBalances(
//         ["0x335f20596a8cc613cfe2c463443513beee082ce84ceee8dbf18f993f1959e8b"], // packs
//         ["0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f"], // Mataleone
//         []
//       ).then((balances: torii.TokenBalance[]) => {
//         console.log("sdk.getTokenBalances() PACKS+Mataleone:", balances)
//       }).catch((error: Error) => {
//         console.error("useSdkTokenBalancesGet().sdk.get() ERROR PACKS+Mataleone:", error)
//       });
//       await sdk.getTokenBalances(
//         ["0x43f800e9f5f6e290a798379029fcb28ba7c34e9669f7b5fc77fce8a4ebdc893"], // duelists
//         ["0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f"], // Mataleone
//         []
//       ).then((balances: torii.TokenBalance[]) => {
//         console.log("sdk.getTokenBalances() DUELISTS+Mataleone:", balances)
//       }).catch((error: Error) => {
//         console.error("useSdkTokenBalancesGet().sdk.get() ERROR DUELISTS+Mataleone:", error)
//       });
//       await sdk.getTokenBalances(
//         ["0x335f20596a8cc613cfe2c463443513beee082ce84ceee8dbf18f993f1959e8b"], // packs
//         ["0x0458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69"], // Rogers
//         []
//       ).then((balances: torii.TokenBalance[]) => {
//         console.log("sdk.getTokenBalances() PACKS+Rogers:", balances)
//       }).catch((error: Error) => {
//         console.error("useSdkTokenBalancesGet().sdk.get() ERROR PACKS+Rogers:", error)
//       });
//       await sdk.getTokenBalances(
//         ["0x43f800e9f5f6e290a798379029fcb28ba7c34e9669f7b5fc77fce8a4ebdc893"], // duelists
//         ["0x0458f10bf89dfd916eaeabbf6866870bd5bb8b05c6df7de0ad36bb8ad66dce69"], // Rogers
//         []
//       ).then((balances: torii.TokenBalance[]) => {
//         console.log("sdk.getTokenBalances() DUELISTS+Rogers:", balances)
//       }).catch((error: Error) => {
//         console.error("useSdkTokenBalancesGet().sdk.get() ERROR DUELISTS+Rogers:", error)
//       });
//     }
//     _get();
//   }, []);
//   return {};
// }
