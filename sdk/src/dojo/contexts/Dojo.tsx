import React, { ReactNode, useEffect, useMemo } from 'react'
import { StarknetDomain, TypedData } from 'starknet'
import { Connector } from '@starknet-react/core'
import { ChainId } from 'src/dojo/setup/chains'
import { Manifest } from '@dojoengine/core'
import { StarknetProvider, useStarknetContext } from 'src/dojo/contexts/StarknetProvider'
import { DojoProvider } from 'src/dojo/contexts/DojoContext'
import { DojoStatus } from 'src/exports/dojo'
import { useSetup } from 'src/dojo/setup/useSetup'

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
  selectedChainId: ChainId
  supportedChainIds: ChainId[]
  namespace: string
  starknetDomain: StarknetDomain
  manifest: DojoManifest,
  mainContractName: string
  controllerConnector: Connector
}

export function Dojo({
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
  const isInitialized = useMemo(() => Boolean(setupResult), [setupResult])
  useEffect(() => console.log(!isInitialized ? '---> DOJO setup...' : '---> DOJO initialized!'), [isInitialized])
  return (
    <DojoProvider value={setupResult}>
      {!isInitialized && <DojoStatus message={'Loading Pistols...'} />}
      {isInitialized && children}
    </DojoProvider>
  )
}
