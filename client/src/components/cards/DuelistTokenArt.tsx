import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duelist_token } from '@underware/pistols-sdk/pistols/tokens'
import { DuelistTokenImage } from '@underware/pistols-sdk/pistols/components'
import { useDuelist, useDuelistStack } from '/src/stores/duelistStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
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
  const { profileType, profilePic, currentDuelId, currentPassId, totals, timestampRegistered, timestampActive } = useDuelist(duelistId)
  const { balance_eth, lives, isLoading } = useDuelistFameBalance(duelistId)
  const { owner } = useOwnerOfDuelist(duelistId)
  const { name } = usePlayer(owner)
  const { level } = useDuelistStack(duelistId)

  const props = useMemo<duelist_token.DuelistSvgProps>(() => ({
    duelist_id: duelistId,
    owner: bigintToHex(owner),
    username: name,
    honour: totals.honour,
    archetype: totals.archetype,
    profile_type: profileType,
    profile_id: profilePic,
    total_duels: totals.total_duels,
    total_wins: totals.total_wins,
    total_losses: totals.total_losses,
    total_draws: totals.total_draws,
    fame: Number(balance_eth),
    lives,
    is_memorized: false,
    duel_id: currentDuelId,
    pass_id: currentPassId,
    timestamp_registered: timestampRegistered,
    timestamp_active: timestampActive,
    level,
    //
    is_loading: !!isLoading,
  }), [name, profileType, profilePic, currentDuelId, currentPassId, balance_eth, lives, isLoading])

  return <DuelistTokenImage props={props} className={className} style={style} />
}
