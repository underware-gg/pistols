
import { useCallback } from 'react'
import { SwitchStarknetChainParameter, AddStarknetChainParameters } from 'get-starknet-core'

export const useSwitchStarknetChain = (params: SwitchStarknetChainParameter) => {
  const switch_starknet_chain = useCallback(() => {
    console.log(`useSwitchStarknetChain()...`, params)
    return window?.starknet?.request({ type: 'wallet_switchStarknetChain', params }) ?? Promise.resolve(false)
  }, [params])
  return {
    switch_starknet_chain,
  }
}

export const useAddStarknetChain = (params: AddStarknetChainParameters) => {
  // Call to add network to current connected wallet
  // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
  const add_starknet_chain = useCallback(() => {
    console.log(`useAddStarknetChain()...`, params)
    return window?.starknet?.request({ type: 'wallet_addStarknetChain', params }) ?? Promise.resolve(false)
  }, [params])
  return {
    add_starknet_chain,
  }
}
