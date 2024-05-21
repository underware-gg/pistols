import React, { ReactNode } from 'react'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { DojoStatus } from '@/lib/dojo/DojoStatus'
import { useSetup } from '@/lib/dojo/setup/useSetup'
import { CHAIN_ID } from '@/lib/dojo/setup/chainConfig'
import { useAccount } from '@starknet-react/core'
import { Account } from 'starknet'

export interface DojoAppConfig {
  mainSystemName: string
  supportedChainIds: CHAIN_ID[]
  initialChainId: CHAIN_ID
  manifests: { [chain_id: string]: any | undefined }
}

export default function Dojo({
  dojoAppConfig,
  children,
}: {
  dojoAppConfig: DojoAppConfig,
  children: ReactNode
}) {
  return (
    <StarknetProvider dojoAppConfig={dojoAppConfig}>
      <SetupDojoProvider dojoAppConfig={dojoAppConfig}>
        {children}
      </SetupDojoProvider>
    </StarknetProvider>
  )
}

function SetupDojoProvider({
  dojoAppConfig,
  children,
}: {
  dojoAppConfig: DojoAppConfig,
  children: ReactNode
}) {
  // Connected wallet or Dojo Predeployed (master)
  const { account } = useAccount()
  const { selectedChainConfig } = useStarknetContext()
  
  // console.log(`dojoAppConfig:`, dojoAppConfig)
  const setupResult = useSetup(dojoAppConfig, selectedChainConfig, account as Account)

  if (!setupResult) {
    return <DojoStatus message={'Loading Pistols...'} />
  }
  // console.log(`setupResult:`, setupResult)

  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
