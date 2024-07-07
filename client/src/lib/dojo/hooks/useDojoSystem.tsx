import { useEffect, useMemo, useState } from 'react'
import { getContractByName, Manifest } from '@dojoengine/core'
import { useDojo } from '@/lib/dojo/DojoContext'
import { useContract } from '@starknet-react/core'

export const useDojoSystem = (systemName: string) => {
  const { setup: { manifest } } = useDojo()
  return useSystem(systemName, manifest)
}

export const useSystem = (systemName: string, manifest: Manifest) => {

  //
  // Find Dojo Contract
  const { contractAddress, abi } = useMemo(() => {
    const contract = manifest ? getContractByName(manifest, systemName) : null
    return {
      contractAddress: contract?.address ?? null,
      abi: contract?.abi ?? null,
    }
  }, [systemName, manifest])

  //
  // Check if contract exists
  const [cairoVersion, setCairoVersion] = useState<number>(undefined)
  const [isDeployed, setIsDeployed] = useState<boolean>(!contractAddress ? false : undefined)
  const { contract } = useContract({
    abi,
    address: contractAddress,
  })
  useEffect(() => {
    let _mounted = true
    const _check_deployed = async () => {
      try {
        const { cairo } = await contract.getVersion()
        if (_mounted) {
          setCairoVersion(parseInt(cairo))
          setIsDeployed(true)
        }
      } catch {
        if (_mounted) {
          setIsDeployed(false)
        }
      }
    }
    _check_deployed()
    return () => { _mounted = false }
  }, [contract])

  return {
    contractAddress,
    isDeployed,
    cairoVersion,
    abi,
  }
}
