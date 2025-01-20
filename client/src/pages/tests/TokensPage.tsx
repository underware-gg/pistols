import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { PlayerDuelistTokensStoreSyncQL, useTokensByOwner } from '/src/stores/duelistTokenStore'
import { bigintToNumber, useERC721TokenUri } from '@underware_gg/pistols-sdk/utils'
import { Connect } from './ConnectPage'
import App from '/src/components/App'

// const Row = Grid.Row
// const Col = Grid.Column
const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function TokensPage() {
  const { packContractAddress } = usePackTokenContract()
  const { duelistContractAddress } = useDuelistTokenContract()
  const { duelContractAddress } = useDuelTokenContract()
  return (
    <App>
      <Container>
        <Connect />
        <TestImages />
        <br />
        <TokenContract contractAddress={packContractAddress} tokenName='Packs' attributes={['Is Open']} />
        <br />
        <TokenContract contractAddress={duelistContractAddress} tokenName='Duelists' />
        <br />
        <TokenContract contractAddress={duelContractAddress} tokenName='Duels' />
        <br />
        <PlayerDuelistTokensStoreSyncQL watch={false} />
      </Container>
    </App>
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
        <h3>{bigintToNumber(tokenId)}</h3>
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

  const svg_original = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'><image href='https://localhost:5173/profiles/duelists/square/16.jpg' x='0' y='0' width='1024px' height='1024px' /><image href='https://localhost:5173/textures/cards/card_front_brown.png' x='0' y='0' width='1024px' height='1434px' /></svg>`
  const svg_edited = `data:image/svg+xml,
<svg
  xmlns='http://www.w3.org/2000/svg'
  xmlns:xlink='http://www.w3.org/1999/xlink'
  preserveAspectRatio='xMinYMin meet'
  viewBox='0 0 1024 1434'
  width='1024'
  height='1434'
>
  <image href='https://localhost:5173/profiles/duelists/square/16.jpg' x='0' y='0' width='1024px' height='1024px' />
  <image href='https://localhost:5173/textures/cards/card_front_brown.png' x='0' y='0' width='1024px' height='1434px'/>
  <foreignObject width='1000' height='1434'>
    <body xmlns='http://www.w3.org/1999/xhtml'>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <p>Here is a paragraph that requires word wrap</p>
      <img src='https://localhost:5173/textures/cards/card_front_brown.png' x='500' y='500'/>
    </body>
  </foreignObject>
</svg>
`

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
            <img src={svg_original} style={style} />
          </Cell>
          <Cell>
            <embed src={svg_original} style={style} />
          </Cell>
          <Cell>
            <img src={svg_edited} style={style} />
          </Cell>
          <Cell>
            <embed src={svg_edited} style={style} />
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}
