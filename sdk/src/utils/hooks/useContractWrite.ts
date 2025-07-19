import { useMemo, useState } from 'react'
import { BigNumberish, Abi, Account } from 'starknet'
import { useAccount, useContract, useSendTransaction } from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'

export function useContractWrite(contractAddress: BigNumberish, abi: Abi, functionName: string, callData: BigNumberish[]) {
  const { account } = useAccount()
  const { dojoProvider } = useDojoSetup()
  const [transactionHash, setTransactionHash] = useState<string>(null)

  const { contract } = useContract({
    abi,
    address: isPositiveBigint(contractAddress) ? bigintToHex(contractAddress) : null,
    provider: dojoProvider.provider,
  });

  const { sendAsync: write, data, isError, error, isPending } = useSendTransaction({
    calls: (account && contract) ? [contract.populate(functionName, callData)] : undefined,
  });

  // const { isLoading, isError: isReverted, error, data: receipt } = useTransactionReceipt({ hash: transactionHash, watch: true })

  return {
    write,
    transactionHash,
    isLoading: isPending,
    isError,
    error,
  }
}
