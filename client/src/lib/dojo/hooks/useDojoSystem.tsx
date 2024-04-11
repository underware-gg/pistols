import { useEffect, useMemo, useState } from 'react'
import { getContractByName } from '@dojoengine/core'
import { useDojo } from '@/lib/dojo/DojoContext'
import { useContract } from '@starknet-react/core'

export const useDojoSystem = (systemName: string) => {
  const { setup: { manifest } } = useDojo()

  //
  // Get Dojo Contract
  const { contractAddress, abi } = useMemo(() => {
    const contract = getContractByName(manifest, systemName)
    return {
      contractAddress: contract?.address ?? null,
      abi: contract?.abi ?? null,
    }
  }, [systemName, manifest])

  //
  // Check if contract exists
  const [systemExists, setSystemExists] = useState<boolean>(undefined)
  const { contract } = useContract({
    abi,
    address: contractAddress,
  })
  useEffect(() => {
    let _mounted = true
    const _check_deployed = async () => {
      try {
        const { cairo } = await contract.getVersion()
        if (_mounted) setSystemExists(true)
      } catch {
        if (_mounted) setSystemExists(false)
      }
    }
    _check_deployed()
    return () => { _mounted = false }
  }, [contract])

  return {
    systemAddress: contractAddress,
    systemExists,
    abi,
  }
}
