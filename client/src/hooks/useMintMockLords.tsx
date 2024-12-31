import React, { useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useLordsBalance, useLordsFaucet } from '@underware_gg/pistols-sdk/dojo'

//
// mint mock lords if balance is zero
// (testnetgs only)
//

export const useMintMockLords = () => {
  const { account, address } = useAccount()
  const { balance } = useLordsBalance(address)
  const { mintLords, hasFaucet } = useLordsFaucet()

  useEffect(() => {
    // minted new! go to Game...
    if (address && balance === 0n && hasFaucet && mintLords) {
      mintLords(account)
    }
  }, [address, balance, hasFaucet, mintLords])

  return <></>
}
