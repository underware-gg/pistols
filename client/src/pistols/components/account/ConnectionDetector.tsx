import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDojoStatus } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { AccountChangeDetector, ChainChangeDetector } from '@/lib/dojo/ChangeDetector'

export function DojoSetupErrorDetector() {
  const { isError } = useDojoStatus()
  const router = useRouter()
  useEffect(() => {
    if(isError) {
      router.push('/gate')
      // location.href = '/gate'
    }
  }, [isError])
  return <></>
}

export function ConnectionDetector() {
  const { isConnected } = useSelectedChain()
  const { connectOpener } = usePistolsContext()
  const { isGuest, deselect } = useDojoAccount()

  // const router = useRouter()
  const _backToGate = () => {
    // router.push('/gate')
    deselect()
  }

  // on mount, try to connect if not connected
  const [askedToConnect, setAskedToConnect] = useState<boolean>(undefined)
  useEffect(() => {
    if (isConnected !== undefined && askedToConnect === undefined) {
      if (!isConnected && !isGuest) {
        setAskedToConnect(true)
        connectOpener.open()
      } else {
        setAskedToConnect(false)
      }
    }
  }, [isConnected])

  // if was trying to connect and closed modal, deselect burner
  useEffect(() => {
    if (askedToConnect && !connectOpener.isOpen) {
      if (isConnected) {
        setAskedToConnect(false)
      } else {
        deselect()
      }
    }
  }, [askedToConnect, isConnected, connectOpener.isOpen])

  if (isConnected && askedToConnect === false) {
    return (
      <>
        <AccountChangeDetector onChange={_backToGate} />
        <ChainChangeDetector onChange={_backToGate} />
      </>
    )
  }

  return <></>

}
