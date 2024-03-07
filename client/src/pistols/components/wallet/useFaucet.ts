import { useDojo, useDojoAccount } from '@/dojo/DojoContext'
import { useConfig } from '@/pistols/hooks/useConfig'
import { execute } from '@/pistols/utils/starknet'
import { bigintToHex } from '@/pistols/utils/utils'
import { useCallback, useState } from 'react'

export interface FaucetExecuteResult {
  hash: string
}

export interface FaucetInterface {
  faucet: () => Promise<FaucetExecuteResult>
  isPending: boolean
  error?: string
}

export const useFaucet = (): FaucetInterface => {
  // const { dojoProvider } = useDojo()
  const { account } = useDojoAccount()
  const { lordsAddress } = useConfig()

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const faucet = useCallback(
    async (): Promise<FaucetExecuteResult> => {

      setError(undefined)
      setIsPending(true)

      let tx, receipt
      try {
        // tx = await execute(account!, 'lords_mock::lords_mock::lords_mock::LordsMockFaucetImpl', 'faucet', [])
        tx = await execute(account!, bigintToHex(lordsAddress), 'faucet', [])

        receipt = await account!.waitForTransaction(tx.transaction_hash, {
          retryInterval: 200,
        })

      } catch (e: any) {
        setIsPending(false)
        setError(e.toString())
        console.error(e)
        // toast({
        //   message: e.toString(),
        //   duration: 20_000,
        //   isError: true
        // })
        throw Error(e.toString())
      }

      setIsPending(false)

      return {
        hash: tx?.transaction_hash,
      }

    },
    [account, lordsAddress],
  )

  return {
    faucet,
    //
    error,
    isPending,
  }
}

