import React, { ReactNode, useEffect, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import { NetworkId, NETWORKS } from '@underware/pistols-sdk/pistols/config'
import { makeDojoAppConfig, makePistolsControllerConnector } from '@underware/pistols-sdk/pistols/dojo'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { Dojo } from '@underware/pistols-sdk/dojo'
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
  const { dojoAppConfig, isDefaultNetwork } = useMemo(() => {
    const _networkId = networkId || ENV.DEFAULT_NETWORK_ID;
    const isDefaultNetwork = (_networkId == ENV.DEFAULT_NETWORK_ID);
    const dojoAppConfig = makeDojoAppConfig(_networkId, isDefaultNetwork ? controllerConnector : undefined)
    return { dojoAppConfig, isDefaultNetwork }
  }, [networkId])
  return (
    <App backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig} env={isDefaultNetwork ? ENV : {}}>
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
