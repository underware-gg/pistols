import { useDojo, useDojoAccount } from '@/dojo/DojoContext'
import { useConfig } from '@/pistols/hooks/useConfig'
import { execute } from '@/pistols/utils/starknet'
import { bigintToHex } from '@/pistols/utils/utils'
import { getContractByName } from '@dojoengine/core'
import { useCallback, useMemo, useState } from 'react'

export interface FaucetExecuteResult {
  hash: string
}

export interface FaucetInterface {
  faucet: () => Promise<FaucetExecuteResult> | null
  hasFaucet: boolean
  isPending: boolean
  error?: string
}

export const useFaucet = (): FaucetInterface => {
  const { dojoProvider } = useDojo()
  const { account } = useDojoAccount()
  const { lordsAddress } = useConfig()

  const mockAddress = useMemo(() => {
    const mockContract = getContractByName(dojoProvider.manifest, 'lords_mock')
    return BigInt(mockContract?.address ?? 0)
  }, [dojoProvider])
  const hasFaucet = (mockAddress && mockAddress == BigInt(lordsAddress))

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const faucet = useCallback(
    async (): Promise<FaucetExecuteResult> => {

      setError(undefined)
      setIsPending(true)

      let tx, receipt
      try {
        tx = await dojoProvider.execute(account!, 'lords_mock', 'faucet', [])
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
    faucet: hasFaucet ? faucet : null,
    hasFaucet,
    isPending,
    error,
  }
}

