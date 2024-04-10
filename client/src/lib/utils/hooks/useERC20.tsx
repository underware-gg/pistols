import { useMemo } from 'react'
import { useBalance, useContract, useContractWrite, useWaitForTransaction } from '@starknet-react/core'
import { bigintToHex } from '@/lib/utils/types'
import { splitU256 } from '@/lib/utils/starknet'
import { erc20_abi } from '@/lib/abi'
import { BigNumberish } from 'starknet'

export const useERC20Balance = (contractAddress: BigNumberish, ownerAddress: BigNumberish, fee: BigNumberish = 0n) => {
  const { data: balance } = useBalance({ address: BigInt(ownerAddress ?? 0n).toString(), token: bigintToHex(contractAddress), watch: true, refetchInterval: 5_000 })

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

export function useERC20Transfer(contractAddress: BigNumberish, toAddress: BigNumberish, amount: bigint) {
  const { contract } = useContract({
    abi: erc20_abi,
    address: bigintToHex(contractAddress),
  })

  const { low, high } = useMemo(() => splitU256(amount), [amount])

  const calls = useMemo(() => {
    if (!toAddress || !contract) return []
    return contract.populateTransaction['transfer']!(bigintToHex(toAddress), { low, high })
  }, [contract, toAddress, low, high])

  const {
    writeAsync,
    write,
    data,
    isPending,
  } = useContractWrite({
    calls,
  })

  const transactionHash = useMemo<string>(() => (data?.transaction_hash ?? null), [data])

  const { isLoading, isError, error, data: receipt } = useWaitForTransaction({ hash: transactionHash, watch: true })

  return {
    transferAsync: writeAsync,
    transfer: write,
    transactionHash,
    receipt,
    isPending: (isPending || isLoading),
    isError,
    error,
  }
}
