import { useCallback, useEffect, useMemo, useState } from 'react'
import { DojoPredeployedStarknetWindowObject } from '@dojoengine/create-burner'
import { useAccount } from '@starknet-react/core'
import { stark } from 'starknet'

/** Create local player id, only when using the Dojo Predeployed connector */
export const usePlayerId = () => {
  const { connector } = useAccount()
  const [playerId, setPlayerId] = useState<string>(undefined)

  const requiresPlayerId = useMemo(() => (connector?.id == DojoPredeployedStarknetWindowObject.getId()), [connector])

  const replacePlayerId = useCallback((newPlayerId: string) => {
    window?.localStorage?.setItem('player_id', newPlayerId)
    setPlayerId(newPlayerId)
  }, [])

  useEffect(() => {
    if (connector?.id == DojoPredeployedStarknetWindowObject.getId()) {
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
  }, [connector])

  return {
    playerId,
    replacePlayerId,
    requiresPlayerId,
  }
}
