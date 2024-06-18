
import { useEffect, useMemo, useCallback, useState } from 'react'
import { Signature, TypedData, Uint256 } from 'starknet'
import {
  useContractRead,
  UseBalanceProps, Balance,
  useAccount,
} from '@starknet-react/core'
import { Uint256ToBigint, weiToEth } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/types'
import { erc20_abi } from '@/lib/abi'


//--------------------------------------
// TEMP
// until @starknet-react/core v3 + starknet v6
// https://github.com/apibara/starknet-react/issues/451
//
enum BlockTag {
  pending = "pending",
  latest = "latest"
}
export const _useBalance = (props: UseBalanceProps): Balance => {
  const { data, isError, isLoading, error } = useContractRead({
    functionName: "balanceOf",
    args: [bigintToHex(props.address)],
    abi: erc20_abi,
    address: bigintToHex(props.token),
    enabled: (BigInt(props.address || 0) > 0n && BigInt(props.token || 0) > 0n),
    // refetchInterval: 2000, // update every 2 seconds
    // update every block
    watch: true,
    blockIdentifier: BlockTag.pending,
  })
  useEffect(() => { if (error) console.warn(`_useBalance() ERROR:`, error) }, [error])
  //@ts-ignore
  const value = useMemo<bigint>(() => (data?.balance ? Uint256ToBigint(data.balance as Uint256) : 0n), [data])
  const formatted = useMemo(() => Number(weiToEth(value)).toString(), [value])
  return {
    decimals: 18,
    symbol: '$?',
    formatted,
    value,
  }
}


export const _useSignTypedData = (typedData: TypedData) => {
  const [isPending, setIsPending] = useState(false)
  const [data, setData] = useState<Signature>(undefined)
  const { account } = useAccount()
  const signTypedData = useCallback(() => {
    if (account && typedData) {
      console.log(`useSignTypedData()...`, typedData)
      setIsPending(true)
      setData(undefined)
      account.signMessage(typedData).then((response) => {
        console.log(`useSignTypedData() RESPONSE:`, response)
        setIsPending(false)
        setData(response)
      }).catch((error) => {
        console.error(`useSignTypedData() ERROR:`, error)
        setIsPending(false)
        setData(null)
      })
    }
  }, [account, typedData])
  return {
    data,
    signTypedData,
    isPending,
  }
}

