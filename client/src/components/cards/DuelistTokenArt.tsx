import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duelist_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelistTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useDuelist } from '/src/stores/duelistStore'
import { useFameBalanceDuelist } from '/src/hooks/useFame'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { usePlayer } from '/src/stores/playerStore'

export function DuelistTokenArt({
  duelistId,
  className,
  style = {},
}: {
  duelistId: BigNumberish,
  className?: string,
  style?: React.CSSProperties,
}) {
  const { profileType, profilePic, currentDuelId, status } = useDuelist(duelistId)
  const { balance_eth, lives, isLoading } = useFameBalanceDuelist(duelistId)
  const { owner } = useOwnerOfDuelist(duelistId)
  const { name } = usePlayer(owner)

  const props = useMemo<duelist_token.DuelistSvgProps>(() => ({
    duelist_id: duelistId,
    owner: bigintToHex(owner),
    username: name,
    honour: status.honour,
    archetype: status.archetype,
    profile_type: profileType,
    profile_id: profilePic,
    total_duels: status.total_duels,
    total_wins: status.total_wins,
    total_losses: status.total_losses,
    total_draws: status.total_draws,
    fame: Number(balance_eth),
    lives,
    is_memorized: false,
    duel_id: currentDuelId,
    is_loading: isLoading,
  }), [name, profileType, profilePic, currentDuelId, history, balance_eth, lives, isLoading])
  
  return <DuelistTokenImage props={props} className={className} style={style} />
}
