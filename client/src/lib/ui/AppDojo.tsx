import React from 'react'
import { Dojo, DojoAppConfig } from '@underware_gg/pistols-sdk/dojo'
import App, { AppProps } from '@/lib/ui/App'

export interface AppDojoProps extends AppProps {
  dojoAppConfig: DojoAppConfig,
}

export default function AppDojo({
  headerData = {},
  backgroundImage = null,
  dojoAppConfig,
  children,
}: AppDojoProps) {

  return (
    <App headerData={headerData} backgroundImage={backgroundImage}>
      <Dojo dojoAppConfig={dojoAppConfig}>
        {children}
      </Dojo>
    </App>
  )
}
