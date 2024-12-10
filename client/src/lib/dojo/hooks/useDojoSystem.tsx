import { Abi, BigNumberish } from 'starknet'
import { useMemo } from 'react'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { useDeployedContract } from '@/lib/utils/hooks/useDeployedContract'
import { getContractByName } from '@dojoengine/core'
import { DojoManifest } from '@/lib/dojo/Dojo'
import { bigintToHex } from '@/lib/utils/types'


export const useDojoSystem = (systemName: string) => {
  const { manifest, nameSpace } = useDojoSetup()
  return useSystem(nameSpace, systemName, manifest)
}

export const useDeployedDojoSystem = (systemName: string) => {
  const { manifest, nameSpace } = useDojoSetup()
  return useDeployedSystem(nameSpace, systemName, manifest)
}


const useSystem = (nameSpace: string, systemName: string, manifest: DojoManifest) => {
  const { contractAddress, abi } = useMemo(() => {
    const contract = manifest ? getContractByName(manifest, nameSpace, systemName) : null
    return {
      contractAddress: (contract ? bigintToHex(contract.address) : null) as BigNumberish,
      abi: (contract?.abi ?? null) as Abi,
    }
  }, [systemName, manifest])
  return {
    contractAddress,
    abi,
  }
}

export const useDeployedSystem = (nameSpace: string, systemName: string, manifest: DojoManifest) => {
  // Find Dojo Contract
  const { contractAddress, abi } = useSystem(nameSpace, systemName, manifest)

  // Check if contract exists
  const { isDeployed, cairoVersion } = useDeployedContract(contractAddress, abi)

  return {
    contractAddress,
    isDeployed,
    cairoVersion,
    abi,
  }
}
