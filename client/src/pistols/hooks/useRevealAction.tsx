import { useCallback, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetPlayerFullDeck } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreMovesFromHash } from '../utils/salt'
import { feltToString } from '@/lib/utils/starknet'
import { movesToHand } from './useDuel'

export function useSignAndRestoreMovesFromHash(duelId: bigint, roundNumber: number, tableId: string, hash: bigint) {
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const { decks } = useGetPlayerFullDeck(tableId)

  const canSign = useMemo(() =>
    (duelId && roundNumber && tableId && hash && decks?.length >= 2),
    [duelId, roundNumber, tableId, hash, decks])
  // console.log(`canSign:`, canSign, duelId, roundNumber, hash, decks)

  const [salt, setSalt] = useState<bigint>()
  const [moves, setMoves] = useState<number[]>()
  const hand = useMemo(() => (moves ? movesToHand(moves) : null), [moves])

  const sign_and_restore = useCallback(async () => {
    if (canSign) {
      const { salt, moves } = await signAndRestoreMovesFromHash(account, feltToString(chainId), duelistId, duelId, roundNumber, hash, decks)
      setSalt(salt > 0n ? salt : undefined)
      setMoves(salt > 0n ? moves : undefined)
      return { salt, moves }
    }
  }, [account, chainId, duelistId, duelId, roundNumber, hash, decks, canSign])

  return {
    canSign,
    sign_and_restore,
    // salt,
    // moves,
    hand,
  }
}

export function useRevealAction(duelId: bigint, roundNumber: number, tableId: string, hash: bigint, enabled: boolean) {
  const { reveal_moves } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const { canSign, sign_and_restore } = useSignAndRestoreMovesFromHash(duelId, roundNumber, tableId, hash)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canReveal = useMemo(() =>
    (account && enabled && canSign && duelId && !isSubmitting),
    [account && enabled, canSign, duelId, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, duelId, roundNumber, hash, isSubmitting)

  const reveal = useCallback(async () => {
    if (canReveal) {
      const { salt, moves } = await sign_and_restore()
      if (moves?.length >= 2 && !isSubmitting) {
        setIsSubmitting(true)
        await reveal_moves(account, duelistId, duelId, roundNumber, salt, moves)
        setIsSubmitting(false)
      }
    }
  }, [account, duelistId, duelId, roundNumber, canReveal, isSubmitting])

  return {
    canReveal,
    reveal,
  }
}

