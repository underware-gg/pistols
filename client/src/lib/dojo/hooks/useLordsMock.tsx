import { useCallback, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { bigintToU256, ethToWei, execute, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { Account, AccountInterface } from 'starknet'

export interface FaucetExecuteResult {
  transaction_hash: string
}

export interface FaucetInterface {
  mintLords: (recipientAccount?: Account | AccountInterface) => Promise<FaucetExecuteResult> | null
  faucetUrl: string | null
  hasFaucet: boolean
  isMinting: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { account } = useAccount()
  const { selectedChainConfig } = useStarknetContext()
  const { lordsContractAddress, isMock, abi } = useLordsContract()
  const faucetUrl = useMemo(() => (typeof selectedChainConfig.lordsFaucet === 'string' ? selectedChainConfig.lordsFaucet : null), [selectedChainConfig])
  const hasFaucet = useMemo(() => (selectedChainConfig.lordsFaucet === true), [selectedChainConfig])

  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const mintLords = useCallback(
    async (recipientAccount?: Account): Promise<FaucetExecuteResult> => {

      if (faucetUrl) {
        window?.open(faucetUrl, '_blank')
        return null
      }
      
      if (!hasFaucet || isMinting) {
        return null
      }
      
      setError(undefined)
      setIsMinting(true)

      const _signerAccount = (recipientAccount ?? account)
      const amount = bigintToU256(ethToWei(10_000))

      let transaction_hash, receipt
      try {
        const tx = await execute(
          _signerAccount!,
          bigintToHex(lordsContractAddress),
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
    }, [account, lordsContractAddress, hasFaucet, faucetUrl],
  )

  return {
    mintLords,
    faucetUrl,
    hasFaucet,
    isMinting,
    error,
  }
}

