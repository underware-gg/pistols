import React, { ReactNode } from 'react'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { useSetup } from '@/lib/dojo/setup/useSetup'
import { CHAIN_ID } from '@/lib/dojo/setup/chains'
import { useAccount } from '@starknet-react/core'

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
  // Connected wallet or Dojo Predeployed (master)
  const { account } = useAccount()
  const { selectedChainConfig } = useStarknetContext()
  
  const setupResult = useSetup(selectedChainConfig, dojoConfig.manifest, account)

  if (!setupResult) {
    return <DojoStatus message={'Loading Pistols...'} />
  }

  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
