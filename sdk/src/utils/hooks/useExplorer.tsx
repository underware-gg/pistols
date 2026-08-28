import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useNetwork } from '@starknet-start/react'
import { bigintToAddress } from '../misc/types'

export type ExplorerType = 'cartridge' | 'starkscan' | 'viewblock' | 'voyager'

export function useExplorerContractUrl(address: BigNumberish, explorerType: ExplorerType) {
  const { chain } = useNetwork()
  const url = useMemo(() => {
    const addr = bigintToAddress(address)
    const explorerUrl = chain.explorers?.[explorerType]?.toString()
    return explorerUrl ? `${explorerUrl}/contract/${addr}` : null
  }, [address, chain, explorerType])
  return url
}
