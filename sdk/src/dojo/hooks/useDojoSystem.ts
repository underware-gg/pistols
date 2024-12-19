import { useMemo } from 'react'
import { Abi, BigNumberish } from 'starknet'
import { getContractByName } from '@dojoengine/core'
import { useDeployedContract } from '../../hooks'
import { bigintToHex } from '../../utils'
import {
  DojoManifest,
  useDojoSetup,
} from '../../dojo'


export const useDojoSystem = (systemName: string) => {
  const { manifest, namespace } = useDojoSetup()
  return useSystem(namespace, systemName, manifest)
}

export const useDeployedDojoSystem = (systemName: string) => {
  const { manifest, namespace } = useDojoSetup()
  return useDeployedSystem(namespace, systemName, manifest)
}


const useSystem = (namespace: string, systemName: string, manifest: DojoManifest) => {
  const { contractAddress, abi } = useMemo(() => {
    const contract = manifest ? getContractByName(manifest, namespace, systemName) : null
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

export const useDeployedSystem = (namespace: string, systemName: string, manifest: DojoManifest) => {
  // Find Dojo Contract
  const { contractAddress, abi } = useSystem(namespace, systemName, manifest)

  // Check if contract exists
  const { isDeployed, cairoVersion } = useDeployedContract(contractAddress, abi)

  return {
    contractAddress,
    isDeployed,
    cairoVersion,
    abi,
  }
}
