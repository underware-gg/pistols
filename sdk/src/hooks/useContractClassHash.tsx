import { useEffect, useMemo, useState } from 'react'
import { BigNumberish, RpcProvider } from 'starknet'

export const useContractClassHash = (contractAddress: BigNumberish, provider: RpcProvider) => {

  const [classHash, setClassHash] = useState<BigNumberish>()

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        const result = await provider.getClassHashAt(contractAddress)
        if (_mounted) {
          setClassHash(result)
        }
      } catch {
        if (_mounted) {
          setClassHash(undefined)
        }
      }
    }
    setClassHash(undefined)
    if (contractAddress && provider) {
      _fetch()
    }
    return () => { _mounted = false }
  }, [contractAddress, provider])

  const isDeployed = useMemo(() => (contractAddress ? Boolean(classHash) : undefined), [classHash, contractAddress])

  return {
    classHash,
    isDeployed,
  }
}
