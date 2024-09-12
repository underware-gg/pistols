import { useCallback, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetPlayerFullDeck } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreMovesFromHash } from '../utils/salt'
import { feltToString } from '@/lib/utils/starknet'

export function useRevealAction(duelId: bigint, roundNumber: number, tableId: string, hash: bigint, enabled: boolean) {
  const { reveal_moves } = useDojoSystemCalls()
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { decks } = useGetPlayerFullDeck(tableId)

  const canReveal = useMemo(() =>
    (enabled && duelId && tableId && hash && decks?.length >= 2 && !isSubmitting),
    [enabled, duelId, tableId, hash, decks, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, duelId, roundNumber, hash, validPackedActions, isSubmitting)

  const reveal = useCallback(async () => {
    if (canReveal) {
      const { salt, moves } = await signAndRestoreMovesFromHash(account, feltToString(chainId), duelistId, duelId, roundNumber, hash, decks)
      if (moves?.length >= 2 && !isSubmitting) {
        setIsSubmitting(true)
        await reveal_moves(account, duelistId, duelId, roundNumber, salt, moves)
        setIsSubmitting(false)
      }
    }
  }, [account, chainId, duelistId, duelId, roundNumber, hash, decks, canReveal, isSubmitting])

  return {
    canReveal,
    reveal,
  }
}
