import { useCallback, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup, useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { CommitMoveMessage, signAndRestoreMovesFromHash } from '@underware/pistols-sdk/pistols'
import { useGetDuelDeck } from '/src/hooks/usePistolsContractCalls'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { movesToHand } from '@underware/pistols-sdk/pistols'
import { PLAYER_CHARACTER_ID } from '/src/utils/pistols'
import { SALT_SERVER_URL } from '/src/utils/env'

export function useSignAndRestoreMovesFromHash(duelId: bigint, duelistId: bigint, hash: bigint) {
  const { account } = useAccount()
  const { starknetDomain } = useDojoSetup()
  const { decks } = useGetDuelDeck(duelId)

  const messageToSign = useMemo<CommitMoveMessage>(() => ((duelId && duelistId) ? {
    duelId: BigInt(duelId),
    duelistId: BigInt(duelistId),
  } : null), [duelId, duelistId])

  const [salt, setSalt] = useState<bigint>()
  const [moves, setMoves] = useState<number[]>()
  const hand = useMemo(() => (moves ? movesToHand(moves) : null), [moves])

  const canSign = useMemo(() => (
    (isPositiveBigint(hash) && messageToSign != null && decks?.length >= 2)
  ), [hash, messageToSign, decks])
  // console.log(`canSign:`, canSign, hash, messageToSign, decks, hand, duelId, duelistId)

  const sign_and_restore = useCallback(async () => {
    if (canSign) {
      const { salt, moves } = await signAndRestoreMovesFromHash(SALT_SERVER_URL, account, starknetDomain, messageToSign, hash, decks)
      if (salt > 0n && moves) {
        setSalt(salt)
        setMoves(moves)
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

export function useRevealAction(duelId: bigint, duelistId: bigint, hash: bigint, enabled: boolean) {
  const { game, tutorial } = useDojoSystemCalls()
  const { account } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    canSign, sign_and_restore,
    moves: storedMoves, salt: storedSalt,
  } = useSignAndRestoreMovesFromHash(duelId, duelistId, hash)

  const canReveal = useMemo(() =>
    (account && enabled && duelId && (canSign || (storedSalt && storedMoves)) && !isSubmitting),
    [account, enabled, duelId, canSign, storedSalt, storedMoves, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, canSign, storedSalt, storedMoves, isSubmitting)

  const reveal = useCallback(async () => {
    const _reveal = async (salt: bigint, moves: number[]) => {
      if (moves?.length >= 2 && !isSubmitting) {
        setIsSubmitting(true)
        if (duelistId == PLAYER_CHARACTER_ID) {
          await tutorial.reveal_moves(account, duelistId, duelId, salt, moves)
        } else {
          await game.reveal_moves(account, duelistId, duelId, salt, moves)
        }
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

