import { useCallback, useState } from 'react'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { bigintToUint256, ethToWei, execute } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/types'
import { Account, AccountInterface } from 'starknet'

export interface FaucetExecuteResult {
  transaction_hash: string
}

export interface FaucetInterface {
  isMock: boolean
  faucet: (recipientAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  faucetUrl: string | null
  isPending: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { account } = useDojoAccount()
  const { selectedChainConfig } = useStarknetContext()
  const { contractAddress, isMock, abi } = useLordsContract()

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const faucet = useCallback(
    async (recipientAccount?: Account): Promise<FaucetExecuteResult> => {
      setError(undefined)
      setIsPending(true)

      const _signerAccount = (recipientAccount ?? account)
      const amount = bigintToUint256(ethToWei(10_000))

      let transaction_hash, receipt
      try {
        const tx = await execute(
          _signerAccount!,
          bigintToHex(contractAddress),
          abi!,
          'mint',
          [bigintToHex(_signerAccount.address), bigintToHex(amount.low), bigintToHex(amount.high)],
          // 'faucet',
          // [],
        )
        transaction_hash = tx.transaction_hash
        receipt = await _signerAccount!.waitForTransaction(transaction_hash, {
          retryInterval: 200,
        })
        console.log(`useLordsFaucet(${_signerAccount.address}) receipt:`, receipt)
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
    isMock,
    faucet,
    faucetUrl: selectedChainConfig.lordsFaucetUrl ?? null,
    isPending,
    error,
  }
}

