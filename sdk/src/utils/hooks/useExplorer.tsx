import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useNetwork, CartridgeExplorer, StarkscanExplorer, ViewblockExplorer, VoyagerExplorer } from '@starknet-react/core'
import { bigintToAddress } from '../misc/types'

export type ExplorerType = 'cartridge' | 'starkscan' | 'viewblock' | 'voyager'

export function useExplorerContractUrl(address: BigNumberish, explorerType: ExplorerType) {
  const { chain } = useNetwork()
  const url = useMemo(() => {
    const addr = bigintToAddress(address)
    switch (explorerType) {
      case 'cartridge':
        return new CartridgeExplorer(chain).contract(addr)
      case 'starkscan':
        return new StarkscanExplorer(chain).contract(addr)
      case 'viewblock':
        return new ViewblockExplorer(chain).contract(addr)
      case 'voyager':
        return new VoyagerExplorer(chain).contract(addr)
    }
    return null
  }, [address])
  return url
}
