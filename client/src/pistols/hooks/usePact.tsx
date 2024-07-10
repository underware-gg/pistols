import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { isPositiveBigint, keysToEntity } from '@/lib/utils/types'
import { bigintToU256, pedersen, stringToFelt } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const usePact = (table_id: string, duelist_id_a: BigNumberish, duelist_id_b: BigNumberish) => {
  const { Pact } = useDojoComponents()

  const { pair, pairKey } = useMemo(() => {
    if (!isPositiveBigint(duelist_id_a) || !isPositiveBigint(duelist_id_b)) return {}
    // same as pistols::utils::make_pact_pair()
    const aa = pedersen(duelist_id_a, duelist_id_a)
    const bb = pedersen(duelist_id_b, duelist_id_b)
    const pair = bigintToU256(aa ^ bb).low
    return {
      pair,
      pairKey: keysToEntity([stringToFelt(table_id), pair]),
    }
  }, [duelist_id_a, duelist_id_b])

  const pact = useComponentValue(Pact, pairKey)
  const pactDuelId = useMemo(() => (pact?.duel_id ?? 0n), [pact])

  return {
    pactDuelId,
    hasPact: pactDuelId > 0n,
  }
}
