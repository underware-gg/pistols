import { useEffect, useState } from "react"
import { useDojoSystemCalls } from '@/dojo/DojoContext'

export const usePact = (duelist_a: bigint | string | null, duelist_b: bigint | string | null) => {
  const { get_pact } = useDojoSystemCalls()
  const [isLoading, setIsLoading] = useState(null)
  const [pactDuelId, setPactDuelId] = useState(null)

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      const _duelId = await get_pact(BigInt(duelist_a), BigInt(duelist_b))
      if (_mounted && _duelId) {
        setPactDuelId(_duelId)
        setIsLoading(false)
      }
    }
    setPactDuelId(null)
    setIsLoading(true)
    if (duelist_a && duelist_b) {
      _fetch()
    }
    return () => {
      _mounted = false
    }
  }, [duelist_a, duelist_b])

  return {
    pactDuelId,
    hasPact: pactDuelId && pactDuelId > 0n,
    isLoading,
  }
}
