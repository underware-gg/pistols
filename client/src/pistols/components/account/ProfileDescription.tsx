import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useRouterTable } from '@/pistols/hooks/useRouterListener'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { LordsBalance, LockedWagerBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { EMOJI } from '@/pistols/data/messages'
import { BigNumberish } from 'starknet'

const Row = Grid.Row
const Col = Grid.Column

export function ProfileName({
  duelistId,
  badges = true,
}: {
  duelistId: BigNumberish,
  badges?: boolean
}) {
  const { nameDisplay } = useDuelist(duelistId)
  return (
    <span className='BreakWord'>{nameDisplay} {badges && <ProfileBadge duelistId={duelistId} />}</span>
  )
}

export function ProfileBadge({
  duelistId,
} : {
  duelistId: BigNumberish
}) {
  const { is_villain, is_trickster, is_lord } = useDuelist(duelistId)
  if (is_villain) return <>{EMOJI.VILLAIN}</>
  if (is_trickster) return <>{EMOJI.TRICKSTER}</>
  if (is_lord) return <>{EMOJI.LORD}</>
  return <></>
}

export function ProfileDescription({
  duelistId,
  displayStats = false,
  displayAddress = false,
  displayBalance = false,
}: {
  duelistId: BigNumberish,
  displayStats?: boolean
  displayAddress?: boolean
  displayBalance?: boolean
}) {
  const { tableId } = useRouterTable()
  const {
    total_wins, total_losses, total_draws, total_duels, total_honour, honourAndTotal,
    is_villain, is_trickster, is_lord, levelDisplay, levelAndTotal,
  } = useDuelist(duelistId)
  // const { address: accountAddress } = useAccount()
  // const isYou = useMemo(() => bigintEquals(address, accountAddress), [address, accountAddress])
  return (
    <Grid>
      <Row>

        <Col width={displayStats ? 12 : 16}>
          <h1 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /> #{duelistId}</h1>
          {/* {displayAddress && <AddressShort address={address} />} */}
          <h3 className='Important NoMargin TitleCase'>
            Honour: <span className='Wager'>{honourAndTotal}</span>
            {is_villain && <> {EMOJI.VILLAIN} <span className='Wager'>{levelDisplay}</span></>}
            {is_trickster && <> {EMOJI.TRICKSTER} <span className='Wager'>{levelDisplay}</span></>}
            {is_lord && <> {EMOJI.LORD} <span className='Wager'>{levelDisplay}</span></>}
          </h3>
          {/* {displayBalance && <>
            <LordsBalance address={address} big />
            <LockedWagerBalance tableId={tableId} address={address} clean />
          </>} */}
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
