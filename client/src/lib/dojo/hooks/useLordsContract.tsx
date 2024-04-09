import { useMemo } from 'react'
import { getContractByName } from '@dojoengine/core'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useDojo } from '@/lib/dojo/DojoContext'
import { bigintEquals } from '@/lib/utils/types'

export const useLordsContract = () => {
  const { selectedChainConfig } = useStarknetContext()
  const { setup: { manifest } } = useDojo()

  const contractAddress = useMemo(() => (selectedChainConfig.lordsContractAddress), [selectedChainConfig])

  const mockAddress = useMemo(() => {
    const mockContract = getContractByName(manifest, 'lords_mock')
    return mockContract?.address ?? null
  }, [manifest])

  const isMock = !contractAddress && mockAddress != null

  return {
    contractAddress: contractAddress ?? mockAddress,
    isMock,
  }
}
