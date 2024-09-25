import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { LordsBalance, LockedWagerBalance } from '@/pistols/components/account/LordsBalance'
import { AddressShort } from '@/lib/ui/AddressShort'
import { EMOJI } from '@/pistols/data/messages'
import { BigNumberish } from 'starknet'
import { useDuelistOwner } from '@/pistols/hooks/useTokenDuelist'
import { useValidateWalletAddress } from '@/lib/utils/hooks/useValidateWalletAddress'

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
  const { score: { isVillainous, isTrickster, isHonourable } } = useDuelist(duelistId)
  if (isVillainous) return <>{EMOJI.VILLAIN}</>
  if (isTrickster) return <>{EMOJI.TRICKSTER}</>
  if (isHonourable) return <>{EMOJI.LORD}</>
  return <></>
}

export function ProfileDescription({
  duelistId,
  address,
  tableId,
  displayNameSmall = false,
  displayStats = false,
  displayOwnerAddress = false,
  displayOwnerAddressSmall = false,
  displayBalance = false,
  displayHonor = true,
}: {
  duelistId: BigNumberish
  address?: BigNumberish
  tableId?: BigNumberish
  displayNameSmall?: boolean
  displayStats?: boolean
  displayOwnerAddress?: boolean
  displayOwnerAddressSmall?: boolean
  displayBalance?: boolean
  displayHonor?: boolean
}) {
  const { score: {
    total_wins, total_losses, total_draws, total_duels, honourAndTotal,
    isVillainous, isTrickster, isHonourable, levelDisplay, levelAndTotal,
  } } = useDuelist(duelistId)

  // if its a duelist...
  const { owner } = useDuelistOwner(duelistId)
  
  // if its a wallet...
  const { isStarknetAddress } = useValidateWalletAddress(address)
  const _owner = isStarknetAddress ? address : owner
  
  return (
    <Grid>
      <Row>

        <Col width={displayStats ? 12 : 16}>
          {displayNameSmall ? 
            (<h2 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /></h2>)
            :
            (<h1 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /></h1>)
          }
          
          {displayOwnerAddress && <AddressShort address={owner} small={displayOwnerAddressSmall}/>}
          {displayHonor && <h3 className='Important NoMargin TitleCase'>
            Honour: <span className='Wager'>{honourAndTotal}</span>
            {/* {isVillainous && <> {EMOJI.VILLAIN} <span className='Wager'>{levelDisplay}</span></>} */}
            {/* {isTrickster && <> {EMOJI.TRICKSTER} <span className='Wager'>{levelDisplay}</span></>} */}
            {/* {isHonourable && <> {EMOJI.LORD} <span className='Wager'>{levelDisplay}</span></>} */}
          </h3>}
          {displayBalance &&
            <h5>
              <LordsBalance address={_owner} big />
              {tableId && <LockedWagerBalance tableId={tableId} address={_owner} clean />}
            </h5>
          }
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
          </Col>
        }

      </Row>
    </Grid>
  )
}
