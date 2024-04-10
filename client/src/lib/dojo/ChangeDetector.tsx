import React, { useEffect, useState } from 'react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { useDojoChain } from '@/lib/dojo/hooks/useDojoChain'
import { bigintEquals } from '@/lib/utils/types'

export function AccountChangeDetector({
  onChange,
}: {
  onChange?: Function
}) {
  const { account } = useDojoAccount()
  const [currentAccount, setCurrentAccount] = useState<string>(null)
  useEffect(() => {
    if (!currentAccount && account) {
      setCurrentAccount(account.address)
    } else if (currentAccount && !bigintEquals(currentAccount, account.address)) {
      onChange?.()
    }
  }, [currentAccount, account])
  return <></>
}

export function ChainChangeDetector({
  onChange,
}: {
  onChange?: Function
}) {
  const { selectedChainId } = useDojoChain()
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
