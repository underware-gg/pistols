import { BigNumberish } from 'starknet'
import { poseidon } from 'src/starknet/starknet'

//
// IMPORTANT!!!
// in sync with pistols::libs::bot::BotPlayerMovesTrait::make_salt()
//

export const make_bot_salt = (duel_id: BigNumberish): bigint => {
  return poseidon([duel_id])
}
