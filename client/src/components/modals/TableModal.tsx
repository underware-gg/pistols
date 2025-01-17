import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Dropdown, ButtonGroup, Button } from 'semantic-ui-react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useTableId } from '/src/stores/configStore'
import { useTable } from '/src/stores/tableStore'
import { useTableTotals, useTableActiveDuelistIds } from '/src/hooks/useTable'
import { useMounted, getObjectKeyByValue } from '@underware_gg/pistols-sdk/utils'
import { Balance } from '/src/components/account/Balance'
import { ActionButton } from '/src/components/ui/Buttons'
import { RowDivider } from '/src/components/ui/Stack'
import { Opener } from '/src/hooks/useOpener'
import { Divider } from '/src/components/ui/Divider'
import { constants } from '@underware_gg/pistols-sdk/pistols'

const Row = Grid.Row
const Col = Grid.Column

export default function TableModal({
  opener,
}: {
  opener: Opener
}) {
  const { tableId } = useTableId()
  const { currentScene, dispatchSetScene } = usePistolsScene()
  const [selectedTableId, setSelectedTableId] = useState('')
  const { tableIsOpen } = useTable(selectedTableId)

  // always closed on mount
  const mounted = useMounted(() => {
    opener.close()
  })

  // initialize
  useEffect(() => {
    if (opener.isOpen) {
      setSelectedTableId(tableId)
    }
  }, [opener.isOpen])

  const unknownTable = useMemo(() => (tableId !== undefined && getObjectKeyByValue(constants.TABLES, tableId) === undefined), [tableId])
  useEffect(() => {
    if (unknownTable && !opener.isOpen) {
      opener.open()
    }
  }, [unknownTable, opener.isOpen])
  // console.log(unknownTable, tableId, selectedTableId)

  const _joinTable = () => {
    dispatchSetScene(currentScene, { tableId: selectedTableId })
    opener.close()
  }

  return (
    <Modal
      size='small'
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
        <Modal.Description className='FillParent TitleCase ModalText'>
          <Grid>
            <Row divided>
              <Col width={5} className='BgDarkest'>
                <TableList selectedTableId={selectedTableId} setSelectedTableId={setSelectedTableId} />
              </Col>
              <Col width={1}>
                <Divider vertical />
              </Col>
              <Col width={10}>
                <TableDescription tableId={selectedTableId} />
              </Col>
            </Row>
          </Grid>
        </Modal.Description>
      </Modal.Content>
      
      <Modal.Actions className='NoPadding'>
        <Grid className='FillParent Padded' textAlign='center'>
          <Row columns='equal'>
            <Col>
              <ActionButton large fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton large fill important label='Join Table' disabled={!tableIsOpen || !selectedTableId} onClick={() => _joinTable()} />
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
  const {
    description,
    feeMin,
    tableIsOpen,
    tableType,
  } = useTable(tableId)
  const { liveDuelsCount, pastDuelsCount } = useTableTotals(tableId)
  const { activeDuelistIds } = useTableActiveDuelistIds(tableId)

  return (
    <Grid className='H5'>

      <Row columns={'equal'} className='NoPadding' textAlign='center'>
        <Col>
          <h3 className='Important'>{description}</h3>
        </Col>
      </Row>

      <RowDivider />

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Game Type:
        </Col>
        <Col width={8} className='Coin PaddedLeft Bold'>
          {tableType}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Fee:
        </Col>
        <Col width={8} className='Bold'>
          <Balance lords wei={feeMin ?? 0} />
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Active Duelists:
        </Col>
        <Col width={8} className='Coin PaddedLeft Bold'>
          {activeDuelistIds.length}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Live Duels:
        </Col>
        <Col width={8} className='Coin PaddedLeft Bold'>
          {liveDuelsCount}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Past Duels:
        </Col>
        <Col width={8} className='Coin PaddedLeft Bold'>
          {pastDuelsCount}
        </Col>
      </Row>

      <RowDivider />

      <Row columns={'equal'} className='NoPadding' textAlign='center'>
        <Col>
          <h5>Table is {tableIsOpen ? <span className='Important'>Open</span> : <span className='Negative'>Closed</span>}</h5>
        </Col>
      </Row>

    </Grid>
  )
}

//--------------------
// Tables list 
//
export function TableList({
  selectedTableId,
  setSelectedTableId,
}: {
    selectedTableId: string
  setSelectedTableId: (tableId: string) => void
}) {
  const { description } = useTable(selectedTableId)
  return (
    <ButtonGroup vertical className='FillWidth Padded'>
      {Object.keys(constants.TABLES).map(key => (
        <TableListItem key={constants.TABLES[key]}
          tableId={constants.TABLES[key]}
          active={selectedTableId == constants.TABLES[key]}
          setSelectedTableId={setSelectedTableId}
        />
      ))}
    </ButtonGroup >
  )
}

function TableListItem({
  tableId,
  active,
  setSelectedTableId,
}: {
  tableId: string
  active: boolean
  setSelectedTableId: (tableId: string) => void
}) {
  const { description } = useTable(tableId)
  return (
    <Button size='big' key={tableId} active={active} onClick={() => { setSelectedTableId(tableId) }}>{description}</Button>
  )
}



//------------------
// as dropdown
//
export function TableSwitcher({
  selectedTableId,
  setSelectedTableId,
}: {
  selectedTableId: string
  setSelectedTableId: (tableId: string) => void
}) {
  const { description } = useTable(selectedTableId)
  return (
    <Dropdown
      text={`${description}`}
      className='icon AlignCenter Padded'
      // icon='chain'
      button
      fluid
    >
      <Dropdown.Menu>
        {Object.keys(constants.TABLES).map(key => (
          <TableSwitcherItem key={constants.TABLES[key]} tableId={constants.TABLES[key]} setSelectedTableId={setSelectedTableId} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

function TableSwitcherItem({
  tableId,
  setSelectedTableId,
}: {
  tableId: string
  setSelectedTableId: (tableId: string) => void
}) {
  const { description } = useTable(tableId)
  return (
    <Dropdown.Item key={tableId} onClick={() => { setSelectedTableId(tableId) }}>{description}</Dropdown.Item>
  )
}
