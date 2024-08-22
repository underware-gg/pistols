import { useMemo } from 'react'
import { getContractByName } from '@dojoengine/core'
import { useDojo } from '@/lib/dojo/DojoContext'
import { DojoManifest } from '@/lib/dojo/Dojo'
import { useDeployedContract } from '@/lib/utils/hooks/useDeployedContract'

export const useDojoSystem = (systemName: string) => {
  const { setup: { manifest, nameSpace } } = useDojo()
  return useSystem(nameSpace, systemName, manifest)
}

export const useSystem = (nameSpace: string, systemName: string, manifest: DojoManifest) => {

  //
  // Find Dojo Contract
  const { contractAddress, abi } = useMemo(() => {
    const contract = manifest ? getContractByName(manifest, nameSpace, systemName) : null
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
