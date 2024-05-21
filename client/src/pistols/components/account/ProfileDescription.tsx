import React, { useMemo } from 'react'
import { Grid } from 'semantic-ui-react'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { WagerBalance, LockedWagerBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { EMOJI } from '@/pistols/data/messages'

const Row = Grid.Row
const Col = Grid.Column

export function ProfileName({
  address,
  badges = true,
}) {
  const { name, honour, is_villain, is_trickster, is_lord } = useDuelist(address)
  const _badge = useMemo(() => (badges ? (
    is_villain ? EMOJI.VILLAIN :
      is_trickster ? EMOJI.TRICKSTER :
        is_lord ? EMOJI.LORD
          : null
  ) : null), [honour])
  return (
    <span className='BreakWord'>{name} {_badge}</span>
  )
}

export function ProfileDescription({
  address,
  displayStats = false,
  displayAddress = false,
  displayBalance = false,
}) {
  const { tableId } = useSettingsContext()
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
          <h3 className='Important NoMargin'>
            Honour: {honourAndTotal}
            {is_villain && <> {EMOJI.VILLAIN} {levelDisplay}</>}
            {is_trickster && <> {EMOJI.TRICKSTER} {levelDisplay}</>}
            {is_lord && <> {EMOJI.LORD} {levelDisplay}</>}
          </h3>
          {displayBalance && <>
            <WagerBalance tableId={tableId} address={address} big />
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
