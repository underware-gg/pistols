import { BigNumberish } from 'starknet'
import { poseidon } from 'src/starknet/starknet'
import * as constants from '../generated/constants'

//
// IMPORTANT!!!
// in sync with pistols:: models::challenge::MovesTrait::make_moves_hash()
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

export const _make_move_mask = (index: number): bigint => {
  return (BigInt(constants.BITWISE.MAX_U32) << (BigInt(index) * 32n))
}

export const _make_move_hash = (salt: BigNumberish, index: number, move: number): bigint => {
  const mask: bigint = _make_move_mask(index)
  const hash: bigint = move ? poseidon([salt, move]) : 0n
  return (hash & mask)
}
