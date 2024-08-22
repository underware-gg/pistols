import { useEffect, useMemo, useState } from 'react'
import { BigNumberish, RpcProvider } from 'starknet'
import { useDojo } from '@/lib/dojo/DojoContext'

export const useContractClassHash = (contractAddress: BigNumberish, provider?: RpcProvider) => {
  const { setup: { dojoProvider } } = useDojo()

  const [classHash, setClassHash] = useState<BigNumberish>()

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        const result = await (provider ?? dojoProvider.provider).getClassHashAt(contractAddress)
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
    if (contractAddress && (provider || dojoProvider.provider)) {
      _fetch()
    }
    return () => { _mounted = false }
  }, [contractAddress, dojoProvider, provider])

  const isDeployed = useMemo(() => (contractAddress ? Boolean(classHash) : undefined), [classHash, contractAddress])

  return {
    classHash,
    isDeployed,
  }
}
