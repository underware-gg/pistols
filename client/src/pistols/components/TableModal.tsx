import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Button, Image, Dropdown } from 'semantic-ui-react'
import { useConnect, Connector, useAccount } from '@starknet-react/core'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { Opener } from '@/lib/ui/useOpener'
import { VStack } from '@/lib/ui/Stack'
import { Divider } from '@/lib/ui/Divider'
import { AddressShort } from '@/lib/ui/AddressShort'
import { ActionButton } from './ui/Buttons'
import { tables } from '../utils/constants'
import { useSettingsContext } from '../hooks/SettingsContext'
import { useTable } from '../hooks/useTable'
import { Balance } from './account/Balance'
import { useERC20TokenName } from '@/lib/utils/hooks/useERC20'

const Row = Grid.Row
const Col = Grid.Column


export default function TableModal({
  opener,
  walletHelp = false,
}: {
  opener: Opener
  walletHelp?: boolean
}) {
  const { tableId } = useSettingsContext()
  const [selectedTableId, setSelectedTableId] = useState('')
  const { isOpen } = useTable(selectedTableId)

  // always closed on mount
  const [mounted, setMounted] = useState(false)
  useEffectOnce(() => {
    setMounted(true)
    opener.close()
  }, [])

  useEffect(() => {
    if (opener.isOpen) {
      setSelectedTableId(tableId)
    }
  }, [opener.isOpen])

  const { dispatchSetting, SettingsActions } = useSettingsContext()
  const _joinTable = () => {
    dispatchSetting(SettingsActions.TABLE_ID, selectedTableId)
    opener.close()
  }

  return (
    <Modal
      size='tiny'
      // dimmer='inverted'
      onClose={() => opener.close()}
      open={mounted && opener.isOpen}
    >
      <Modal.Header>
        <Grid>
          <Row columns={'equal'}>
            <Col textAlign='left'>
              Tables
            </Col>
            <Col textAlign='center'>
            </Col>
            <Col textAlign='right'>
            </Col>
          </Row>
        </Grid>
      </Modal.Header>
      <Modal.Content>
        <Modal.Description className='FillParent ModalText TitleCase'>
          <TableSwitcher tableId={selectedTableId} setSelectedTableId={setSelectedTableId}/>
          <Divider hidden />
          <TableDescription tableId={selectedTableId} />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton fill important label='Join Table' disabled={!isOpen} onClick={() => _joinTable()} />
            </Col>
          </Row>
        </Grid>
      </Modal.Actions>
    </Modal>
  )
}


function TableDescription({
  tableId,
}) {
  const { contractAddress,
    description,
    wagerMin,
    feeMin,
    feePct,
    isOpen,
 } = useTable(tableId)
  const { tokenName, tokenSymbol } = useERC20TokenName(contractAddress)
  return (
    <Grid >
      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Wager Coin:
        </Col>
        <Col width={8}>
          <Balance tableId={tableId}>{tokenName}</Balance>
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Minimun Wager:
        </Col>
        <Col width={8}>
          <Balance tableId={tableId} wei={wagerMin} />
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Minimun Fee:
        </Col>
        <Col width={8}>
          {(Boolean(feePct) && !Boolean(feeMin)) ?
            <span className='Wager'>{feePct}%</span>
            : <>
              <Balance tableId={tableId} wei={feeMin ?? 0} />
              {Boolean(feePct) && <> (or {feePct}%)</>}
            </>
          }
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Duels:
        </Col>
        <Col width={8} className='Wager PaddedLeft'>
          99
        </Col>
      </Row>

      <Row columns={'equal'} className='NoPadding' textAlign='center'>
        <Col>
          <Divider />
          <h5>Table is {isOpen ? <span className='Important'>Open</span> : <span className='Negative'>Closed</span>}</h5>
        </Col>
      </Row>

    </Grid>
  )
}

function TableSwitcher({
  tableId,
  setSelectedTableId,
}) {
  const { description } = useTable(tableId)
  return (
    <Dropdown
      text={`${description}`}
      className='icon AlignCenter Padded'
      // icon='chain'
      button
      fluid
    >
      <Dropdown.Menu>
        {Object.keys(tables).map(key => (
          <TableSwitcherItem key={tables[key]} tableId={tables[key]} setSelectedTableId={setSelectedTableId}/>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

function TableSwitcherItem({
  tableId,
  setSelectedTableId,
}) {
  const { description } = useTable(tableId)
  return (
    <Dropdown.Item key={tableId} onClick={() => { setSelectedTableId(tableId) }}>{description}</Dropdown.Item>
  )
}
