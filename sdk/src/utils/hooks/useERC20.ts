import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useContract, useBalance } from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { weiToEth } from 'src/starknet/starknet'
import { erc20_abi } from 'src/abis/abis'

export const useERC20Balance = (
  contractAddress: BigNumberish,
  ownerAddress: BigNumberish,
  fee: BigNumberish = 0n,
  watch: boolean = false,
) => {
  const isValid = useMemo(() => (isPositiveBigint(contractAddress) && isPositiveBigint(ownerAddress)), [contractAddress, ownerAddress])
  const { data: balance, isLoading } = useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch,
    refetchInterval: watch ? 1_000 : undefined,
    enabled: isValid,
  })
  const balance_eth = useMemo(() => weiToEth(balance?.value ?? 0n), [balance])
  // console.log(`BALANCE`, (bigintToHex(contractAddress)), (bigintToHex(ownerAddress)), balance)

  const canAffordFee = useMemo(() => {
    if (balance == null || !fee) return undefined
    return (BigInt(balance.value) >= BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance?.value ?? 0n,        // wei
    balance_eth,                          // eth
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
    canAffordFee,
    isLoading,
    isValid,
  }
}

export const useERC20TotalSupply = (
  contractAddress: BigNumberish,
  watch: boolean = false,
) => {
  const contractIsValid = useMemo(() => (isPositiveBigint(contractAddress)), [contractAddress])

  const { contract } = useContract({
    abi: erc20_abi,
    address: contractIsValid ? bigintToHex(contractAddress) : null,
  })

  const [totalSupply, setTotalSupply] = useState<bigint>(null)

  useEffect(() => {
    if (!contractIsValid) {
      setTotalSupply(null)
    }
  }, [contractIsValid])

  // try ByteArray
  useEffect(() => {
    contract?.call('total_supply').then((supply: bigint) => {
      if (supply) setTotalSupply(supply)
    })
  }, [contract])

  return {
    totalSupply,
  }
}

export const useERC20TokenName = (contractAddress: BigNumberish) => {
  const contractIsValid = useMemo(() => (isPositiveBigint(contractAddress)), [contractAddress])

  const { contract } = useContract({
    abi: erc20_abi,
    address: contractIsValid ? bigintToHex(contractAddress) : null,
  })

  const [tokenName, setTokenName] = useState<string>(null)
  const [tokenSymbol, setTokenSymbol] = useState<string>(null)

  useEffect(() => {
    if (!contractIsValid) {
      setTokenName(null)
      setTokenSymbol(null)
    }
  }, [contractIsValid])
  
  // try felt
  // useEffect(() => {
  //   contract?.call('name').then((results) => {
  //     const name = results?.name ? feltToString(results.name) : null
  //     if (name)setTokenName(name)
  //   })
  // }, [contract])
  // useEffect(() => {
  //   contract?.call('symbol').then((results) => {
  //     const symbol = results?.symbol ? feltToString(results.symbol) : null
  //     if (symbol) setTokenSymbol(symbol)
  //   })
  // }, [contract])

  // try ByteArray
  useEffect(() => {
    contract?.call('name').then((name: string) => {
      if (name) setTokenName(name)
    })
  }, [contract])
  useEffect(() => {
    contract?.call('symbol').then((symbol: string) => {
      if (symbol) setTokenSymbol(symbol)
    })
  }, [contract])

  return {
    tokenName,
    tokenSymbol,
  }
}

