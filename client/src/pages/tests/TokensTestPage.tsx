import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { useTokensByOwner } from '/src/stores/tokenStore'
import { TokenStoreSync } from '/src/stores/sync/TokenStoreSync'
import { useERC721TokenUri } from '@underware/pistols-sdk/utils/hooks'
import { duelist_token, duel_token } from '@underware/pistols-sdk/pistols/tokens'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { Connect } from './ConnectTestPage'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
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

        <TestImages />
        <Tokens />
      </Container>
    </AppDojo>
  );
}

function Tokens() {
  const { packContractAddress } = usePackTokenContract()
  const { duelistContractAddress } = useDuelistTokenContract()
  const { duelContractAddress } = useDuelTokenContract()
  return (
    <>
      <br />
      <TokenContract contractAddress={packContractAddress} tokenName='Packs' attributes={['Is Open']} />
      <br />
      <TokenContract contractAddress={duelistContractAddress} tokenName='Duelists' />
      <br />
      <TokenContract contractAddress={duelContractAddress} tokenName='Duels' />
      <br />
      <TokenStoreSync />
    </>
  );
}

function TokenContract({
  contractAddress,
  tokenName,
  attributes = [],
}: {
  contractAddress: BigNumberish,
  tokenName: string,
  attributes?: string[],
}) {
  const { address } = useAccount()
  const { tokens } = useTokensByOwner(contractAddress, address) // direct get
  // const { tokenIds } = useTokenIdsOfPlayer(contractAddress) // from the store

  const rows = useMemo(() => {
    return tokens.sort((a, b) => Number(a.tokenId - b.tokenId)).map((token) => {
      return (
        <TokenRow key={token.tokenId}
          contractAddress={contractAddress}
          tokenId={token.tokenId}
          // cached_metadata={token.metadata}
          cached_metadata={''}
          attributes={attributes}
        />
      )
    })
  }, [tokens])

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
}: {
  contractAddress: BigNumberish,
  tokenId: bigint,
  cached_metadata: string,
  attributes?: string[],
}) {
  const { id, name, description, image: cached_image, metadata: attr } = useMemo(() => JSON.parse(cached_metadata), [cached_metadata])
  // const img = image.replace('https', 'http')
  const { image: rpc_image } = useERC721TokenUri(contractAddress, tokenId)
  const style = { width: '100px', height: '100px' }
  return (
    <Row key={tokenId}>
      <Cell verticalAlign='top'>
        <h3>{bigintToDecimal(tokenId)}</h3>
      </Cell>
      <Cell verticalAlign='top'>
        <h3>{name}</h3>
        {attributes.map((a) => (
          <li key={a}>{a}: <b>{attr[a]}</b></li>
        ))}
      </Cell>
      <Cell>
        <img src={cached_image} alt={name} style={style} />
      </Cell>
      <Cell>
        <embed src={cached_image} style={style} />
      </Cell>
      <Cell>
        <img src={rpc_image} alt={name} style={style} />
      </Cell>
      <Cell>
        <embed src={rpc_image} style={style} />
      </Cell>
    </Row>
  )

}






function TestImages() {
  const style = { width: '100px', height: '100px', backgroundColor: 'black' }

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
    owner_a: '0xc1bba2af9427c5a277474c079a1283c880ee8a6f0f8fbf73ce969c08d88befe',
    owner_b: '0xc079a1283c88c1bba2af9427c5a2774740ee8a6f0f8fbf73ce969c08d88befe',
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
            <h3 className='Important'>TEST<br />{`<img>`}<br />(original)</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST<br />{`<embed>`}<br />(original)</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST<br />{`<img>`}<br />(edited)</h3>
          </HeaderCell>
          <HeaderCell>
            <h3 className='Important'>TEST<br />{`<embed>`}<br />(edited)</h3>
          </HeaderCell>
        </Row>
      </Header>

      <Body>
        <Row>
          <Cell>
            <img src={duelist_svg} style={style} />
          </Cell>
          <Cell>
            <embed src={duelist_svg} style={style} />
          </Cell>
          <Cell>
            <img src={duel_svg} style={style} />
          </Cell>
          <Cell>
            <embed src={duel_svg} style={style} />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}
