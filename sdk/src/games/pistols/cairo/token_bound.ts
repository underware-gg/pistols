import { BigNumberish } from 'starknet'
import { poseidon } from 'src/starknet/starknet'

//
// IMPORTANT!!!
// in sync with pistols::systems::components::token_bound::address_of_token
//

export const make_token_bound_address = (contractAddress: BigNumberish, tokenId: BigNumberish): bigint => {
  return poseidon([contractAddress, tokenId])
}
