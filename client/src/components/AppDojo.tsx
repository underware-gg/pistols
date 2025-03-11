import React, { ReactNode, useMemo } from 'react'
import { useConnect } from '@starknet-react/core'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { Dojo } from '@underware/pistols-sdk/dojo'
import { NetworkId } from '@underware/pistols-sdk/pistols'
import { makeDojoAppConfig, NETWORKS } from '@underware/pistols-sdk/pistols'
import { makePistolsControllerConnector } from '@underware/pistols-sdk/pistols/controller'
import App from '/src/components/App'
import * as ENV from '/src/utils/env'

if (!NETWORKS[ENV.DEFAULT_NETWORK_ID]) {
  throw new Error(`Network config not found for DEFAULT_NETWORK_ID: [${ENV.DEFAULT_NETWORK_ID}]`)
}

const controllerConnector = makePistolsControllerConnector(ENV.DEFAULT_NETWORK_ID)

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
  const dojoAppConfig = useMemo(() => {
    const _networkId = networkId || ENV.DEFAULT_NETWORK_ID;
    return makeDojoAppConfig(_networkId, _networkId == ENV.DEFAULT_NETWORK_ID ? controllerConnector : undefined)
  }, [networkId])
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
