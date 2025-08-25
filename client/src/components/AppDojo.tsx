import React, { ReactNode, useEffect, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import { NetworkId, getNetworkConfig } from '@underware/pistols-sdk/pistols/config'
import { makeDojoAppConfig, makePistolsControllerConnector } from '@underware/pistols-sdk/pistols/dojo'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { Dojo } from '@underware/pistols-sdk/dojo'
import App, { AppProps } from '/src/components/App'
import * as ENV from '/src/utils/env'

if (!getNetworkConfig(ENV.DEFAULT_NETWORK_ID, ENV)) {
  throw new Error(`Network config not found for DEFAULT_NETWORK_ID: [${ENV.DEFAULT_NETWORK_ID}]`)
}

const controllerConnector = makePistolsControllerConnector(ENV.DEFAULT_NETWORK_ID, ENV)

export type AppDojoProps = AppProps & {
  networkId?: NetworkId
  autoConnect?: boolean
}

export default function AppDojo({
  title,
  subtitle,
  backgroundImage,
  networkId,
  autoConnect,
  children,
}: AppDojoProps) {
  const { dojoAppConfig, isDefaultNetwork } = useMemo(() => {
    const _networkId = networkId || ENV.DEFAULT_NETWORK_ID;
    const isDefaultNetwork = (_networkId == ENV.DEFAULT_NETWORK_ID);
    const dojoAppConfig = makeDojoAppConfig(_networkId, isDefaultNetwork ? controllerConnector : undefined)
    return { dojoAppConfig, isDefaultNetwork }
  }, [networkId])
  const env = useMemo(() => (isDefaultNetwork ? ENV : {}), [isDefaultNetwork, ENV])
  return (
    <App title={title} subtitle={subtitle} backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig} env={env}>
        {autoConnect ? <AutoConnect /> : <AutoDisconnect />}
        {children}
      </Dojo>
    </App>
  )
}

function AutoConnect() {
  const { connect, connectors } = useConnect()
  useEffectOnce(() => {
    // console.log('AutoConnect>>>>>', connectors[0]?.id)
    connect({ connector: connectors[0] })
  }, [])
  return <></>
}

function AutoDisconnect() {
  const { isConnected, connector } = useAccount()
  const { connectors } = useConnect()
  const { disconnect } = useDisconnect()
  useEffect(() => {
    // disconnect if not connected to a supported connector
    if (isConnected && connector && !connectors.some(c => c.id === connector?.id)) {
      // console.log('AutoDisconnect>>>>>', isConnected, connector?.id, connectors)
      disconnect()
    }
  }, [isConnected, connector, connectors])
  return <></>
}
