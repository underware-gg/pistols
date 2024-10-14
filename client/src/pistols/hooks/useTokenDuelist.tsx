import { useEffect, useMemo, useState } from "react"
import { getContractByName } from "@dojoengine/core"
import { useDojo, useDojoComponents, useDojoSystemCalls } from "@/lib/dojo/DojoContext"
import { bigintToEntity, bigintToHex } from "@/lib/utils/types"
import { useOrigamiERC721BalanceOf, useOrigamiERC721IndexOfOwnerByToken, useOrigamiERC721OwnerOf, useOrigamiERC721TokenOfOwnerByIndex, useOrigamiERC721TotalSupply } from "@/lib/dojo/hooks/useOrigamiERC721"
import { BigNumberish } from "starknet"


export const useTokenContract = () => {
  const components = useDojoComponents()
  const [contractAddress, setTokenContractAddress] = useState('')
  const { setup: { manifest, nameSpace } } = useDojo()
  useEffect(() => {
    const contract = getContractByName(manifest, nameSpace, 'duelist_token');
    setTokenContractAddress(contract?.address ?? '')
  }, [])
  const contractAddressKey = useMemo(() => bigintToEntity(contractAddress), [contractAddress])
  return {
    components,
    contractAddress,
    contractAddressKey,
  }
}


export const useDuelistTokenCount = () => {
  const { contractAddress, components } = useTokenContract()
  const { totalSupply, isPending } = useOrigamiERC721TotalSupply(contractAddress, components)
  return {
    tokenCount: totalSupply ?? 0,
    isPending,
  }
}

export const useDuelistOwner = (token_id: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { owner, isPending } = useOrigamiERC721OwnerOf(contractAddress, token_id, components)
  return {
    owner,
    isPending,
  }
}

export const useDuelistBalanceOf = (address: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { amount, isPending } = useOrigamiERC721BalanceOf(contractAddress, address, components)
  return {
    duelistBalance: amount ?? 0,
    isPending,
  }
}

export const useDuelistOfOwnerByIndex = (address: BigNumberish, index: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { tokenId } = useOrigamiERC721TokenOfOwnerByIndex(contractAddress, address, index, components)
  return {
    duelistId: tokenId,
  }
}

export const useLastDuelistOfOwner = (address: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { tokenId, isPending } = useOrigamiERC721TokenOfOwnerByIndex(contractAddress, address, (duelistBalance - 1), components)
  return {
    lastDuelistId: tokenId,
    isPending,
  }
}

export const useDuelistIndexOfOwner = (address: BigNumberish, token_id: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { index, isPending } = useOrigamiERC721IndexOfOwnerByToken(contractAddress, address, token_id, components)
  return {
    duelistIndex: index,
    isPending,
  }
}


export const useDuelistCalcPrice = (address: BigNumberish) => {
  const [tokenAddress, setTokenAddress] = useState<boolean>()
  const [amount, setAmount] = useState<boolean>()
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { calc_price } = useDojoSystemCalls()
  useEffect(() => {
    if (address && calc_price) {
      calc_price(BigInt(address)).then(v => {
        setTokenAddress(v[0])
        setAmount(v[1])
      }).catch(e => {
        setTokenAddress(undefined)
        setAmount(undefined)
      })
    } else {
      setTokenAddress(undefined)
      setAmount(undefined)
    }
  }, [address, duelistBalance, calc_price])
  return {
    tokenAddress,
    amount,
  }
}

