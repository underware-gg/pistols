import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDojoSetup, useDojoSystemCalls } from '@underware_gg/pistols-sdk/dojo'
import { useGetPlayerFullDeck } from '/src/hooks/usePistolsContractCalls'
import { CommitMoveMessage, signAndRestoreMovesFromHash } from '/src/utils/salt'
import { isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { movesToHand } from '/src/utils/pistols'

export function useSignAndRestoreMovesFromHash(duelId: bigint, tableId: string, hash: bigint) {
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const { starknetDomain } = useDojoSetup()
  const { decks } = useGetPlayerFullDeck(tableId)

  const messageToSign = useMemo<CommitMoveMessage>(() => ((duelId && duelistId) ? {
    duelId: BigInt(duelId),
    duelistId: BigInt(duelistId),
  } : null), [duelId, duelistId])

  const [salt, setSalt] = useState<bigint>()
  const [moves, setMoves] = useState<number[]>()
  const hand = useMemo(() => (moves ? movesToHand(moves) : null), [moves])

  const { moves: knownMoves, dispatchSetMoves, makeStoredMovesKey } = usePistolsContext()
  useEffect(() => {
    const sotredMoves = knownMoves[makeStoredMovesKey(messageToSign)]
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
      const { salt, moves } = await signAndRestoreMovesFromHash(account, starknetDomain, messageToSign, hash, decks)
      if (salt > 0n && moves) {
        setSalt(salt)
        setMoves(moves)
        dispatchSetMoves(messageToSign, moves, salt)
      }
      return { salt, moves }
    }
  }, [account, starknetDomain, duelistId, duelId, hash, decks, canSign])

  return {
    canSign,
    sign_and_restore,
    salt,
    moves,
    hand,
  }
}

export function useRevealAction(duelId: bigint, tableId: string, hash: bigint, enabled: boolean) {
  const { reveal_moves } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    canSign, sign_and_restore,
    moves: storedMoves, salt: storedSalt,
  } = useSignAndRestoreMovesFromHash(duelId, tableId, hash)

  const canReveal = useMemo(() =>
    (account && enabled && duelId && (canSign || (storedSalt && storedMoves)) && !isSubmitting),
    [account, enabled, duelId, canSign, storedSalt, storedMoves, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, duelId, hash, isSubmitting)

  const reveal = useCallback(async () => {
    const _reveal = async (salt: bigint, moves: number[]) => {
      if (moves?.length >= 2 && !isSubmitting) {
        setIsSubmitting(true)
        await reveal_moves(account, duelistId, duelId, salt, moves)
        setIsSubmitting(false)
      }
    }

    if (storedSalt && storedMoves) {
      _reveal(storedSalt, storedMoves)
    } else if (canReveal) {
      const { salt, moves } = await sign_and_restore()
      _reveal(salt, moves)
    }
  }, [account, duelistId, duelId, canReveal, storedSalt, storedMoves, isSubmitting])

  return {
    canReveal,
    reveal,
  }
}

