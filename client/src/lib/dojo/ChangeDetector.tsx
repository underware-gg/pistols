import React, { useEffect, useState } from 'react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'

export function AccountChangeDetector({
  onChange,
}: {
  onChange?: Function
}) {
  const { accountAddress } = useDojoAccount()
  const [currentAccount, setCurrentAccount] = useState<string>(null)
  useEffect(() => {
    if (!currentAccount && accountAddress) {
      setCurrentAccount(bigintToHex(accountAddress))
    } else if (currentAccount && !bigintEquals(currentAccount, accountAddress)) {
      onChange?.()
    }
  }, [currentAccount, accountAddress])
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
