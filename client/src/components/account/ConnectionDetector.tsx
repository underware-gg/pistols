import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDojoStatus } from '@underware_gg/pistols-sdk/dojo'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { AccountChangeDetector, ChainChangeDetector } from '/src/components/starknet/ChangeDetector'

export function DojoSetupErrorDetector() {
  const { isError } = useDojoStatus()
  const navigate = useNavigate()
  useEffect(() => {
    if(isError) {
      navigate('/')
      // location.href = '/'
    }
  }, [isError])
  return <></>
}

export function ConnectionDetector() {
  const { isConnected } = useAccount()
  const { connectOpener } = usePistolsContext()
  const { duelistId, dispatchDuelistId } = useSettings()
  const isMyDuelist = useIsMyDuelist(duelistId)

  // const navigate = useNavigate()
  const _backToGate = () => {
    // navigate('/')
    dispatchDuelistId(0n)
  }

  useEffect(() => {
    if (isMyDuelist === false) _backToGate()
  }, [isMyDuelist])

  // on mount, try to connect if not connected
  const [askedToConnect, setAskedToConnect] = useState<boolean>(undefined)
  useEffect(() => {
    if (isConnected !== undefined && askedToConnect === undefined) {
      if (!isConnected) {
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
        dispatchDuelistId(0n)
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
