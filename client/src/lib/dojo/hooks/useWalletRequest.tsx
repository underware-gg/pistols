
import { useCallback } from 'react'
import { SwitchStarknetChainParameters, AddStarknetChainParameters } from 'get-starknet-core'

// TODO: use this...
// import { useSwitchChain } from "@starknet-react/core";
export const useSwitchStarknetChain = (params: SwitchStarknetChainParameters) => {
  const switch_starknet_chain = useCallback(() => {
    console.log(`useSwitchStarknetChain()...`, params)
    //@ts-ignore
    return window?.starknet?.request({ type: 'wallet_switchStarknetChain', params }) ?? Promise.resolve(false)
  }, [params])
  return {
    switch_starknet_chain,
  }
}

// TODO: use this...
// import { useAddChain } from "@starknet-react/core";
export const useAddStarknetChain = (params: AddStarknetChainParameters) => {
  // Call to add network to current connected wallet
  // https://github.com/starknet-io/starknet.js/blob/develop/src/wallet/connect.ts
  const add_starknet_chain = useCallback(() => {
    console.log(`useAddStarknetChain()...`, params)
    //@ts-ignore
    return window?.starknet?.request({ type: 'wallet_addStarknetChain', params }) ?? Promise.resolve(false)
  }, [params])
  return {
    add_starknet_chain,
  }
}
