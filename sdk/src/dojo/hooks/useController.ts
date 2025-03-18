import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Connector, useAccount } from '@starknet-react/core'
import { ControllerConnector } from '@cartridge/connector'
import { ProfileContextTypeVariant } from '@cartridge/controller'
import { useContractClassHash } from 'src/utils/hooks/useContractClassHash'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { supportedConnetorIds } from 'src/dojo/setup/connectors'
import { bigintEquals, capitalize } from 'src/utils/misc/types'

// sync from here:
// https://github.com/cartridge-gg/controller/blob/main/packages/account-wasm/src/constants.rs
export const CONTROLLER_CLASS_HASH = '0x05f0f2ae9301e0468ca3f9218dadd43a448a71acc66b6ef1a5570bb56cf10c6f'


//-----------------------------------
// not good to use!!!
// (React can call it multiple times)
//
// export const useControllerConnector = (manifest: DojoManifest, rpcUrl: string, namespace: string, descriptions: ContractPolicyDescriptions) => {
//   const connectorRef = useRef<any>(undefined)
//   const controller = useCallback(() => {
//     if (!connectorRef.current) {
//       connectorRef.current = makeControllerConnector(...)
//     }
//     return connectorRef.current
//   }, [manifest, rpcUrl, namespace, descriptions])
//   return {
//     controller,
//   }
// }


//-----------------------------------
// Interact with connected controller
//
export const useConnectedController = () => {
  const { isConnected, connector } = useAccount()

  // connector
  const connectorId = useMemo(() => (connector?.id), [connector])
  const controllerConnector = useMemo(() => (
    connectorId == supportedConnetorIds.CONTROLLER ? connector as unknown as ControllerConnector : undefined
  ), [connector, connectorId])

  // username
  const [username, setUsername] = useState<string>(undefined)
  useEffect(() => {
    setUsername(undefined)
    if (isConnected && controllerConnector) {
      controllerConnector.username().then((n) => setUsername((n || 'unknown').toLowerCase()))
    }
  }, [controllerConnector, isConnected])
  const name = useMemo(() => (username ? capitalize(username) : undefined), [username])

  // callbacks
  const openSettings = useCallback((isConnected && controllerConnector) ? async () => {
    await controllerConnector.controller.openSettings()
  } : null, [controllerConnector, isConnected])
  const openProfile = useCallback((isConnected && controllerConnector) ? async (tab?: ProfileContextTypeVariant) => {
    await controllerConnector.controller.openProfile(tab)
  } : null, [controllerConnector, isConnected])

  return {
    connectorId,
    controllerConnector,
    isControllerConnected: (controllerConnector != null),
    username,
    name,
    openSettings,
    openProfile,
    openInventory: () => openProfile('inventory'),
    openTrophies: () => openProfile('trophies'),
    openAchievements: () => openProfile('achievements'),
    openActivity: () => openProfile('activity'),
  }
}


//-----------------------------------
// find deployed controller account
//
export const useControllerAccount = (contractAddress: BigNumberish) => {
  const { dojoProvider } = useDojoSetup()
  const { classHash, isDeployed } = useContractClassHash(contractAddress, dojoProvider.provider)
  const isControllerAccount = useMemo(() => (classHash && bigintEquals(classHash, CONTROLLER_CLASS_HASH)), [classHash])
  const isKatanaAccount = useMemo(() => (classHash && bigintEquals(classHash, KATANA_CLASS_HASH)), [classHash])
  return {
    classHash,
    isDeployed,
    isControllerAccount,
    isKatanaAccount,
  }
}
