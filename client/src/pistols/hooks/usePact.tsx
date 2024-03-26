import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'

export const usePact = (duelist_a: bigint | string | null, duelist_b: bigint | string | null) => {
  const { Pact } = useDojoComponents()

  const pair = useMemo(() => {
    const a = BigInt(duelist_a) & BigInt('0xffffffffffffffffffffffffffffffff')
    const b = BigInt(duelist_b) & BigInt('0xffffffffffffffffffffffffffffffff')
    return (a ^ b)
  }, [duelist_a, duelist_b])

  const pact = useComponentValue(Pact, bigintToEntity(pair))

  return {
    pactDuelId: pact?.duel_id,
    hasPact: pact && pact.duel_id > 0n,
  }
}
