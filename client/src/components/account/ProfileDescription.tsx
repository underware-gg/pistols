import React from 'react'
import { Grid } from 'semantic-ui-react'
import { useDuelist } from '/src/stores/duelistStore'
import { FameBalanceDuelist } from '/src/components/account/LordsBalance'
import { AddressShort } from '/src/components/ui/AddressShort'
import { EMOJI } from '/src/data/messages'
import { BigNumberish } from 'starknet'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { isPositiveBigint, useValidateWalletAddress } from '@underware_gg/pistols-sdk/utils'
import { usePlayer } from '/src/stores/playerStore'

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
  const { name, nameAndId } = useDuelist(duelistId)
  return (
    <span className='BreakWord'>{displayId ? nameAndId : name} {badges && <ProfileBadge duelistId={duelistId} />}</span>
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
  displayNameSmall = false,
  displayStats = false,
  displayOwnerAddress = false,
  displayOwnerAddressSmall = false,
  displayFameBalance = false,
  displayHonor = true,
}: {
  duelistId: BigNumberish
  address?: BigNumberish
  displayNameSmall?: boolean
  displayStats?: boolean
  displayOwnerAddress?: boolean
  displayOwnerAddressSmall?: boolean
  displayFameBalance?: boolean
  displayHonor?: boolean
}) {
  const { score: {
    total_wins, total_losses, total_draws, total_duels, honourAndTotal,
  } } = useDuelist(duelistId)

  // if its a duelist...
  const { owner } = useOwnerOfDuelist(duelistId)
  
  // if its a wallet...
  const { name: playerName } = usePlayer(address)
  // const { isStarknetAddress } = useValidateWalletAddress(address)

  if (!isPositiveBigint(duelistId)) {
    return (
      <div className='FillParent'>
        <h1>{playerName}</h1>
      </div>
    )
  }
  
  return (
    <div className='FillParent'
      // style={{ display: 'flex', justifyContent: 'space-between' }}
    >
      <div>
        {displayNameSmall ? 
          (<h2 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /></h2>)
          :
          (<h1 className='NoMargin'><ProfileName duelistId={duelistId} badges={false} /></h1>)
        }
        
        {displayOwnerAddress && <AddressShort address={owner} small={displayOwnerAddressSmall}/>}
        {displayHonor && <h3 className='Important NoMargin TitleCase'>
          Honour: <span className='Coin'>{honourAndTotal}</span>
        </h3>}
        {displayFameBalance && <h5><FameBalanceDuelist duelistId={duelistId} big /></h5>}
      </div>

      {displayStats && total_duels > 0 &&
        <div className='ProfileStats PaddedRight TitleCase' style={{ textAlign: 'right' }}>
          Duels: <span className='Bold'>{total_duels}</span>
          <br />
          Wins: <span className='Bold'>{total_wins}</span>
          <br />
          Losses: <span className='Bold'>{total_losses}</span>
          <br />
          Draws: <span className='Bold'>{total_draws}</span>
        </div>
      }
    </div>
  )
}
