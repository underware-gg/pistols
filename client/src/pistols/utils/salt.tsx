import {
  Account,
  BigNumberish,
  WeierstrassSignatureType,
} from 'starknet'
import {
  signMessages,
  pedersen,
} from '@/pistols/utils/starknet'

/** @returns a 64-bit salt from account signature, or 0 if fail */
export const signAndGenerateSalt = async (account: Account, duelId: bigint, roundNumber: number): Promise<bigint> => {
  let result = 0n
  if (duelId && roundNumber) {
    try {
      const sig: WeierstrassSignatureType = await signMessages(account, [duelId, roundNumber])
      // result = ((sig.r ^ sig.s) & 0xffffffffffffffffn) // 64 bits
      result = ((sig.r ^ sig.s) & 0x1fffffffffffffn) // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
    } catch (e) {
      console.warn(`signAndGenerateSalt() exception:`, e)
    }
  }
  return result
}

/** @returns the felt252 hash for a move, or 0 if fail */
export const signAndGenerateMoveHash = async (account: Account, duelId: bigint, roundNumber: number, move: BigNumberish): Promise<bigint> => {
  const salt = await signAndGenerateSalt(account, duelId, roundNumber)
  const hash = pedersen(salt, BigInt(move))
  // console.log(`SALT_HASH`, duelId, roundNumber, move, salt, hash)
  return hash
}

/** @returns the original move from a move hash, or 0 if fail */
export const signAndRestoreMoveFromHash = async (account: Account, duelId: bigint, roundNumber: number, hash: bigint, possibleMoves: BigNumberish[]): Promise<{ salt: bigint, move: number }> => {
  const salt = await signAndGenerateSalt(account, duelId, roundNumber)
  let move = 0
  for (let i = 0; i < possibleMoves.length; ++i) {
    const m = possibleMoves[i]
    const h = pedersen(salt, BigInt(m))
    // console.log(`___RESTORE_HASH`, duelId, roundNumber, salt, hash, m)
    if (h == hash) {
      // console.log(`___RESTORE_HASH FOUND MOVE:`, m)
      move = Number(m)
      break
    }
  }
  return {
    salt,
    move
  }
}
