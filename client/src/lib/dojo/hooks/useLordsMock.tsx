import { useCallback, useState } from 'react'
import { useDojo, useDojoAccount } from '@/lib/dojo/DojoContext'
import { Account, AccountInterface } from 'starknet'
import { feltToString } from '../../utils/starknet'
import { useLordsContract } from './useLords'

export interface FaucetExecuteResult {
  hash: string
}

export interface FaucetInterface {
  faucet: (fromAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  hasFaucet: boolean
  isPending: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { setup: { dojoProvider } } = useDojo()
  const { account } = useDojoAccount()

  const { contractAddress, isMock } = useLordsContract()

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const faucet = useCallback(
    async (fromAccount?: Account | AccountInterface): Promise<FaucetExecuteResult> => {

      setError(undefined)
      setIsPending(true)

      const _account = (fromAccount ?? account)

      let tx, receipt
      try {
        //@ts-ignore
        // console.log(`FAUCY:`, feltToString(_account.provider.chainId), _account)
        tx = await dojoProvider.execute(_account!, 'lords_mock', 'faucet', [])
        receipt = await _account!.waitForTransaction(tx.transaction_hash, {
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
    [account, contractAddress],
  )

  return {
    faucet: isMock ? faucet : null,
    hasFaucet: isMock,
    isPending,
    error,
  }
}

