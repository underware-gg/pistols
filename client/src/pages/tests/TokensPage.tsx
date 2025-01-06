import React, { useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Container, Table } from 'semantic-ui-react'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { PlayerDuelistTokensStoreSyncQL, useTokenIdsByOwner, useTokenIdsOfPlayer, useTokensByOwner } from '/src/stores/duelistTokenStore'
import { DojoAccount } from './ConnectPage'
import { Connect } from './ConnectPage'
import App from '/src/components/App'
import { bigintToHex, bigintToNumber } from '@underware_gg/pistols-sdk/utils'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { useAccount } from '@starknet-react/core'

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
      const { tokenId, metadata } = token
      const meta = JSON.parse(metadata)
      // console.log('meta', meta)
      const { id, name, description, image, metadata: attr } = meta
      // const img = image.replace('https', 'http')
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
            <img src={image} alt={name} style={{ width: '100px', height: '100px' }} />
          </Cell>
          <Cell>
            <embed src={image} style={{ width: '100px', height: '100px' }} />
          </Cell>
        </Row>
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
          <HeaderCell><h3 className='Important'>{`<img>`}</h3></HeaderCell>
          <HeaderCell><h3 className='Important'>{`<embed>`}</h3></HeaderCell>
        </Row>
      </Header>

      <Body>
        {rows}
      </Body>
    </Table>
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
