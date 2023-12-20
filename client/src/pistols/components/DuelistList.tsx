import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Table } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import { ProfilePicSquare } from './account/ProfilePic'
import { usePistolsContext } from '../hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column
const Cell = Table.HeaderCell

export default function DuelistList() {
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
    <Table selectable className='Faded' color='red'>
      <Table.Header>
        <Table.Row textAlign='center' verticalAlign='middle'>
          <Cell width={3}></Cell>
          <Cell width={1}></Cell>
          <Cell textAlign='left'>Duelist</Cell>
          <Cell width={2}>Honor</Cell>
          <Cell width={1}>Wins</Cell>
          <Cell width={1}>Losses</Cell>
          <Cell width={1}>Draws</Cell>
          <Cell width={1}>Total</Cell>
        </Table.Row>
      </Table.Header>

      {rows.length > 0 ?
        <Table.Body>
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
  const { name, profilePic } = useDuelist(address)
  const { challengeCount, drawCount, winCount, loseCount } = useChallengesByDuelist(address)
  const { dispatchSetDuelist } = usePistolsContext()

  return (
    <Table.Row textAlign='center' verticalAlign='middle' onClick={() => dispatchSetDuelist(address)}>
      <Table.Cell>
        <AccountShort address={address} />
      </Table.Cell>
      
      <Table.Cell>
        <ProfilePicSquare profilePic={profilePic} />
      </Table.Cell>

      <Table.Cell textAlign='left'>
        {name}
      </Table.Cell>

      <Table.Cell>
        10.0
      </Table.Cell>

      <Table.Cell>
        {winCount}
      </Table.Cell>

      <Table.Cell>
        {loseCount}
      </Table.Cell>

      <Table.Cell>
        {drawCount}
      </Table.Cell>

      <Table.Cell>
        {challengeCount}
      </Table.Cell>
    </Table.Row>
  )
}

