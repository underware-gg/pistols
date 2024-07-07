import { useEffect, useMemo, useState } from "react"
import { getContractByName } from "@dojoengine/core"
import { useDojo, useDojoComponents, useDojoSystemCalls } from "@/lib/dojo/DojoContext"
import { bigintToEntity, bigintToHex } from "@/lib/utils/types"
import { useOrigamiERC721BalanceOf, useOrigamiERC721IndexOfOwnerByToken, useOrigamiERC721OwnerOf, useOrigamiERC721TokenOfOwnerByIndex, useOrigamiERC721TotalSupply } from "@/lib/dojo/hooks/useOrigamiERC721"
import { BigNumberish } from "starknet"


export const useTokenContract = () => {
  const components = useDojoComponents()
  const [contractAddress, setTokenContractAddress] = useState('')
  const { setup: { manifest } } = useDojo()
  useEffect(() => {
    const contract = getContractByName(manifest, 'token_duelist');
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
  const { totalSupply } = useOrigamiERC721TotalSupply(contractAddress, components)
  return {
    tokenCount: totalSupply ?? 0,
  }
}

export const useDuelistOwner = (token_id: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { owner } = useOrigamiERC721OwnerOf(contractAddress, token_id, components)
  return {
    owner,
  }
}

export const useDuelistBalanceOf = (address: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { amount } = useOrigamiERC721BalanceOf(contractAddress, address, components)
  return {
    duelistBalance: amount ?? 0,
  }
}

export const useDuelistOfOwnerByIndex = (address: BigNumberish, index: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { tokenId } = useOrigamiERC721TokenOfOwnerByIndex(contractAddress, address, index, components)
  return {
    duelistId: tokenId,
  }
}

export const useDuelistIndexOfOwner = (address: BigNumberish, token_id: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { index } = useOrigamiERC721IndexOfOwnerByToken(contractAddress, address, token_id, components)
  return {
    duelistIndex: index,
  }
}


export const useCanMintDuelist = (address: BigNumberish) => {
  const [canMint, setCanMint] = useState<boolean>()
  const { contractAddress } = useTokenContract()
  const { duelistBalance } = useDuelistBalanceOf(address)
  const { can_mint } = useDojoSystemCalls()
  useEffect(() => {
    if (address && contractAddress) {
      can_mint(BigInt(address), BigInt(contractAddress)).then(v => {
        setCanMint(v)
      }).catch(e => {
        setCanMint(false)
      })
    } else {
      setCanMint(false)
    }
  }, [address, contractAddress, duelistBalance])
  return {
    canMint,
  }
}

