import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Grid, Radio, Input } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { useAllDuelistIds, useDuelist } from '@/pistols/hooks/useDuelist'
import { AccountShort } from '@/pistols/components/ui/Account'
import { ActionButton } from '@/pistols/components/ui/Buttons'

const Row = Grid.Row
const Col = Grid.Column

export function DuelistList() {
  const { account } = useDojoAccount()
  const { duelistIds } = useAllDuelistIds()

  const rows = useMemo(() => {
    let result = []
    duelistIds.forEach((duelistId, index) => {
      const isYou = (duelistId == BigInt(account.address))
      result.push(<DuelistItem key={duelistId} address={duelistId} index={index} isYou={isYou} />)
    })
    if (result.length == 0) {
      result.push(
        <Row key='empty' textAlign='center' columns={'equal'}>
          <Col>no duelists to see</Col>
        </Row>
      )
    }
    return result
  }, [duelistIds])

  return (
    <>
      <Grid className='Faded'>
        <Row textAlign='center' color='red'>
          <Col width={3}>
            <b>Account</b>
          </Col>
          <Col width={7}>
            <b>Name</b>
          </Col>
          <Col width={2}>
            <b>Honor</b>
          </Col>
          <Col width={1}>
            <b>Wins</b>
          </Col>
          <Col width={1}>
            <b>Losses</b>
          </Col>
          <Col width={1}>
            <b>Draws</b>
          </Col>
          <Col width={1}>
            <b>Total</b>
          </Col>
        </Row>
        {rows}
      </Grid>
    </>
  )
}


function DuelistItem({
  address,
  index,
  isYou,
}) {
  const { name, profilePic } = useDuelist(address)
  const { challengeCount, drawCount, winCount, loseCount } = useChallengesByDuelist(address)

  return (
    <Row textAlign='center'>
      <Col width={3}>
        <AccountShort address={address} />
      </Col>
      <Col width={7}>
        {name}
      </Col>
      <Col width={2}>
        100%
      </Col>
      <Col width={1}>
        {winCount}
      </Col>
      <Col width={1}>
        {loseCount}
      </Col>
      <Col width={1}>
        {drawCount}
      </Col>
      <Col width={1}>
        {challengeCount}
      </Col>
    </Row>
  )
}

