import { useCallback, useState } from 'react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { execute } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/types'
import { Account, AccountInterface } from 'starknet'

export interface FaucetExecuteResult {
  transaction_hash: string
}

export interface FaucetInterface {
  faucet: (fromAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  hasFaucet: boolean
  isPending: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { account } = useDojoAccount()

  const { contractAddress, isMock, abi } = useLordsContract()

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const faucet = useCallback(
    async (fromAccount?: Account): Promise<FaucetExecuteResult> => {
      setError(undefined)
      setIsPending(true)

      const _account = (fromAccount ?? account)

      let transaction_hash, receipt
      try {
        const tx = await execute(
          _account!,
          bigintToHex(contractAddress),
          abi,
          'faucet',
          [],
        )
        transaction_hash = tx.transaction_hash
        receipt = await _account!.waitForTransaction(transaction_hash, {
          retryInterval: 200,
        })
        console.log(`useLordsFaucet(${_account.address}) receipt:`, receipt)
      } catch (e: any) {
        setIsPending(false)
        setError(e.toString())
        console.error(`useLordsFaucet() error:`, e)
        // toast({
        //   message: e.toString(),
        //   duration: 20_000,
        //   isError: true
        // })
      }

      setIsPending(false)

      return {
        transaction_hash,
      }
    }, [account, contractAddress],
  )

  return {
    faucet: isMock ? faucet : null,
    hasFaucet: isMock,
    isPending,
    error,
  }
}

