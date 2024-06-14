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
  mintLords: (recipientAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  faucetUrl: string | null
  isMinting: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { account } = useDojoAccount()
  const { selectedChainConfig } = useStarknetContext()
  const { contractAddress, isMock, abi } = useLordsContract()

  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const mintLords = useCallback(
    async (recipientAccount?: Account): Promise<FaucetExecuteResult> => {
      setError(undefined)
      setIsMinting(true)

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
          retryInterval: 500,
        })
        console.log(`mintLords(${_signerAccount.address}) receipt:`, receipt)
      } catch (e: any) {
        setError(e.toString())
        console.error(`mintLords(${_signerAccount.address}) error:`, e)
        // toast({
        //   message: e.toString(),
        //   duration: 20_000,
        //   isError: true
        // })
      }
      setIsMinting(false)
      return {
        transaction_hash,
      }
    }, [account, contractAddress],
  )

  return {
    isMock,
    mintLords,
    faucetUrl: selectedChainConfig.lordsFaucetUrl ?? null,
    isMinting,
    error,
  }
}

