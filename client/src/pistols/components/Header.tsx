import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useTable } from '@/pistols/hooks/useTable'
import { MusicToggle } from '@/pistols/components/ui/Buttons'
import { IconClick } from '@/lib/ui/Icons'
import { NavigationMenu } from '@/pistols/components/NavigationMenu'
import AccountHeader from '@/pistols/components/account/AccountHeader'

const Row = Grid.Row
const Col = Grid.Column

export function Header({
  account = true,
  tables = true,
}: {
  account?: boolean
  tables?: boolean
}) {
  const { tableId } = useSettings()
  const { tableOpener } = usePistolsContext()
  const { description } = useTable(tableId)

  const _changeTable = () => {
    tableOpener.open()
  }

  return (
    <Grid stackable className='UIHeader NoSelection'>
      <Row>
        <Col width={6} verticalAlign='middle' className='Padded'>
          {account &&
            <AccountHeader />
          }
        </Col>

        <Col width={6} textAlign='center' verticalAlign='middle' className='TitleCase NoBreak Padded Relative'>
          {tables && <>
            <h1>Pistols at 10 Blocks</h1>
            <p className='AlignTop'>
              <IconClick name='ticket' size={'big'} onClick={() => _changeTable()} style={{ marginBottom: '0.4em' }} />
              {' '}<b className='Important H3 Anchor' onClick={() => _changeTable()}>{description}</b>
            </p>
          </>}
        </Col>
        <Col width={2}>
        </Col>
        <Col width={1} textAlign='right' verticalAlign='middle'>
          <MusicToggle size='big' />
        </Col>
        <Col width={1} textAlign='right' verticalAlign='middle' className='PaddedDouble'>
          <NavigationMenu />
        </Col>
      </Row>
    </Grid>
  )
}
