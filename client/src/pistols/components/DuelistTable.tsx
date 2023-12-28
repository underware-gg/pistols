import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ProfilePicSquare } from '@/pistols/components/account/ProfilePic'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.Cell
const HeaderCell = Table.HeaderCell

export function DuelistTable() {
  const { account } = useDojoAccount()
  const { duelistIds } = useAllDuelistIds()

  const rows = useMemo(() => {
    let result = []
    duelistIds.forEach((duelistId, index) => {
      const isYou = (duelistId == BigInt(account.address))
      result.push(<DuelistItem key={duelistId} address={duelistId} index={index} isYou={isYou} />)
    })
    return result
  }, [duelistIds])

  return (
    <Table selectable className='Faded' color='orange'>
      <Table.Header className='TableHeader'>
        <Table.Row textAlign='center' verticalAlign='middle'>
          <HeaderCell width={3}></HeaderCell>
          <HeaderCell width={1}></HeaderCell>
          <HeaderCell textAlign='left'>Duelist</HeaderCell>
          <HeaderCell width={2}>Honour</HeaderCell>
          <HeaderCell width={1}>Wins</HeaderCell>
          <HeaderCell width={1}>Losses</HeaderCell>
          <HeaderCell width={1}>Draws</HeaderCell>
          <HeaderCell width={1}>Total</HeaderCell>
        </Table.Row>
      </Table.Header>

      {rows.length > 0 ?
        <Table.Body className='TableBody'>
          {rows}
        </Table.Body>
        :
        <Table.Footer fullWidth>
          <Table.Row>
            <Cell colSpan='100%' textAlign='center'>
              no duelists here
            </Cell>
          </Table.Row>
        </Table.Footer>
      }
    </Table>
  )
}


function DuelistItem({
  address,
  index,
  isYou,
}) {
  const { name, profilePic, total_wins, total_losses, total_draws, total_duels, honourDisplay } = useDuelist(address)
  const { dispatchSetDuelist } = usePistolsContext()

  return (
    <Table.Row textAlign='center' verticalAlign='middle' onClick={() => dispatchSetDuelist(address)}>
      <Cell>
        <AccountShort address={address} />
      </Cell>
      
      <Cell>
        <ProfilePicSquare profilePic={profilePic} />
      </Cell>

      <Cell textAlign='left'>
        {name}
      </Cell>

      <Cell className='Important'>
        {honourDisplay}
      </Cell>

      <Cell>
        {total_wins}
      </Cell>

      <Cell>
        {total_losses}
      </Cell>

      <Cell>
        {total_draws}
      </Cell>

      <Cell>
        {total_duels}
      </Cell>
    </Table.Row>
  )
}

