import { useMemo } from 'react'
import { useContract, useContractWrite, useWaitForTransaction } from '@starknet-react/core'
import { bigintToHex } from '@/lib/utils/types'
import { splitU256 } from '@/lib/utils/starknet'
import { erc20_abi } from '@/lib/abi'
import { BigNumberish } from 'starknet'

export function useERC20Transfer(toAddress: BigNumberish, contractAddress: BigNumberish, amount: bigint) {
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
    data,
    isPending,
  } = useContractWrite({
    calls,
  })

  const transactionHash = useMemo<string>(() => (data?.transaction_hash ?? null), [data])

  const { isLoading, isError, error, data: receipt } = useWaitForTransaction({ hash: transactionHash, watch: true })

  return {
    transferAsync: writeAsync,
    transactionHash,
    receipt,
    isPending: (isPending || isLoading),
    isError,
    error,
  }
}
