import { useMemo, useEffect } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
// import { createDojoStore } from '@dojoengine/sdk'
import { createDojoStore } from '@/lib/dojo/fix/zustand'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { Token, TokenBalance } from '@dojoengine/torii-client'

//
// Stores all duelists
const useStore = createDojoStore<any>();

//
// Sync all duelists tokens (ERC-721)
// Add only once to a top level component
export function DuelistTokenStoreSync() {
  const { sdk } = useDojoSetup()
  const state = useStore((state) => state)

  useEffect(() => {
    const _fetch = async () => {
      // const response: Token[] = await sdk.getTokens([])
      const response: TokenBalance[] = await sdk.getTokenBalances(
        [], []
        // [addAddressPadding('0x550212d3f13a373dfe9e3ef6aa41fba4124bde63fd7955393f879de19f3f47f')],
        // [addAddressPadding('0x1a94113e8fbecb3d62503d27744b7efad4e1f10dbd8dfad16d9ec00f4fc927d')]
        // [],
      )
      console.log("DuelistTokenStoreSync() =>>>>>>>>>", response)
    }
    // _fetch()
  }, [])

  // useEffect(() => console.log("DuelistStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}

export function useErc721TokensByOwner(contractAddress: BigNumberish, owner: BigNumberish, watch: boolean = false) {
  const state = useStore()
  // const token = useMemo(() =>
  //   tokens.ERC721.find(token => bigintEquals(token.contractAddress, contractAddress)),
  //   [tokens, contractAddress])
  return {
    // token,
  }
}
