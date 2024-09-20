import {  useEffect, useMemo, useState } from 'react'
import {
  useContract,
  useBalance,
} from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'
import { erc20_abi, erc20_origami_abi } from '@/lib/abi'
import { feltToString } from '../starknet'

export const useERC20Balance = (contractAddress: BigNumberish, ownerAddress: BigNumberish, fee: BigNumberish = 0n) => {
  const { data: balance } = useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch: true,
    refetchInterval: 1_000,
    enabled: (isPositiveBigint(contractAddress) && isPositiveBigint(ownerAddress)),
  })
  // console.log(`BALANCE`, (bigintToHex(contractAddress)), (bigintToHex(ownerAddress)), balance)

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
  const contractIsValid = useMemo(() => (isPositiveBigint(contractAddress)), [contractAddress])

  const { contract } = useContract({
    abi: erc20_abi,
    address: contractIsValid ? bigintToHex(contractAddress) : null,
  })
  const { contract:contract_origami } = useContract({
    abi: erc20_origami_abi,
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
  useEffect(() => {
    contract?.call('name').then((results) => {
      const name = results?.name ? feltToString(results.name) : null
      if (name)setTokenName(name)
    })
  }, [contract])
  useEffect(() => {
    contract?.call('symbol').then((results) => {
      const symbol = results?.symbol ? feltToString(results.symbol) : null
      if (symbol) setTokenSymbol(symbol)
    })
  }, [contract])

  // try origami (ByteArray)
  useEffect(() => {
    contract_origami?.call('name').then((name) => {
      if (name) setTokenName(name)
    })
  }, [contract_origami])
  useEffect(() => {
    contract_origami?.call('symbol').then((symbol) => {
      if (symbol) setTokenSymbol(symbol)
    })
  }, [contract_origami])

  return {
    tokenName,
    tokenSymbol,
  }
}

