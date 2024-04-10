import { useMemo } from 'react'
import { getContractByName } from '@dojoengine/core'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { useDojo } from '@/lib/dojo/DojoContext'
import { BigNumberish } from 'starknet'

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

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useLordsContract()
  return useERC20Balance(contractAddress, address, fee)
}
