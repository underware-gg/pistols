import { useCallback, useMemo, useState } from 'react'
import { getContractByName } from '@dojoengine/core'
import { useDojo, useDojoAccount } from '@/dojo/DojoContext'
import { bigintEquals } from '@/lib/utils/types'
import { Account, AccountInterface } from 'starknet'
import { feltToString } from '../utils/starknet'

export interface FaucetExecuteResult {
  hash: string
}

export interface FaucetInterface {
  faucet: (fromAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  hasFaucet: boolean
  isPending: boolean
  error?: string
}

export const useLordsFaucet = (contractAddress): FaucetInterface => {
  const { setup: { dojoProvider, manifest } } = useDojo()
  const { account } = useDojoAccount()

  const mockAddress = useMemo(() => {
    const mockContract = getContractByName(manifest, 'lords_mock')
    return mockContract?.address ?? 0
  }, [dojoProvider])
  const hasFaucet = mockAddress && bigintEquals(mockAddress, contractAddress)

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
        console.log(`FAUCY:`, feltToString(_account.provider.chainId), _account)
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
    faucet: hasFaucet ? faucet : null,
    hasFaucet,
    isPending,
    error,
  }
}

