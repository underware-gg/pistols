import React, { ReactNode, useEffect, useState } from 'react'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { SetupResult, setup } from '@/lib/dojo/setup/setup'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'

export interface DojoConfig {
  manifest: any,
  supportedChainIds: CHAIN_ID[],
}

export default function Dojo({
  dojoConfig,
  children,
}: {
  dojoConfig: DojoConfig,
  children: ReactNode
}) {

  return (
    <StarknetProvider supportedChainIds={dojoConfig.supportedChainIds}>
      <SetupDojoProvider dojoConfig={dojoConfig}>
        {children}
      </SetupDojoProvider>
    </StarknetProvider>
  )
}

function SetupDojoProvider({
  dojoConfig,
  children,
}: {
  dojoConfig: DojoConfig,
  children: ReactNode
}) {
  const { selectedChainConfig } = useStarknetContext()

  const [setupResult, setSetupResult] = useState<SetupResult>(null)

  useEffect(() => {
    let _mounted = true
    const _setup = async () => {
      const result = await setup(selectedChainConfig, dojoConfig.manifest)
      console.log(`Chain [${selectedChainConfig.name}] loaded!`)
      if (_mounted) {
        setSetupResult(result)
      }
    }
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
    return <DojoStatus message={'Loading Pistols...'} />
  }

  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
