import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Connector, useAccount } from '@starknet-react/core'
import {
  ControllerOptions,
  SessionPolicies,
  ContractPolicies,
  ContractPolicy,
  SignMessagePolicy,
  Policy,
  Tokens,
  Method,
} from '@cartridge/controller'
import { ControllerConnector } from "@cartridge/connector";
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { ContractPolicyDecriptions, DojoManifest } from '@/lib/dojo/Dojo'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useContractClassHash } from '@/lib/utils/hooks/useContractClassHash'
import { BigNumberish } from 'starknet'
import { bigintEquals, capitalize } from '@/lib/utils/types'
import { _useConnector } from '../fix/starknet_react_core'
import { assert } from '@/lib/utils/math'

// sync from here:
// https://github.com/cartridge-gg/controller/blob/main/packages/account-wasm/src/constants.rs
export const CONTROLLER_CLASS_HASH = '0x05f0f2ae9301e0468ca3f9218dadd43a448a71acc66b6ef1a5570bb56cf10c6f'

const exclusions = [
  'dojo_init',
]

const _makeControllerPolicyArray = (
  manifest: DojoManifest,
  namespace: string,
  descriptions: ContractPolicyDecriptions,
): Policy[] => {
  const policies: Policy[] = []
  manifest?.contracts.forEach((c) => {
    const contractName = c.tag.split(`${namespace}-`).at(-1)
    const contract = descriptions[contractName]
    if (contract) {
      // --- abis
      c.abi.forEach((abi) => {
        // --- interfaces
        const interfaceName = abi.name.split('::').slice(-1)[0]
        // console.log(`CI:`, contractName, interfaceName)
        if (abi.type == 'interface' && contract.interfaces.includes(interfaceName)) {
          abi.items.forEach((i) => {
            // --- functions
            const method = i.name
            if (i.type == 'function' && i.state_mutability == 'external' && !exclusions.includes(method)) {
              // console.log(`CI:`, item.name, item)
              policies.push({
                target: c.address,
                method,
                // description: `${c.tag}::${i.name}()`,
              })
            }
          })
        }
      })
    }
  })
  return policies
}

const _makeControllerContractPolicies = (
  manifest: DojoManifest,
  namespace: string,
  descriptions: ContractPolicyDecriptions,
): ContractPolicies => {
  const contracts: ContractPolicies = {};
  manifest?.contracts.forEach((c) => {
    const contractName = c.tag.split(`${namespace}-`).at(-1)
    const desc = descriptions[contractName]
    if (desc) {
      let methods: Method[] = []
      // --- abis
      c.abi.forEach((abi) => {
        // --- interfaces
        const interfaceName = abi.name.split('::').slice(-1)[0]
        // console.log(`CI:`, contractName, interfaceName)
        if (abi.type == 'interface' && desc.interfaces.includes(interfaceName)) {
          // --- functions
          abi.items.forEach((i) => {
            const entrypoint = i.name
            if (i.type == 'function' && i.state_mutability == 'external' && !exclusions.includes(entrypoint)) {
              // console.log(`CI:`, item.name, item)
              const method = {
                // name: `${i.name}()`,
                // description: `${c.tag}::${i.name}()`,
                entrypoint,
              }
              methods.push(method)
            }
          })
        }
      })
      if (methods.length > 0) {
        contracts[c.address] = {
          name: desc.name,
          description: desc.description,
          methods,
        }
      }
    }
  })
  return contracts
}


export const makeControllerConnector = (
  manifest: DojoManifest,
  rpcUrl: string,
  namespace: string,
  descriptions: ContractPolicyDecriptions,
): Connector => {
  // const policies = _makeControllerPolicyArray(manifest, namespace, descriptions)
  const policies: SessionPolicies = {
    contracts: _makeControllerContractPolicies(manifest, namespace, descriptions),
    messages: [],
  }

  // tokens to display
  // const tokens: Tokens = {
  //   erc20: [
  //     // bigintToHex(lordsContractAddress),
  //     // bigintToHex(fameContractAddress),
  //   ],
  //   // erc721: [],
  // }

  // extract slot service name from rpcUrl
  const slot = /api\.cartridge\.gg\/x\/([^/]+)\/katana/.exec(rpcUrl)?.[1];

  const options: ControllerOptions = {
    // ProviderOptions
    rpc: rpcUrl,
    // IFrameOptions
    theme: "pistols",
    colorMode: "dark",
    // KeychainOptions
    namespace,
    policies,
    slot,
    // tokens,
  }
  console.log(`-------- ControllerOptions:`, options)
  const connector = new ControllerConnector(options) as never as Connector
  assert(connector.id == supportedConnetorIds.CONTROLLER, `ControllerConnector id does not match [${connector.id}/${supportedConnetorIds.CONTROLLER}]`)
  return connector
}

// export const useControllerConnector = (manifest: DojoManifest, rpcUrl: string, namespace: string, descriptions: ContractPolicyDecriptions) => {
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
  const openProfile = useCallback((address && controllerConnector) ? async () => {
    await controllerConnector.controller.openProfile()
  } : null, [controllerConnector, address])

  return {
    connectorId,
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
