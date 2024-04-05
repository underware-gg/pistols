import React from 'react'
import Dojo, { DojoConfig } from '@/lib/dojo/Dojo'
import App, { AppProps } from '@/lib/ui/App'

export interface AppDojoProps extends AppProps {
  dojoConfig: DojoConfig,
}

export default function AppDojo({
  headerData = {},
  backgroundImage = null,
  dojoConfig,
  children,
}: AppDojoProps) {

  return (
    <App headerData={headerData} backgroundImage={backgroundImage}>
      <Dojo dojoConfig={dojoConfig}>
        {children}
      </Dojo>
    </App>
  )
}
