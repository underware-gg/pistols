import { useCallback, useMemo, useState } from 'react'
import { useWaitForTransaction } from '@starknet-react/core'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { execute, splitU256 } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/types'
import { erc20_abi } from '@/lib/abi'
import { BigNumberish, Abi } from 'starknet'

export function useDojoContractWrite(contractAddress: BigNumberish, abi: Abi, functionName: string, callData: BigNumberish[]) {
  const { account } = useDojoAccount()
  const [transactionHash, setTransactionHash] = useState<string>(null)
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const write = useCallback(async () => {
    setTransactionHash(null)
    setIsPending(true)
    setIsError(false)
    const { transaction_hash } = await execute(
      account,
      bigintToHex(contractAddress),
      abi,
      functionName,
      callData,
    )
    setTransactionHash(transaction_hash)
    setIsPending(false)
    setIsError(!transaction_hash)
  }, [account, contractAddress, functionName, callData])

  const { isLoading, isError: isReverted, error, data: receipt } = useWaitForTransaction({ hash: transactionHash, watch: true })

  return {
    write,
    transactionHash,
    receipt,
    isPending: (isPending || isLoading),
    isError: (isError || isReverted),
    error,
  }
}