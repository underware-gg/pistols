import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useRouterTable } from '@/pistols/hooks/useRouterListener'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { LordsBalance, LockedWagerBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { EMOJI } from '@/pistols/data/messages'

const Row = Grid.Row
const Col = Grid.Column

export function ProfileName({
  address,
  badges = true,
}) {
  const { name } = useDuelist(address)
  return (
    <span className='BreakWord'>{name} {badges && <ProfileBadge address={address} />}</span>
  )
}

export function ProfileBadge({
  address,
}) {
  const { is_villain, is_trickster, is_lord } = useDuelist(address)
  if (is_villain) return <>{EMOJI.VILLAIN}</>
  if (is_trickster) return <>{EMOJI.TRICKSTER}</>
  if (is_lord) return <>{EMOJI.LORD}</>
  return <></>
}

export function ProfileDescription({
  address,
  displayStats = false,
  displayAddress = false,
  displayBalance = false,
}) {
  const { tableId } = useRouterTable()
  const {
    total_wins, total_losses, total_draws, total_duels, total_honour, honourAndTotal,
    is_villain, is_trickster, is_lord, levelDisplay, levelAndTotal,
  } = useDuelist(address)
  // const { accountAddress } = useDojoAccount()
  // const isYou = useMemo(() => bigintEquals(address, accountAddress), [address, accountAddress])
  return (
    <Grid>
      <Row>

        <Col width={displayStats ? 12 : 16}>
          <h1 className='NoMargin'><ProfileName address={address} badges={false}/></h1>
          {displayAddress && <AddressShort address={address} />}
          <h3 className='Important NoMargin TitleCase'>
            Honour: <span className='Wager'>{honourAndTotal}</span>
            {is_villain && <> {EMOJI.VILLAIN} <span className='Wager'>{levelDisplay}</span></>}
            {is_trickster && <> {EMOJI.TRICKSTER} <span className='Wager'>{levelDisplay}</span></>}
            {is_lord && <> {EMOJI.LORD} <span className='Wager'>{levelDisplay}</span></>}
          </h3>
          {displayBalance && <>
            <LordsBalance address={address} big />
            <LockedWagerBalance tableId={tableId} address={address} clean />
            {/* {isYou && <><br /><LordsFaucet /></>} */}
          </>}
        </Col>

        {displayStats && total_duels > 0 &&
          <Col width={4} className='ProfileStats PaddedRight TitleCase' textAlign='right'>
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
