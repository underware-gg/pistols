import {  useMemo } from 'react'
import {
  useContractRead,
  // useBalance,
} from '@starknet-react/core'
import { _useBalance } from '@/lib/dojo/fix/starknet_react_core'
import { bigintToHex, isPositiveBigint } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'
import { erc20_abi } from '@/lib/abi'
import { feltToString } from '../starknet'

export const useERC20Balance = (contractAddress: BigNumberish, ownerAddress: BigNumberish, fee: BigNumberish = 0n) => {
  // const { data: balance } = useBalance({
  const balance = _useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch: true,
    refetchInterval: 1_000,
    enabled: (isPositiveBigint(contractAddress) && isPositiveBigint(ownerAddress)),
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

