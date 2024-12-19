import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BigNumberish } from 'starknet'
import { Connector, useAccount } from '@starknet-react/core'
import { ControllerConnector } from '@cartridge/connector'
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useContractClassHash } from '@underware_gg/pistols-sdk/hooks'
import { bigintEquals, capitalize } from '@underware_gg/pistols-sdk/utils'
import { _useConnector } from '../fix/starknet_react_core'
import { ProfileContextTypeVariant } from '@cartridge/controller';
import { useDojoSetup } from '../DojoContext'

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
//       connectorRef.current = makeControllerConnector(manifest, rpcUrl, namespace, descriptions)
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
  // const { address, connector } = useAccount()
  const { address } = useAccount()
  const { connector } = _useConnector()
  
  // connector
  const connectorId = useMemo(() => (connector?.id), [connector])
  const controllerConnector = useMemo(() => (
    connectorId == supportedConnetorIds.CONTROLLER ? connector as unknown as ControllerConnector : undefined
  ), [connectorId])

  // username
  const [username, setUsername] = useState<string>(undefined)
  useEffect(() => {
    setUsername(undefined)
    if (address) {
      controllerConnector?.username().then((n) => setUsername(n.toLowerCase())) ?? 'unknown'
    }
  }, [controllerConnector, address])
  const name = useMemo(() => (username ? capitalize(username) : undefined), [username])

  // callbacks
  const openSettings = useCallback((address && controllerConnector) ? async () => {
    await controllerConnector.controller.openSettings()
  } : null, [controllerConnector, address])
  const openProfile = useCallback((address && controllerConnector) ? async (tab?: ProfileContextTypeVariant) => {
    await controllerConnector.controller.openProfile(tab)
  } : null, [controllerConnector, address])

  return {
    connectorId,
    controllerConnector,
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
