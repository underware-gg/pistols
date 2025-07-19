import { useCallback, useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { bigintToU256, ethToWei } from '@underware/pistols-sdk/starknet'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { useLordsContract } from './useTokenContracts'
import { useLordsBalance } from '/src/stores/coinStore'
import { useContractWrite } from '@underware/pistols-sdk/utils/hooks'

export interface FaucetInterface {
  mintLords: () => Promise<boolean | null>
  faucetUrl: string | null
  hasFaucet: boolean
  isMinting: boolean
  error?: string
}

export const useLordsFaucet = (): FaucetInterface => {
  const { account, address } = useAccount()
  const { selectedNetworkConfig } = useDojoSetup()
  const { lordsContractAddress, abi } = useLordsContract()
  const faucetUrl = useMemo(() => (typeof selectedNetworkConfig.lordsFaucet === 'string' ? selectedNetworkConfig.lordsFaucet : null), [selectedNetworkConfig])
  const hasFaucet = useMemo(() => (selectedNetworkConfig.lordsFaucet === true), [selectedNetworkConfig])

  const amount = useMemo(() => bigintToU256(ethToWei(10_000)), [])

  const { write, transactionHash, isLoading, isError, error } = useContractWrite(
    lordsContractAddress,
    abi,
    'mint',
    [bigintToHex(address), bigintToHex(amount.low), bigintToHex(amount.high)],
  )

  const mintLords = useCallback(
    async (): Promise<boolean | null> => {

      if (faucetUrl) {
        window?.open(faucetUrl, '_blank')
        return null
      }
      
      if (!hasFaucet || isLoading || !write) {
        return null
      }
      
      try {
        console.log(`mintLords(${bigintToHex(address)})...`)
        await write();
      } catch (e: any) {
        console.error(`mintLords(${bigintToHex(address)}) error:`, e);
        return false;
      }
      return true;
    }, [write, hasFaucet, faucetUrl, faucetUrl],
  )

  return {
    mintLords,
    faucetUrl,
    hasFaucet,
    isMinting: isLoading,
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
    if (isLoading === false && balance === 0n && hasFaucet && mintLords) {
      mintLords()
    }
  }, [account, isLoading, balance, hasFaucet, mintLords])

  return (<></>)
}
