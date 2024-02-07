import { useEffect, useMemo, useState } from 'react'
import { useComponentValue } from "@dojoengine/react"
import { useDojoComponents, useDojoSystemCalls } from '@/dojo/DojoContext'
import { bigintToEntity, keysToEntity } from "../utils/utils"

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

// export const usePact = (duelist_a: bigint | string | null, duelist_b: bigint | string | null) => {
//   const { get_pact } = useDojoSystemCalls()
//   const [isLoading, setIsLoading] = useState(null)
//   const [pactDuelId, setPactDuelId] = useState(null)

//   useEffect(() => {
//     let _mounted = true
//     const _fetch = async () => {
//       const _duelId = await get_pact(BigInt(duelist_a), BigInt(duelist_b))
//       if (_mounted && _duelId) {
//         setPactDuelId(_duelId)
//         setIsLoading(false)
//       }
//     }
//     setPactDuelId(null)
//     setIsLoading(true)
//     if (duelist_a && duelist_b) {
//       _fetch()
//     }
//     return () => {
//       _mounted = false
//     }
//   }, [duelist_a, duelist_b])

//   return {
//     pactDuelId,
//     hasPact: pactDuelId && pactDuelId > 0n,
//     isLoading,
//   }
// }
