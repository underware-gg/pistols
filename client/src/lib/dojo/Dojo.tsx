import React, { ReactNode } from 'react'
import { StarknetDomain, TypedData } from 'starknet'
import { Connector } from '@starknet-react/core'
import { Manifest } from '@dojoengine/core'
import { StarknetProvider, useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { DojoProvider } from '@/lib/dojo/DojoContext'
import { useSetup } from '@/lib/dojo/setup/useSetup'
import { ChainId } from '@/lib/dojo/setup/chains'

// TODO: Manifest is outdated???
// export type DojoManifest = Manifest
export type DojoManifest = Manifest & any

export type ContractPolicyDescriptions = {
  [contract_name: string]: {
    name?: string
    description?: string
    interfaces: string[]
  }
}

export type SignedMessagePolicyDescriptions = {
  name?: string
  description?: string
  typedData: TypedData
}[]

export interface DojoAppConfig {
  namespace: string
  supportedChainIds: ChainId[]
  defaultChainId: ChainId
  starknetDomain: StarknetDomain
  manifests: { [chain_id: string]: DojoManifest | undefined }
  contractPolicyDescriptions: ContractPolicyDescriptions
  controllerConnector: Connector
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
  const { selectedChainConfig } = useStarknetContext()
  const setupResult = useSetup(dojoAppConfig, selectedChainConfig)
  return (
    <DojoProvider value={setupResult}>
      {children}
    </DojoProvider>
  )
}
