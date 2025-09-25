import { InterfaceAbi } from 'starknet'
import { Connector } from '@starknet-react/core'
import { ControllerConnector } from '@cartridge/connector'
import type { ControllerOptions, Tokens } from '@cartridge/controller'
import type { SessionPolicies, ContractPolicies, SignMessagePolicy, Method } from '@cartridge/presets'
import { ContractPolicyDescriptions, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { supportedConnetorIds } from 'src/games/pistols/config/networks'
import { DojoManifest } from 'src/games/pistols/config/config'
import { stringToFelt } from 'src/starknet/starknet'
import { bigintToAddress, bigintToHex } from 'src/utils/misc/types'
import { assert } from 'src/utils/misc/math'
import { getContractByName } from '@dojoengine/core'
import { INTERFACE_DESCRIPTIONS } from 'src/games/pistols/generated/constants'



//--------------------------------------
// create a connector for starknet-react
//
// should bever be called twice!
// (create as global const)
//
export const makeControllerConnector = (
  preset_name: string,
  namespace: string,
  chainId: string,
  rpcUrl: string,
  slot: string,
  policies: SessionPolicies | undefined, // if undefined, use preset 
  tokens: Tokens,
): Connector => {
  const options: ControllerOptions = {
    // ProviderOptions
    defaultChainId: bigintToHex(stringToFelt(chainId)),
    chains: [{ rpcUrl }],
    // IFrameOptions
    preset: preset_name,
    // KeychainOptions
    namespace,
    policies,
    slot,
    tokens,
  }
  if (typeof window !== 'undefined') console.log(`-------- ControllerOptions:`, options)//, serialize(options))
  
  // create connector
  let connector: Connector | undefined
  try {
    connector = new ControllerConnector(options) as never as Connector
    assert(connector.id == supportedConnetorIds.CONTROLLER, `ControllerConnector id does not match [${connector.id}/${supportedConnetorIds.CONTROLLER}]`)
  } catch(e) {
    console.warn(`makeControllerConnector() ERROR:`, e)
  }
  return connector
}


const exclusions = [
  'dojo_init',
]


//--------------------------------------
// contract policies
//
// example:
// https://github.com/cartridge-gg/controller/blob/main/packages/keychain/src/components/connect/CreateSession.stories.tsx
// https://github.com/cartridge-gg/presets/blob/419dbda4283e4957db8a14ce202a04fabffea673/configs/eternum/config.json#L379
//
export const makeControllerPolicies = (
  namespace: string,
  manifest: DojoManifest,
  policyDescriptions: ContractPolicyDescriptions,
  messageDescriptions: SignedMessagePolicyDescriptions,
): SessionPolicies => {
  const policies: SessionPolicies = {
    contracts: _makeControllerContractPolicies(manifest, namespace, policyDescriptions),
    messages: _makeControllerSignMessagePolicies(messageDescriptions),
  }
  return policies
}

const _makeControllerContractPolicies = (
  manifest: DojoManifest,
  namespace: string,
  policyDescriptions: ContractPolicyDescriptions,
): ContractPolicies => {
  const contracts: ContractPolicies = {};
  Object.keys(policyDescriptions).forEach((name) => {
    let contract_address
    let methods: Method[] = []
    // --- parse interfaces from abis
    const desc = policyDescriptions[name]
    const c = getContractByName(manifest, namespace, name)
    // console.log(`CI:`, name, desc, c)
    if (c && desc.interfaces) {
      contract_address = c.address
      c.abi.forEach((abi: InterfaceAbi) => {
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
                entrypoint,
                // name: `${i.name}()`,
                description: INTERFACE_DESCRIPTIONS[interfaceName]?.[entrypoint] ?? undefined,
              }
              methods.push(method)
            }
          })
        }
      })
    }
    // --- external contracts
    else if (desc.methods) {
      contract_address = desc.contract_address
      desc.methods?.forEach((m) => {
        methods.push({ ...m })
      })
    }
    // create policy
    if (contract_address && methods.length > 0) {
      contracts[bigintToAddress(contract_address)] = {
        // name: desc.name,
        description: desc.description,
        methods,
      }
    }
  })
  return contracts
}


//--------------------------------------
// sined message policies
//

const _makeControllerSignMessagePolicies = (
  messageDescriptions: SignedMessagePolicyDescriptions,
): SignMessagePolicy[] => {
  const messages: SignMessagePolicy[] = [];
  messageDescriptions.forEach(desc => {
    const msg: SignMessagePolicy = {
      types: {
        ...desc.typedData.types
      },
      primaryType: desc.typedData.primaryType,
      domain: {
        ...desc.typedData.domain
      },
      name: desc.name || desc.typedData.primaryType.split('-').at(1),
      description: desc.description,
    }
    messages.push(msg)
  })
  return messages
}

