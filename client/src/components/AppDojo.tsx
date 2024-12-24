import React from 'react'
import { Dojo, DojoAppConfig } from '@underware_gg/pistols-sdk/dojo'
import App, { AppProps } from '@/components/App'

export interface AppDojoProps extends AppProps {
  dojoAppConfig: DojoAppConfig,
}

export default function AppDojo({
  backgroundImage = null,
  dojoAppConfig,
  children,
}: AppDojoProps) {

  return (
    <App backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig}>
        {children}
      </Dojo>
    </App>
  )
}
