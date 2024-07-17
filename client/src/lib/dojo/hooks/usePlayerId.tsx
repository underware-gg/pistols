import { useCallback, useEffect, useMemo, useState } from 'react'
import { DojoPredeployedStarknetWindowObject } from '@dojoengine/create-burner'
import { useAccount } from '@starknet-react/core'
import { stark } from 'starknet'

/** Create local player id, only when using the Dojo Predeployed connector */
export const usePlayerId = () => {
  const [playerId, setPlayerId] = useState<string>(undefined)

  // const { connector } = useAccount()
  // const requiresPlayerId = useMemo(() => (connector?.id == DojoPredeployedStarknetWindowObject.getId()), [connector])
  const requiresPlayerId = true

  const replacePlayerId = useCallback((newPlayerId: string) => {
    window?.localStorage?.setItem('player_id', newPlayerId)
    setPlayerId(newPlayerId)
  }, [])

  useEffect(() => {
    if (requiresPlayerId) {
      const storedPlayerId = (typeof window !== 'undefined' ? window?.localStorage?.getItem('player_id') : undefined)
      if (storedPlayerId) {
        setPlayerId(storedPlayerId)
      } else {
        const newPlayerId = stark.randomAddress()
        replacePlayerId(newPlayerId)
      }
    } else {
      setPlayerId(undefined)
    }
  }, [requiresPlayerId])

  return {
    playerId,
    replacePlayerId,
    requiresPlayerId,
  }
}
