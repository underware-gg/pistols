import { useEffect, useMemo } from 'react'
import { useContractRead,
  // useBalance,
  UseBalanceProps, Balance,
 } from '@starknet-react/core'
import { bigintToHex } from '@/lib/utils/types'
import { BigNumberish, Uint256 } from 'starknet'
import { erc20_abi } from '@/lib/abi'
import { Uint256ToBigint, feltToString, weiToEth } from '../starknet'

export const useERC20Balance = (contractAddress: BigNumberish, ownerAddress: BigNumberish, fee: BigNumberish = 0n) => {
  // const { data: balance } = useBalance({
  const balance = _useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch: true,
    refetchInterval: 1_000,
    enabled: (Boolean(contractAddress) && Boolean(ownerAddress)),
  })
  // console.log(`BALANCE`, shortAddress(bigintToHex(contractAddress)), shortAddress(bigintToHex(ownerAddress)), balance)

  const noFundsForFee = useMemo(() => {
    if (!fee || !balance) return false
    return (BigInt(balance.value) < BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance?.value ?? 0n,        // wei
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
    noFundsForFee,
  }
}

export const useERC20TokenName = (contractAddress: BigNumberish) => {
  const { data: data_name, isError, isLoading, error } = useContractRead({
    functionName: "name",
    args: [],
    abi: erc20_abi,
    address: bigintToHex(contractAddress),
  })
  const { data: data_symbol } = useContractRead({
    functionName: "symbol",
    args: [],
    abi: erc20_abi,
    address: bigintToHex(contractAddress),
  })
  //@ts-ignore
  const tokenName = useMemo(() => (data_name?.name ? feltToString(data_name?.name) : null), [data_symbol])
  //@ts-ignore
  const tokenSymbol = useMemo(() => (data_symbol?.symbol ? feltToString(data_symbol?.symbol) : null), [data_symbol])
  return {
    tokenName,
    tokenSymbol,
  }
}


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
