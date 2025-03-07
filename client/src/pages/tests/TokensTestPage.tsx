import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { useTokensByOwner } from '/src/stores/tokenStore'
import { TokensOfPlayerStoreSyncQL } from '/src/stores/sync/TokenStoreSync'
import { useERC721TokenUri } from '@underware_gg/pistols-sdk/utils/hooks'
import { duelist_token, duel_token } from '@underware_gg/pistols-sdk/pistols/tokens'
import { bigintToDecimal } from '@underware_gg/pistols-sdk/utils'
import { Connect } from './ConnectTestPage'
import { TestPageMenu } from '/src/pages/tests/TestPageIndex'
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
      <TokensOfPlayerStoreSyncQL />
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
          cached_metadata={token.metadata}
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
    duelist_id: 16,
    base_uri: 'https://localhost:5173',
    profile_type: 'duelists',
    profile_id: '16',
  })
  const duel_svg = duel_token.renderSvg({
    duel_id: 16,
    base_uri: 'https://localhost:5173',
    profile_type_a: 'duelists',
    profile_id_a: '1',
    profile_type_b: 'duelists',
    profile_id_b: '11',
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
