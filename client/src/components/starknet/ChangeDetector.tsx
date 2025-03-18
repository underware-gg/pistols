import React, { useEffect, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useStarknetContext } from '@underware/pistols-sdk/dojo'
import { bigintEquals, bigintToHex } from '@underware/pistols-sdk/utils'

export function AccountChangeDetector({
  onChange,
}: {
  onChange?: Function
}) {
  const { address } = useAccount()
  const [currentAccount, setCurrentAccount] = useState<string>(null)
  useEffect(() => {
    if (!currentAccount && address) {
      setCurrentAccount(bigintToHex(address))
    } else if (currentAccount && !bigintEquals(currentAccount, address)) {
      onChange?.()
    }
  }, [currentAccount, address])
  return <></>
}

export function ChainChangeDetector({
  onChange,
}: {
  onChange?: Function
}) {
  const { selectedNetworkId } = useStarknetContext()
  const [currentChainId, setCurrentChainId] = useState<string>(null)
  useEffect(() => {
    if (!currentChainId && selectedNetworkId) {
      setCurrentChainId(selectedNetworkId)
    } else if (currentChainId && currentChainId != selectedNetworkId) {
      onChange?.()
    }
  }, [currentChainId, selectedNetworkId])
  return <></>
}
