import React, { useEffect, useMemo, useState } from 'react'
import { Container, Table } from 'semantic-ui-react'
import { useApiSlotServiceStatus } from '@underware/pistols-sdk/api'
import { useToriiBlockHead, useToriiTransactionCount } from '/src/queries/useToriiStatusQueries'
import { EntityStoreSync } from '/src/stores/sync/EntityStoreSync'
import { PlayerNameSync } from '/src/stores/sync/PlayerNameSync'
import { useBlockNumber } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { NetworkId } from '@underware/pistols-sdk/pistols/config'
import AppDojo from '/src/components/AppDojo'

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
  const { data: blockNumber, isLoading: isBlockNumberLoading, isError: isBlockNumberError, error: blockNumberError } = useBlockNumber({
    refetchInterval: 1000,
  })
  return (
    <>
      <Table>
        <Header>
          <Row className='ModalText Important'>
            <HeaderCell width={2}>Torii Servers</HeaderCell>
            <HeaderCell width={1}>Status</HeaderCell>
            <HeaderCell width={1}>Latency</HeaderCell>
            <HeaderCell width={3}>Version</HeaderCell>
            <HeaderCell width={4}>Block/Head</HeaderCell>
            <HeaderCell width={1}>Txs</HeaderCell>
            <HeaderCell width={1}>Entts</HeaderCell>
            <HeaderCell width={1}>Ctrls</HeaderCell>
            <HeaderCell width={1}>SQL</HeaderCell>
          </Row>
        </Header>
        <Body className='Smaller'>
          <ToriiStatusRow slotName='pistols-mainnet' blockNumber={blockNumber} />
          <ToriiStatusRow slotName='pistols-mainnet-2' blockNumber={blockNumber} />
          <ToriiStatusRow slotName='pistols-sepolia' blockNumber={blockNumber} />
        </Body>
      </Table>
    </>
  )
}


function ToriiStatusRow({
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
    (selectedNetworkConfig.networkId === NetworkId.SEPOLIA && slotName.includes('sepolia'))
  )

  const { status, isLoading, isError } = useApiSlotServiceStatus(toriiUrl)
  const isOnline = (status?.success ?? false);
  // console.log(`ToriiStatus() status:`, status, isLoading, isError)

  const [blockHead, setBlockHead] = useState<number | null>(null)
  const { blockHead: newBlockHead, isLoading: isLoadingBlockHead, latency } = useToriiBlockHead({ toriiUrl, blockNumber, enabled: isOnline })
  useEffect(() => {
    if (!isLoadingBlockHead) {
      setBlockHead(newBlockHead)
    }
  }, [newBlockHead, isLoadingBlockHead])

  const { transactionCount, entityCount, controllerCount, isLoading: isLoadingTransactionCount } = useToriiTransactionCount({ toriiUrl, enabled: isOnline })

  const blockOffset = (blockNumber && blockHead ? (blockHead - blockNumber) : null);
  const percent = Math.floor(blockHead && blockNumber ? (blockHead / blockNumber) * 10000 : 0);

  const statusClass = (status?.success === true ? 'Positive' : (status?.success === false || status?.error) ? 'Negative' : 'Warning');
  const headClass = (!isCurrentNetwork ? '' : blockOffset < -3 ? 'Negative' : blockOffset < -1 ? 'Warning' : 'Positive');
  const latencyClass = (latency < 500 ? 'Positive' : latency < 1000 ? 'Warning' : 'Negative');

  return (
    <>
      <Row className='Number'>
        <Cell><b>{slotName}{isCurrentTorii && <><br /><span className='Important'> (CURRENT)</span></>}</b></Cell>
        <Cell className={statusClass}>
          <b>{status ? (status.success ? 'OK' : 'Error') : '...'}</b>
          {status?.error && <>: {status.error}</>}
        </Cell>
        <Cell>
          <b>{latency ? <span className={latencyClass}>{latency}ms</span> : '...'}</b>
        </Cell>
        <Cell><b>{status?.version ?? '...'}</b></Cell>
        <Cell>
          <b>{blockHead ? (<span className={headClass}>{blockHead}</span>) : '...'}</b>
          {' of '}
          <b>{isCurrentNetwork ? (blockNumber ?? '?') : 'N/A'}</b>
          {' '}
          ({blockOffset == null || !isCurrentNetwork ? '?'
            : blockOffset === 0 ? <span className={headClass}>head</span>
              : headClass == 'Negative' ? <span className={headClass}>{`${blockOffset}, ${(percent / 100)?.toFixed(2)}%`}</span>
                : <span className={headClass}>{blockOffset}</span>
          })
        </Cell>
        <Cell><b>{transactionCount}</b></Cell>
        <Cell><b>{entityCount}</b></Cell>
        <Cell><b>{controllerCount}</b></Cell>
        <Cell singleLine={false}><a href={`${toriiUrl}/sql`} target='_blank'>sql</a></Cell>
      </Row>
    </>
  )
}
