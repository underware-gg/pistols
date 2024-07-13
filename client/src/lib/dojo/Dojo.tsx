import React, { ReactNode } from 'react'
import { Manifest } from '@dojoengine/core'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { useSetup } from '@/lib/dojo/setup/useSetup'
import { ChainId } from '@/lib/dojo/setup/chains'
import { useAccount } from '@starknet-react/core'
import { Account } from 'starknet'

export interface DojoAppConfig {
  mainSystemName: string
  supportedChainIds: ChainId[]
  initialChainId: ChainId
  manifests: { [chain_id: string]: Manifest | undefined }
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
  const setupResult = useSetup(dojoAppConfig, selectedChainConfig, account as Account)
  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
