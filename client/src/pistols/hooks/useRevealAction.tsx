import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetPlayerFullDeck } from '@/pistols/hooks/useContractCalls'
import { CommitMoveMessage, signAndRestoreMovesFromHash } from '@/pistols/utils/salt'
import { feltToString } from '@/lib/utils/starknet'
import { movesToHand } from '@/pistols/hooks/useDuel'
import { isPositiveBigint } from '@/lib/utils/types'

export function useSignAndRestoreMovesFromHash(duelId: bigint, roundNumber: number, tableId: string, hash: bigint) {
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const { decks } = useGetPlayerFullDeck(tableId)

  const messageToSign = useMemo<CommitMoveMessage>(() => ((duelId && roundNumber && duelistId) ? {
    duelId: BigInt(duelId),
    roundNumber: BigInt(roundNumber),
    duelistId: BigInt(duelistId),
  } : null), [duelId, roundNumber, duelistId])

  const [salt, setSalt] = useState<bigint>()
  const [moves, setMoves] = useState<number[]>()
  const hand = useMemo(() => (moves ? movesToHand(moves) : null), [moves])

  const { moves: knownMoves, dispatchSetMoves, makeMoveKey } = usePistolsContext()
  useEffect(() => {
    const sotredMoves = knownMoves[makeMoveKey(messageToSign)]
    // console.log(`>>> stored_moves:`, _moves)
    if (sotredMoves) {
      setSalt(sotredMoves.salt)
      setMoves(sotredMoves.moves)
    }
  }, [knownMoves, messageToSign])

  const canSign = useMemo(() =>
    (isPositiveBigint(hash)  && messageToSign != null && decks?.length >= 2),
    [hash, messageToSign, decks])
  // console.log(`canSign:`, canSign, hash, messageToSign, decks, hand)

  const sign_and_restore = useCallback(async () => {
    if (canSign) {
      const { salt, moves } = await signAndRestoreMovesFromHash(account, feltToString(chainId), messageToSign, hash, decks)
      if (salt > 0n && moves) {
        setSalt(salt)
        setMoves(moves)
        dispatchSetMoves(messageToSign, moves, salt)
      }
      return { salt, moves }
    }
  }, [account, chainId, duelistId, duelId, roundNumber, hash, decks, canSign])

  return {
    canSign,
    sign_and_restore,
    salt,
    moves,
    hand,
  }
}

export function useRevealAction(duelId: bigint, roundNumber: number, tableId: string, hash: bigint, enabled: boolean) {
  const { reveal_moves } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    canSign, sign_and_restore,
    moves: storedMoves, salt: storedSalt,
  } = useSignAndRestoreMovesFromHash(duelId, roundNumber, tableId, hash)

  const canReveal = useMemo(() =>
    (account && enabled && duelId && (canSign || (storedSalt && storedMoves)) && !isSubmitting),
    [account, enabled, duelId, canSign, storedSalt, storedMoves, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, duelId, roundNumber, hash, isSubmitting)

  const reveal = useCallback(async () => {
    const _reveal = async (salt: bigint, moves: number[]) => {
      if (moves?.length >= 2 && !isSubmitting) {
        setIsSubmitting(true)
        await reveal_moves(account, duelistId, duelId, roundNumber, salt, moves)
        setIsSubmitting(false)
      }
    }

    if (storedSalt && storedMoves) {
      _reveal(storedSalt, storedMoves)
    } else if (canReveal) {
      const { salt, moves } = await sign_and_restore()
      _reveal(salt, moves)
    }
  }, [account, duelistId, duelId, roundNumber, canReveal, storedSalt, storedMoves, isSubmitting])

  return {
    canReveal,
    reveal,
  }
}

