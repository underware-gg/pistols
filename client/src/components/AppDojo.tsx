import React, { ReactNode, useMemo } from 'react'
import { Dojo, ChainId } from '@underware_gg/pistols-sdk/dojo'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import App from '/src/components/App'

export interface AppDojoProps {
  backgroundImage?: string
  chainId?: ChainId
  children: ReactNode
}

export default function AppDojo({
  backgroundImage,
  chainId,
  children
}: AppDojoProps) {
  const dojoAppConfig = useMemo(() => makeDojoAppConfig(chainId), [chainId])
  return (
    <App backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig}>
        {children}
      </Dojo>
    </App>
  );
}
