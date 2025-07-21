import { BigNumberish } from 'starknet'
import { bigintToU256 } from 'src/starknet/starknet'

//
// IMPORTANT!!!
// in sync with pistols::models::pact::PactTrait::make_pair()
//

export const make_pact_pair = (address_a: BigNumberish, address_b: BigNumberish): bigint => {
  const aa = BigInt(bigintToU256(address_a ?? 0).low)
  const bb = BigInt(bigintToU256(address_b ?? 0).low)
  const pair = (aa && bb) ? (aa ^ bb) : 0n
  // console.log(`make_pact_pair()`, bigintToHex(aa), '^', bigintToHex(bb), ':', bigintToHex(pair))
  return pair
}
