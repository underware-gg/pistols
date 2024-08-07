import React, { useEffect, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'

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
  const { selectedChainId } = useSelectedChain()
  const [currentChainId, setCurrentChainId] = useState<string>(null)
  useEffect(() => {
    if (!currentChainId && selectedChainId) {
      setCurrentChainId(selectedChainId)
    } else if (currentChainId && currentChainId != selectedChainId) {
      onChange?.()
    }
  }, [currentChainId, selectedChainId])
  return <></>
}
