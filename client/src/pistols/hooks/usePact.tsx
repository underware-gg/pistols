import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'
import { pedersen } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const usePact = (duelist_id_a: BigNumberish, duelist_id_b: BigNumberish) => {
  const { Pact } = useDojoComponents()

  const pair = useMemo(() => {
    // same as pistols::utils::make_pact_pair()
    const a = pedersen(duelist_id_a, duelist_id_a)
    const b = pedersen(duelist_id_b, duelist_id_b)
    return (a ^ b)
  }, [duelist_id_a, duelist_id_b])

  const pact = useComponentValue(Pact, bigintToEntity(pair))

  return {
    pactDuelId: pact?.duel_id,
    hasPact: pact && pact.duel_id > 0n,
  }
}
