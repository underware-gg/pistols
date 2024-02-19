import {
  Account,
  BigNumberish,
  WeierstrassSignatureType,
} from 'starknet'
import {
  signMessages,
  pedersen,
} from '@/pistols/utils/starknet'
import constants from '@/pistols/utils/constants'

/** @returns a 64-bit salt from account signature, or 0 if fail */
export const signAndGenerateSalt = async (account: Account, duelId: bigint, roundNumber: number): Promise<bigint> => {
  let result = 0n
  if (duelId && roundNumber) {
    try {
      const sig: WeierstrassSignatureType = await signMessages(account, [duelId, roundNumber])
      result = ((sig.r ^ sig.s) & constants.HASH_SALT_MASK)
    } catch (e) {
      console.warn(`signAndGenerateSalt() exception:`, e)
    }
  }
  return result
}

const make_action_hash = (salt: BigNumberish, action: BigNumberish) => (pedersen(BigInt(salt), BigInt(action)) & constants.HASH_SALT_MASK)

/** @returns the felt252 hash for an action, or 0 if fail */
export const signAndGenerateActionHash = async (account: Account, duelId: bigint, roundNumber: number, action: BigNumberish): Promise<bigint> => {
  const salt = await signAndGenerateSalt(account, duelId, roundNumber)
  const hash = make_action_hash(salt, action)
  // console.log(`SALT_HASH`, duelId, roundNumber, action, salt, hash)
  return hash
}

/** @returns the original action from an action hash, or 0 if fail */
export const signAndRestoreActionFromHash = async (account: Account, duelId: bigint, roundNumber: number, hash: bigint, possibleActions: BigNumberish[]): Promise<{ salt: bigint, action: number }> => {
  const salt = await signAndGenerateSalt(account, duelId, roundNumber)
  let action = 0
  for (let i = 0; i < possibleActions.length; ++i) {
    const m = possibleActions[i]
    const h = make_action_hash(salt, m)
    // console.log(`___RESTORE_HASH`, duelId, roundNumber, salt, hash, m)
    if (h == hash) {
      // console.log(`___RESTORE_HASH FOUND MOVE:`, m)
      action = Number(m)
      break
    }
  }
  return {
    salt,
    action,
  }
}
