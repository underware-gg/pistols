import React, { ReactNode, useMemo } from 'react'
import { useConnect } from '@starknet-react/core'
import { Dojo, ChainId } from '@underware_gg/pistols-sdk/dojo'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import App from '/src/components/App'
import { useEffectOnce } from '@underware_gg/pistols-sdk/utils'

export interface AppDojoProps {
  backgroundImage?: string
  chainId?: ChainId
  autoConnect?: boolean
  children: ReactNode
}

export default function AppDojo({
  backgroundImage,
  chainId,
  autoConnect,
  children
}: AppDojoProps) {
  const dojoAppConfig = useMemo(() => makeDojoAppConfig(chainId), [chainId])
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
