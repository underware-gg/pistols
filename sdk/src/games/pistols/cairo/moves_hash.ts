import { BigNumberish } from 'starknet'
import { poseidon } from 'src/starknet/starknet'
import * as constants from '../generated/constants'

//
// IMPORTANT!!!
// in sync with pistols::libs::moves_hash::MovesHashTrait
//

export const make_moves_hash = (salt: BigNumberish, moves: number[]) => {
  if (!salt) return null
  let result: bigint = 0n
  for (let index = 0; index < moves.length; index++) {
    if (index == 4) {
      console.warn(`make_moves_hash(): too many moves (${moves.length})!`, moves)
      break
    }
    const move: number = moves[index]
    if (move != 0) {
      const move_hash = _make_move_hash(salt, index, move)
      result |= move_hash
    }
  }
  return result
}

const _make_move_mask = (index: number): bigint => {
  return (BigInt(constants.BITWISE.MAX_U32) << (BigInt(index) * 32n))
}

const _make_move_hash = (salt: BigNumberish, index: number, move: number): bigint => {
  const mask: bigint = _make_move_mask(index)
  const hash: bigint = move ? poseidon([salt, move]) : 0n
  return (hash & mask)
}


/** @returns the original action from an action hash, or 0 if fail */
export const restore_moves_from_hash = (
  salt: bigint,
  hash: bigint,
  decks: number[][]
): number[] => {
  let moves: number[] = []
  if (salt > 0n) {
    // there are 2 to 4 decks...
    for (let di = 0; di < decks.length; ++di) {
      const deck = decks[di]
      const mask = _make_move_mask(di)
      // is deck is empty, no move
      if (deck.length == 0) {
        // console.log(`___RESTORE D${di}: SKIP`)
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
            // console.log(`___RESTORE D${di}/M${mi}: FOUND!`, move)
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
  return moves;
}
