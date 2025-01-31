import React, { ReactNode, useMemo } from 'react'
import { useConnect } from '@starknet-react/core'
import { useEffectOnce } from '@underware_gg/pistols-sdk/utils/hooks'
import { Dojo } from '@underware_gg/pistols-sdk/dojo'
import { NetworkId } from '@underware_gg/pistols-sdk/pistols'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import { controllerConnector } from '@underware_gg/pistols-sdk/pistols/controller'
import App from '/src/components/App'

export interface AppDojoProps {
  backgroundImage?: string
  networkId?: NetworkId
  autoConnect?: boolean
  children: ReactNode
}

export default function AppDojo({
  backgroundImage,
  networkId,
  autoConnect,
  children
}: AppDojoProps) {
  const dojoAppConfig = useMemo(() => makeDojoAppConfig(networkId, controllerConnector), [networkId])
  return (
    <App backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig}>
        {autoConnect && <AutoConnect />}
        {children}
      </Dojo>
    </App>
  )
}

function AutoConnect() {
  const { connect, connectors } = useConnect()
  useEffectOnce(() => {
    connect({ connector: connectors[0] })
  }, [])
  return <></>
}
