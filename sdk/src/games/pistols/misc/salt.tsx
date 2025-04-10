import { AccountInterface, BigNumberish, StarknetDomain } from 'starknet'
import { signMessages, Messages } from 'src/utils/starknet/starknet_sign'
import { bigintToHex } from 'src/utils/misc/types'
import { make_moves_hash, _make_move_mask, _make_move_hash } from '../cairo/make_moves_hash'

export interface CommitMoveMessage extends Messages {
  duelId: bigint,
  duelistId: bigint,
}

/** @returns a salt from account signature, or 0 if fails */
const signAndGenerateSalt = async (
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: CommitMoveMessage,
): Promise<bigint> => {
  let result = 0n
  if (messageToSign) {
    try {
      const { signatureHash } = await signMessages(account, starknetDomain, messageToSign)
      if (signatureHash == 0n) {
        // get on-chain????
        throw new Error('null signature')
      }
      result = signatureHash
    } catch (e) {
      console.warn(`signAndGenerateSalt() exception:`, e)
    }
  }
  return result
}

/** @returns the felt252 hash for an action, or 0 if fail */
export const signAndGenerateMovesHash = async (
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: CommitMoveMessage,
  moves: number[]
): Promise<{ hash: bigint, salt: bigint }> => {
  const salt = await signAndGenerateSalt(account, starknetDomain, messageToSign)
  const hash = make_moves_hash(salt, moves)
  console.log(`signAndGenerateMovesHash():`, messageToSign, moves, bigintToHex(salt), bigintToHex(hash))
  return { hash, salt }
}

/** @returns the original action from an action hash, or 0 if fail */
export const signAndRestoreMovesFromHash = async (
  account: AccountInterface, 
  starknetDomain: StarknetDomain, 
  messageToSign: CommitMoveMessage,
  hash: bigint, 
  decks: number[][]
): Promise<{ salt: bigint, moves: number[] }> => {
  const salt = await signAndGenerateSalt(account, starknetDomain, messageToSign)
  let moves = []
  console.log(`___RESTORE decks:`, decks)
  console.log(`___RESTORE message:`, messageToSign, '\nsalt:', bigintToHex(salt), '\nhash:', bigintToHex(hash))
  if (salt > 0n) {
    // there are 2 to 4 decks...
    for (let di = 0; di < decks.length; ++di) {
      const deck = decks[di]
      const mask = _make_move_mask(di)
      // is deck is empty, no move
      if (deck.length == 0) {
        console.log(`___RESTORE D${di}: SKIP`)
        moves.push(0) // did not move here
        continue
      }
      // each deck can contain up to 10 cards/moves...
      for (let mi = 0; mi < deck.length; ++mi) {
        const move = deck[mi]
        const move_hash = _make_move_hash(salt, di, move)
        const stored_hash = (hash & mask)
        if (stored_hash == 0n) {
          moves.push(0) // did not move here
          break
        } else {
          // console.log(`___RESTORE D${di}/M${mi}:`, bigintToHex(stored_hash), '>', bigintToHex(move_hash), '?', move)
          if (stored_hash == move_hash) {
            moves.push(Number(move))
            console.log(`___RESTORE D${di}/M${mi}: FOUND!`, move)
            break
          }
        }
      }
      if (moves.length != di + 1) {
        console.warn(`___RESTORE NOT FOUND for deck ${di}`)
        break
      }
    }
  }
  if (moves.length != decks.length) {
    moves = []
  } else {
    console.log(`___RESTORED ALL MOVES:`, moves)
  }
  return {
    salt,
    moves,
  }
}

// 12078656863973367808n
// 12078656863973366908n
// 0xa7a0026c1cf76000
// 0xa7a0026c1cf75c7c
