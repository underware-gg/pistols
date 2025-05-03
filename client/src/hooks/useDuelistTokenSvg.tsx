import React, { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { duelist_token, SvgRenderOptions } from '@underware/pistols-sdk/pistols/tokens'
import { useDuelist } from '/src/stores/duelistStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { usePlayer } from '/src/stores/playerStore'

export function useDuelistTokenSvg(duelistId: BigNumberish) {
  const { profileType, profilePic, currentDuelId, currentPassId, status } = useDuelist(duelistId)
  const { balance_eth, lives, isLoading } = useDuelistFameBalance(duelistId)
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
    pass_id: currentPassId,
    is_loading: !!isLoading,
  }), [name, profileType, profilePic, currentDuelId, currentPassId, balance_eth, lives, isLoading, owner, status, duelistId])

  const options: SvgRenderOptions = {
    includeMimeType: true,
  }
  
  const svg = useMemo(() => (duelist_token.renderSvg(props, options)), [props])
  
  return svg
}
