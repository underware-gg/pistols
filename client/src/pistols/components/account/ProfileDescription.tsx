import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { LordsBalance, LockedWagerBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { EMOJI } from '@/pistols/data/messages'
import { BigNumberish } from 'starknet'
import { useDuelistOwner } from '@/pistols/hooks/useTokenDuelist'

const Row = Grid.Row
const Col = Grid.Column

export function ProfileName({
  duelistId,
  badges = true,
  displayId = true,
}: {
  duelistId: BigNumberish,
  badges?: boolean
  displayId?: boolean
}) {
  const { name, nameDisplay } = useDuelist(duelistId)
  return (
    <span className='BreakWord'>{displayId ? nameDisplay : name} {badges && <ProfileBadge duelistId={duelistId} />}</span>
  )
}

export function ProfileBadge({
  duelistId,
}: {
  duelistId: BigNumberish
}) {
  const { isVillainous, isTrickster, isHonourable } = useDuelist(duelistId)
  if (isVillainous) return <>{EMOJI.VILLAIN}</>
  if (isTrickster) return <>{EMOJI.TRICKSTER}</>
  if (isHonourable) return <>{EMOJI.LORD}</>
  return <></>
}

export function ProfileDescription({
  duelistId,
  address = null,
  displayStats = false,
  displayOwnerAddress = false,
  displayBalance = false,
}: {
  duelistId: BigNumberish,
    address?: BigNumberish
  displayStats?: boolean
  displayOwnerAddress?: boolean
  displayBalance?: boolean
}) {
  const {
    total_wins, total_losses, total_draws, total_duels, total_honour, honourAndTotal,
    isVillainous, isTrickster, isHonourable, levelDisplay, levelAndTotal,
  } = useDuelist(duelistId)
  const { owner } = useDuelistOwner(duelistId)
  return (
    <Grid>
      <Row>

        <Col width={displayStats ? 12 : 16}>
          <h1 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /></h1>
          {address ? <AddressShort address={address} />
            : displayOwnerAddress ? <AddressShort address={owner} />
              : <></>}
          <h3 className='Important NoMargin TitleCase'>
            Honour: <span className='Wager'>{honourAndTotal}</span>
            {isVillainous && <> {EMOJI.VILLAIN} <span className='Wager'>{levelDisplay}</span></>}
            {isTrickster && <> {EMOJI.TRICKSTER} <span className='Wager'>{levelDisplay}</span></>}
            {isHonourable && <> {EMOJI.LORD} <span className='Wager'>{levelDisplay}</span></>}
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
