import { useCallback, useState } from 'react'
import { BigNumberish, Abi, Account } from 'starknet'
import { useAccount, useTransactionReceipt } from '@starknet-react/core'
import { execute } from 'src/utils/misc/starknet'
import { bigintToHex } from 'src/utils/misc/types'

export function useContractWrite(contractAddress: BigNumberish, abi: Abi, functionName: string, callData: BigNumberish[], fromAccount: Account = null) {
  const { account } = useAccount()
  const [transactionHash, setTransactionHash] = useState<string>(null)
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const write = useCallback(async () => {
    setTransactionHash(null)
    setIsPending(true)
    setIsError(false)
    const { transaction_hash } = await execute(
      fromAccount ?? account,
      bigintToHex(contractAddress),
      abi,
      functionName,
      callData,
    )
    setTransactionHash(transaction_hash)
    setIsPending(false)
    setIsError(!transaction_hash)
  }, [account, fromAccount, contractAddress, functionName, callData])

  const { isLoading, isError: isReverted, error, data: receipt } = useTransactionReceipt({ hash: transactionHash, watch: true })

  return {
    write,
    transactionHash,
    receipt,
    isLoading: (isPending || isLoading),
    isError: (isError || isReverted),
    error,
  }
}
