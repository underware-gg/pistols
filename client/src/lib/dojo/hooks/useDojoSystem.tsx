import { useMemo } from 'react'
import { getContractByName, Manifest } from '@dojoengine/core'
import { useDojo } from '@/lib/dojo/DojoContext'
import { useDeployedContract } from '../../utils/hooks/useDeployedContract'

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
  const { isDeployed, cairoVersion } = useDeployedContract(contractAddress, abi)

  return {
    contractAddress,
    isDeployed,
    cairoVersion,
    abi,
  }
}
