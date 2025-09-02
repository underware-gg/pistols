import React, { useMemo } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useApiSlotServiceStatus } from '@underware/pistols-sdk/api'
import { useToriiBlockHead } from '/src/queries/useToriiStatusQueries'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import AppDojo from '/src/components/AppDojo'
import { useBlockNumber } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { NetworkId } from '@underware/pistols-sdk/pistols/config'

const Row = Table.Row
const Cell = Table.Cell
const Body = Table.Body
const Header = Table.Header
const HeaderCell = Table.HeaderCell

export default function StatusPage() {
  return (
    <AppDojo backgroundImage={null}>
      <EntityStoreSync />
      <PlayerNameSync />
      <Container>
        <h1>Pistols at Dawn Status</h1>
        <Status />
      </Container>
    </AppDojo>
  );
}

function Status() {
  const { data: blockNumber, isLoading: isBlockNumberLoading } = useBlockNumber({
    refetchInterval: 1000,
  })
  return (
    <>
      <ToriiStatus slotName='pistols-mainnet' blockNumber={blockNumber} />
      <ToriiStatus slotName='pistols-mainnet-2' blockNumber={blockNumber} />
      <ToriiStatus slotName='pistols-testnet' blockNumber={blockNumber} />
    </>
  )
}


function ToriiStatus({
  slotName,
  blockNumber,
}: {
  slotName: string
  blockNumber: number
}) {
  const toriiUrl = useMemo(() => (`https://api.cartridge.gg/x/${slotName}/torii`), [slotName])

  const { selectedNetworkConfig } = useDojoSetup()
  const isCurrentTorii = (selectedNetworkConfig.slotName === slotName)
  const isCurrentNetwork = (
    (selectedNetworkConfig.networkId === NetworkId.MAINNET && slotName.includes('mainnet')) ||
    (selectedNetworkConfig.networkId === NetworkId.SEPOLIA && slotName.includes('testnet'))
  )

  const { status, isLoading, isError } = useApiSlotServiceStatus(toriiUrl)
  const isOnline = (status?.success ?? false);
  // console.log(`ToriiStatus() status:`, status, isLoading, isError)

  const { blockHead, isLoading: isBlockHeadLoading, latency } = useToriiBlockHead({ toriiUrl, blockNumber, enabled: isOnline })

  const blockOffset = (blockNumber && blockHead ? (blockHead - blockNumber) : null);
  const isHead = (blockOffset !== null && blockOffset <= 1);

  const statusClass = (status?.success === true ? 'Positive' : (status?.success === false || status?.error) ? 'Negative' : 'Warning');
  const headClass = ((!isCurrentNetwork || blockOffset < -3) ? 'Negative' : blockOffset < -1 ? 'Warning' : 'Positive');
  const latencyClass = (latency < 500 ? 'Positive' : latency < 1000 ? 'Warning' : 'Negative');

  return (
    <Table color={!isOnline ? 'red' : !isHead ? 'orange' : 'green'}>
      {/* <Header>
        <Row className='H5'>
          <HeaderCell className='Important'>Torii Server</HeaderCell>
        </Row>
      </Header> */}
      <Body className='Smallerrr'>
        <Row className='Number'>
          <Cell width={3}>Torii Server</Cell>
          <Cell><b>{slotName}{isCurrentTorii && <span className='Important'> (CURRENT)</span>}</b></Cell>
        </Row>
        <Row className='Number'>
          <Cell>Torii URL</Cell>
          <Cell><a href={toriiUrl} target='_blank'>{toriiUrl}</a></Cell>
        </Row>
        <Row className='Number'>
          <Cell>Server Response</Cell>
          <Cell className={statusClass}>
            <b>{status ? (status.success ? 'OK' : 'Error') : '...'}</b>
            {status?.error && <>: {status.error}</>}
          </Cell>
        </Row>
        <Row className='Number'>
          <Cell>Version</Cell>
          <Cell><b>{status?.version ?? '...'}</b></Cell>
        </Row>
        <Row className='Number'>
          <Cell>Head Block</Cell>
          <Cell>
            <b>{blockHead ? (<span className={headClass}>{blockHead}</span>) : '...'}</b>
            {' of '}
            <b>{isCurrentNetwork ? (blockNumber ?? '?') : 'N/A'}</b>
            {' '}
            ({blockOffset == null || !isCurrentNetwork ? '?' : <span className={headClass}>{blockOffset === 0 ? 'head' : blockOffset}</span>})
          </Cell>
        </Row>
        <Row className='Number'>
          <Cell>SQL Latency</Cell>
          <Cell>
            <b>{latency ? <span className={latencyClass}>{latency}ms</span> : '...'}</b>
          </Cell>
        </Row>
      </Body>
    </Table>
  )
}
