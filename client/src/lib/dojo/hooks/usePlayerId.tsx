import { useEffect, useState } from 'react'
import { DojoPredeployedStarknetWindowObject } from '@rsodre/create-burner'
import { useAccount } from '@starknet-react/core'
import { stark } from 'starknet'

/** Create local player id, only when using the Dojo Predeployed connector */
export const usePlayerId = () => {
  const { connector } = useAccount()
  const [playerId, setPlayerId] = useState<string>(undefined)

  useEffect(() => {
    if (connector?.id == DojoPredeployedStarknetWindowObject.getId()) {
      const storedPlayerId = (typeof window !== 'undefined' ? window?.localStorage?.getItem('player_id') : undefined)
      if (storedPlayerId) {
        setPlayerId(storedPlayerId)
      } else {
        const newPlayerId = stark.randomAddress()
        window?.localStorage?.setItem('player_id', newPlayerId)
        setPlayerId(newPlayerId)
      }
    } else {
      setPlayerId(undefined)
    }
  }, [connector])

  return {
    playerId,
  }
}
