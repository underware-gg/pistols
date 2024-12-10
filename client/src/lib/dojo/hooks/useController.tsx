import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Connector, useAccount } from '@starknet-react/core'
import { Policy, ControllerOptions, Tokens } from '@cartridge/controller'
import { ControllerConnector } from "@cartridge/connector";
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { ContractInterfaces, DojoManifest } from '@/lib/dojo/Dojo'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useContractClassHash } from '@/lib/utils/hooks/useContractClassHash'
import { BigNumberish } from 'starknet'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { _useConnector } from '../fix/starknet_react_core'
import { assert } from '@/lib/utils/math'
import { useLordsContract } from './useLords'
import { useFameContract } from '@/pistols/hooks/useFame'

// sync from here:
// https://github.com/cartridge-gg/controller/blob/main/packages/account-wasm/src/constants.rs
export const CONTROLLER_CLASS_HASH = '0x05f0f2ae9301e0468ca3f9218dadd43a448a71acc66b6ef1a5570bb56cf10c6f'

const exclusions = [
  'dojo_init',
]

const _makeControllerPolicies = (manifest: DojoManifest, namespace: string, contractInterfaces: ContractInterfaces): Policy[] => {
  const policies: Policy[] = []
  // contracts
  manifest?.contracts.forEach((contract) => {
    const contractName = contract.tag.split(`${namespace}-`).at(-1)
    const interfaces = contractInterfaces[contractName]
    if (interfaces) {
      // abis
      contract.abi.forEach((abi) => {
        // interfaces
        const interfaceName = abi.name.split('::').slice(-1)[0]
        // console.log(`CI:`, contractName, interfaceName)
        if (abi.type == 'interface' && interfaces.includes(interfaceName)) {
          abi.items.forEach((item) => {
            // functions
            const method = item.name
            if (item.type == 'function' && item.state_mutability == 'external' && !exclusions.includes(method)) {
              // console.log(`CI:`, item.name, item)
              policies.push({
                target: contract.address,
                method,
                description: `${contract.tag}::${item.name}()`,
              })
            }
          })
        }
      })
    }
  })
  return policies
}


export const makeControllerConnector = (manifest: DojoManifest, rpcUrl: string, namespace: string, contractInterfaces: ContractInterfaces): Connector => {
  const policies = _makeControllerPolicies(manifest, namespace, contractInterfaces)

  // tokens to display
  // const tokens: Tokens = {
  //   erc20: [
  //     // bigintToHex(lordsContractAddress),
  //     // bigintToHex(fameContractAddress),
  //   ],
  //   // erc721: [],
  // }

  // extract slot service name from rpcUrl
  // const slot = /api\.cartridge\.gg\/x\/([^/]+)\/katana/.exec(rpcUrl)?.[1];

  const options: ControllerOptions = {
    // ProviderOptions
    rpc: rpcUrl,
    // IFrameOptions
    theme: "pistols",
    colorMode: "dark",
    // KeychainOptions
    policies,
    // namespace,
    // slot,
    // tokens,
  }
  // console.log(`-------- ControllerOptions:`, options)
  const connector = new ControllerConnector(options) as never as Connector
  assert(connector.id == supportedConnetorIds.CONTROLLER, `ControllerConnector id does not match [${connector.id}/${supportedConnetorIds.CONTROLLER}]`)
  return connector
}

export const useControllerConnector = (manifest: DojoManifest, rpcUrl: string, namespace: string, contractInterfaces: ContractInterfaces) => {
  const connectorRef = useRef<any>(undefined)
  const controller = useCallback(() => {
    if (!connectorRef.current) {
      connectorRef.current = makeControllerConnector(manifest, rpcUrl, namespace, contractInterfaces)
    }
    return connectorRef.current
  }, [manifest, rpcUrl, namespace, contractInterfaces])
  return {
    controller,
  }
}



//-----------------------------------
// Interact with connected controller
//
export const useConnectedController = () => {
  // const { address, connector } = useAccount()
  const { address } = useAccount()
  const { connector } = _useConnector()
  
  // connector
  const controllerConnector = useMemo(() => (
    connector?.id == supportedConnetorIds.CONTROLLER ? connector as unknown as ControllerConnector : undefined
  ), [connector])

  // username
  const [username, setUsername] = useState<string>(undefined)
  useEffect(() => {
    setUsername(undefined)
    if (address) {
      controllerConnector?.username().then((n) => setUsername(n.toLowerCase())) ?? 'unknown'
    }
  }, [controllerConnector, address])
  const name = useMemo(() => (username ? `${username.slice(0, 1).toUpperCase()}${username.slice(1)}` : undefined), [username])

  // callbacks
  const openSettings = useCallback((address && controllerConnector) ? async () => {
    await controllerConnector.controller.openSettings()
  } : null, [controllerConnector, address])
  const openProfile = useCallback((address && controllerConnector) ? async () => {
    await controllerConnector.controller.openProfile()
  } : null, [controllerConnector, address])

  return {
    controllerConnector,
    username,
    name,
    openSettings,
    openProfile,
  }
}


//-----------------------------------
// find deployed controller account
//
export const useControllerAccount = (contractAddress: BigNumberish) => {
  const { classHash, isDeployed } = useContractClassHash(contractAddress)
  const isControllerAccount = useMemo(() => (classHash && bigintEquals(classHash, CONTROLLER_CLASS_HASH)), [classHash])
  const isKatanaAccount = useMemo(() => (classHash && bigintEquals(classHash, KATANA_CLASS_HASH)), [classHash])
  return {
    classHash,
    isDeployed,
    isControllerAccount,
    isKatanaAccount,
  }
}
