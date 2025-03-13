import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duelist_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelistTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useDuelist } from '/src/stores/duelistStore'
import { useFameBalanceDuelist } from '/src/hooks/useFame'
import { useGetSeasonScoreboard } from '/src/hooks/useScore'
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
  const { profileType, profilePic, currentDuelId } = useDuelist(duelistId)
  const { balance_eth, lives, isLoading } = useFameBalanceDuelist(duelistId)
  const score = useGetSeasonScoreboard(duelistId)
  const { owner } = useOwnerOfDuelist(duelistId)
  const { name } = usePlayer(owner)

  const props = useMemo<duelist_token.DuelistSvgProps>(() => ({
    duelist_id: duelistId,
    owner: bigintToHex(owner),
    username: name,
    honour: score.honour,
    archetype: score.archetype,
    profile_type: profileType,
    profile_id: profilePic,
    total_duels: score.total_duels,
    total_wins: score.total_wins,
    total_losses: score.total_losses,
    total_draws: score.total_draws,
    fame: Number(balance_eth),
    lives,
    is_memorized: false,
    duel_id: currentDuelId,
    is_loading: isLoading,
  }), [score])
  
  return <DuelistTokenImage props={props} className={className} style={style} />
}
