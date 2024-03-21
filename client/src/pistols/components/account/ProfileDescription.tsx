import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useDojoAccount } from '@/dojo/DojoContext'
import { LordsBalance, LockedBalance } from '@/pistols/components/account/LordsBalance'
import { LordsFaucet } from '@/pistols/components/account/LordsFaucet'
import { AddressShort } from '@/lib/ui/AddressShort'
import { bigintEquals } from '@/lib/utils/type'
import { EMOJI } from '@/pistols/data/messages'

const Row = Grid.Row
const Col = Grid.Column

export function ProfileName({
  address,
  badges = true,
}) {
  const { name, honour } = useDuelist(address)
  const _badges = useMemo(() => (badges && honour > 9.0 ? ` ${EMOJI.LORD}` : null), [honour])
  return (
    <span>{name}{_badges}</span>
  )
}

export function ProfileDescription({
  address,
  displayStats = false,
  displayAddress = false,
  displayBalance = false,
}) {
  const { total_wins, total_losses, total_draws, total_duels, total_honour, honourAndTotal } = useDuelist(address)
  const { account } = useDojoAccount()
  const isYou = useMemo(() => bigintEquals(address, account.address), [address, account])
  return (
    <Grid columns='equal'>
      <Row>

        <Col>
          <h1 className='NoMargin'><ProfileName address={address} /></h1>
          {displayAddress && <AddressShort address={address} />}
          <h3 className='Important NoMargin'>Honour: {honourAndTotal}</h3>
          {displayBalance && <>
            <LordsBalance address={address} big />
            <LockedBalance address={address} clean />
            {isYou && <><br /><LordsFaucet /></>}
          </>}
        </Col>

        {displayStats && total_duels > 0 &&
          <Col className='ProfileStats PaddedRight TitleCase' textAlign='right'>
            Duels: <span className='Bold'>{total_duels}</span>
            <br />
            Wins: <span className='Bold'>{total_wins}</span>
            <br />
            Losses: <span className='Bold'>{total_losses}</span>
            <br />
            Draws: <span className='Bold'>{total_draws}</span>
            <br />
            Honour: <span className='Bold'>{total_honour}</span>
          </Col>
        }

      </Row>
    </Grid>
  )
}
