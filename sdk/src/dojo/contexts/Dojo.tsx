import React, { ReactNode, useEffect, useMemo } from 'react'
import { StarknetDomain, TypedData } from 'starknet'
import { Connector } from '@starknet-react/core'
import { Method } from '@cartridge/controller'
import { NetworkId } from 'src/games/pistols/config/networks'
import { StarknetProvider, useStarknetContext } from 'src/dojo/contexts/StarknetProvider'
import { DojoManifest } from 'src/games/pistols/config/config'
import { DojoProvider } from 'src/dojo/contexts/DojoContext'
import { DojoStatus } from 'src/dojo/contexts/DojoStatus'
import { useSetup } from 'src/dojo/setup/useSetup'

export type ContractPolicyDescriptions = {
  [contract_name: string]: {
    name: string            // display name of the contract
    description: string     // description of the contract
    // for dojo contracts (contract_name)
    interfaces?: string[]   // parse interfaces from abi
    // for external contracts
    contract_address?: string
    methods?: Method[]      // parse methods from abi
  }
}

export type SignedMessagePolicyDescriptions = {
  name?: string
  description?: string
  typedData: TypedData
}[]

export interface DojoAppConfig {
  selectedNetworkId: NetworkId
  namespace: string
  manifest: DojoManifest,
  mainContractName: string
  starknetDomain: StarknetDomain
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
  const { selectedNetworkConfig } = useStarknetContext()
  const setupResult = useSetup(dojoAppConfig, selectedNetworkConfig)
  const isInitialized = useMemo(() => Boolean(setupResult), [setupResult])
  useEffect(() => console.log(!isInitialized ? '---> DOJO setup...' : '---> DOJO initialized!'), [isInitialized])
  return (
    <DojoProvider value={setupResult}>
      {!isInitialized && <DojoStatus message={'Loading Pistols...'} />}
      {isInitialized && children}
    </DojoProvider>
  )
}
