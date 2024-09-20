import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Modal, Dropdown, ButtonGroup, Button } from 'semantic-ui-react'
import { usePistolsScene, SceneName } from '@/pistols/hooks/PistolsContext'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useActiveDuelistIds } from '@/pistols/hooks/useChallenge'
import { useERC20TokenName } from '@/lib/utils/hooks/useERC20'
import { useTable, useTableTotals } from '@/pistols/hooks/useTable'
import { Balance } from '@/pistols/components/account/Balance'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { RowDivider } from '@/lib/ui/Stack'
import { Opener } from '@/lib/ui/useOpener'
import { Divider } from '@/lib/ui/Divider'
import { getObjectKeyByValue } from '@/lib/utils/types'
import { TABLES } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function TableModal({
  opener,
}: {
  opener: Opener
}) {
  const { tableId, dispatchTableId } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
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

  const unknownTable = useMemo(() => (tableId !== undefined && getObjectKeyByValue(TABLES, tableId) === undefined), [tableId])
  useEffect(() => {
    if (unknownTable && !opener.isOpen) {
      opener.open()
    }
  }, [unknownTable, opener.isOpen])
  // console.log(unknownTable, tableId, selectedTableId)

  const _joinTable = () => {
    dispatchTableId(selectedTableId)
    dispatchSetScene(SceneName.Tavern, [selectedTableId])
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
        <Modal.Description className='FillParent TitleCase'>
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
              <ActionButton fill label='Close' onClick={() => opener.close()} />
            </Col>
            <Col>
              <ActionButton fill important label='Join Table' disabled={!tableIsOpen || !selectedTableId} onClick={() => _joinTable()} />
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
  const { feeContractAddress,
    description,
    feeMin,
    feePct,
    tableIsOpen,
    tableType,
  } = useTable(tableId)
  const { tokenName, tokenSymbol } = useERC20TokenName(feeContractAddress)
  const { activeDuelistIdsCount } = useActiveDuelistIds(tableId)
  const { liveDuelsCount, pastDuelsCount } = useTableTotals(tableId)

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
        <Col width={8} className='Wager PaddedLeft Bold'>
          {tableType}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Fees Coin:
        </Col>
        <Col width={8} className='Bold'>
          {/* {tokenName && <Balance tableId={tableId}>{tokenName}</Balance>} */}
          {/* {!tokenName && <>N/A</>} */}
          {tokenName ?? <>N/A</>}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Minimun Fee:
        </Col>
        <Col width={8} className='Bold'>
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
          Active Duelists:
        </Col>
        <Col width={8} className='Wager PaddedLeft Bold'>
          {activeDuelistIdsCount}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Live Duels:
        </Col>
        <Col width={8} className='Wager PaddedLeft Bold'>
          {liveDuelsCount}
        </Col>
      </Row>

      <Row className='NoPadding' verticalAlign='middle'>
        <Col width={8} textAlign='right'>
          Past Duels:
        </Col>
        <Col width={8} className='Wager PaddedLeft Bold'>
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
      {Object.keys(TABLES).map(key => (
        <TableListItem key={TABLES[key]}
          tableId={TABLES[key]}
          active={selectedTableId == TABLES[key]}
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
    <Button key={tableId} active={active} onClick={() => { setSelectedTableId(tableId) }}>{description}</Button>
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
        {Object.keys(TABLES).map(key => (
          <TableSwitcherItem key={TABLES[key]} tableId={TABLES[key]} setSelectedTableId={setSelectedTableId} />
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
