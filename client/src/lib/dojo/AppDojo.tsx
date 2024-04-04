import React, { ReactNode, useEffect, useState } from 'react'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { SetupResult, setup } from '@/lib/dojo/setup/setup'
import { HeaderData } from '@/lib/ui/AppHeader'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import App from '@/lib/ui/App'

export interface DojoAppConfig {
  manifest: any,
  supportedChainIds: CHAIN_ID[],
}

export default function AppDojo({
  headerData = {},
  backgroundImage = null,
  dojoAppConfig,
  children,
}: {
  headerData?: HeaderData
  backgroundImage?: string
  dojoAppConfig: DojoAppConfig,
  children: ReactNode
}) {

  return (
    <App headerData={headerData} backgroundImage={backgroundImage}>
      <StarknetProvider supportedChainIds={dojoAppConfig.supportedChainIds}>
        <SetupDojoProvider dojoAppConfig={dojoAppConfig}>
          {children}
        </SetupDojoProvider>
      </StarknetProvider>
    </App>
  );
}

function SetupDojoProvider({
  dojoAppConfig,
  children,
}: {
  dojoAppConfig: DojoAppConfig,
  children: ReactNode
}) {
  const { selectedChainConfig } = useStarknetContext()

  const [setupResult, setSetupResult] = useState<SetupResult>(null)

  useEffect(() => {
    let _mounted = true
    const _setup = async () => {
      const result = await setup(selectedChainConfig, dojoAppConfig.manifest)
      console.log(`Chain [${selectedChainConfig.name}] loaded!`)
      if (_mounted) {
        setSetupResult(result)
      }
    }
    console.log(`DOJO:`, selectedChainConfig)
    if (!selectedChainConfig) {
      throw `Invalid config for chain Id`
    }
    setSetupResult(null)
    _setup()
    return () => {
      _mounted = false
    }
  }, [selectedChainConfig])

  if (!setupResult) {
    return (
      <>
        <h1 className='TitleCase'>Loading Up...</h1>
        <h5><DojoStatus /></h5>
      </>
    )
  }

  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
