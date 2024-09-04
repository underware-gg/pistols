import { AccountInterface, BigNumberish } from 'starknet'
import { poseidon } from '@/lib/utils/starknet'
import { signMessages, Messages } from '@/lib/utils/starknet_sign'
import { HASH_SALT_MASK } from '@/pistols/utils/constants'
import { bigintToHex } from '@/lib/utils/types'

interface CommitMoveMessage extends Messages {
  duelId: bigint,
  roundNumber: bigint,
  duelistId: bigint,
}

export const make_moves_hash = (salt: BigNumberish, action: BigNumberish) => (poseidon([BigInt(salt), BigInt(action)]) & HASH_SALT_MASK)

export const pack_action_slots = (slot1: number | null, slot2: number | null): number | null => {
  if (slot1 != null && slot2 != null) {
    return slot1 | (slot2 << 8)
  }
  return null
}

export const unpack_action_slots = (packed: number | null): number[] | null => {
  if (packed != null) {
    return [packed & 0xff, (packed & 0xff00) >> 8]
  }
  return null
}


/** @returns a 64-bit salt from account signature, or 0 if fail */
const signAndGenerateSalt = async (account: AccountInterface, chainId: string, duelistId: bigint, duelId: bigint, roundNumber: number): Promise<bigint> => {
  let result = 0n
  if (duelId && roundNumber) {
    try {
      const messages: CommitMoveMessage = {
        duelId: BigInt(duelId),
        roundNumber: BigInt(roundNumber),
        duelistId: BigInt(duelistId),
      }
      const { signatureHash } = await signMessages(account, chainId, 1, messages)
      if (signatureHash == 0n) {
        // get on-chain????
        throw new Error('null signature')
      }
      result = (signatureHash & HASH_SALT_MASK)
    } catch (e) {
      console.warn(`signAndGenerateSalt() exception:`, e)
    }
  }
  return result
}

/** @returns the felt252 hash for an action, or 0 if fail */
export const signAndGenerateActionHash = async (account: AccountInterface, chainId: string, duelistId: bigint, duelId: bigint, roundNumber: number, packed: BigNumberish): Promise<bigint> => {
  const salt = await signAndGenerateSalt(account, chainId, duelistId, duelId, roundNumber)
  const hash = salt ? make_moves_hash(salt, BigInt(packed)) : null
  console.log(`signAndGenerateActionHash():`, bigintToHex(duelId), roundNumber, packed, bigintToHex(salt), bigintToHex(hash))
  return hash
}

/** @returns the original action from an action hash, or 0 if fail */
export const signAndRestoreActionFromHash = async (account: AccountInterface, chainId: string, duelistId: bigint, duelId: bigint, roundNumber: number, hash: bigint, possibleActions: BigNumberish[]): Promise<{ salt: bigint, packed: number, slot1: number, slot2: number }> => {
  const salt = await signAndGenerateSalt(account, chainId, duelistId, duelId, roundNumber)
  let packed = null
  let slots = null
  console.log(`___RESTORE_HASH Duel:`, bigintToHex(duelId), 'round:', roundNumber, 'hash:', bigintToHex(hash), 'salt:', bigintToHex(salt))
  for (let i = 0; salt > 0n && i < possibleActions.length; ++i) {
    const m = possibleActions[i]
    const h = make_moves_hash(salt, m)
    console.log(`___RESTORE_HASH move:`, m, bigintToHex(hash), '>', bigintToHex(h))
    if (h == hash) {
      packed = Number(m)
      slots = unpack_action_slots(packed)
      console.log(`___RESTORE_HASH FOUND ACTION:`, packed, slots)
      break
    }
  }
  if (!packed) {
    console.warn(`___RESTORE_HASH ACTION NOT FOUND for hash:`, hash)
  }
  return {
    salt,
    packed,
    slot1: slots?.[0] ?? null,
    slot2: slots?.[1] ?? null,
  }
}

// 12078656863973367808n
// 12078656863973366908n
// 0xa7a0026c1cf76000
// 0xa7a0026c1cf75c7c
