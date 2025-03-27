import { useCallback, useEffect, useMemo, useState } from 'react'
import { Account, AccountInterface } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { bigintToU256, ethToWei, execute } from '@underware/pistols-sdk/utils/starknet'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { useLordsContract } from '/src/hooks/useTokenContract'
import { useLordsBalance } from '../stores/coinStore'

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
  const { selectedNetworkConfig } = useStarknetContext()
  const { lordsContractAddress, abi } = useLordsContract()
  const faucetUrl = useMemo(() => (typeof selectedNetworkConfig.lordsFaucet === 'string' ? selectedNetworkConfig.lordsFaucet : null), [selectedNetworkConfig])
  const hasFaucet = useMemo(() => (selectedNetworkConfig.lordsFaucet === true), [selectedNetworkConfig])

  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const mintLords = useCallback(
    async (recipientAccount?: Account | AccountInterface): Promise<FaucetExecuteResult> => {

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

//
// mint mock lords if balance is zero
// (testnets only)
//

export const useMintMockLords = () => {
  const { account, address } = useAccount()
  const { balance, isLoading } = useLordsBalance(address)
  const { mintLords, hasFaucet } = useLordsFaucet()

  useEffect(() => {
    // minted new! go to Game...
    if (account && isLoading === false && balance === 0n && hasFaucet && mintLords) {
      mintLords(account)
    }
  }, [account, isLoading, balance, hasFaucet, mintLords])

  return (<></>)
}
