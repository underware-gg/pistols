
import { useCallback } from 'react'
import { StarknetWalletApi } from '@starknet-io/get-starknet-core'
import { SwitchStarknetChainParameters, AddStarknetChainParameters } from '@starknet-io/types-js'
import { useAccount } from '@starknet-start/react'

export const useSwitchStarknetChain = (params: SwitchStarknetChainParameters) => {
  const { connector } = useAccount()
  const switch_starknet_chain = useCallback(() => {
    console.log(`useSwitchStarknetChain()...`, params)
    return connector?.features[StarknetWalletApi].request({
      type: 'wallet_switchStarknetChain',
      params,
    }) ?? Promise.resolve(false)
  }, [connector, params])
  return {
    switch_starknet_chain,
  }
}

export const useAddStarknetChain = (params: AddStarknetChainParameters) => {
  const { connector } = useAccount()
  // Call to add network to current connected wallet
  // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
  const add_starknet_chain = useCallback(() => {
    console.log(`useAddStarknetChain()...`, params)
    return connector?.features[StarknetWalletApi].request({
      type: 'wallet_addStarknetChain',
      params,
    }) ?? Promise.resolve(false)
  }, [connector, params])
  return {
    add_starknet_chain,
  }
}
