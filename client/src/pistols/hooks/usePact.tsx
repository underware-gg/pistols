import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { isPositiveBigint, keysToEntity } from '@/lib/utils/types'
import { bigintToU256, pedersen, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const usePact = (table_id: string, duelist_id_or_address_a: BigNumberish, duelist_id_or_address_b: BigNumberish) => {
  const { Pact } = useDojoComponents()

  const { pair, pairKey } = useMemo(() => {
    if (!isPositiveBigint(duelist_id_or_address_a) || !isPositiveBigint(duelist_id_or_address_b)) return {}
    // same as pistols::utils::make_pact_pair()
    const a_u256 = bigintToU256(duelist_id_or_address_a)
    const b_u256 = bigintToU256(duelist_id_or_address_b)
    const aa = pedersen(a_u256.low, a_u256.low)
    const bb = pedersen(b_u256.low, b_u256.low)
    const pair = bigintToU256(aa ^ bb).low
    return {
      pair,
      pairKey: keysToEntity([stringToFelt(table_id), pair]),
    }
  }, [duelist_id_or_address_a, duelist_id_or_address_b])

  const pact = useComponentValue(Pact, pairKey)
  const pactDuelId = useMemo(() => (pact?.duel_id ?? 0n), [pact])
  const hasPact = useMemo(() => (pactDuelId > 0n), [pactDuelId])

  return {
    pactDuelId,
    hasPact,
  }
}
