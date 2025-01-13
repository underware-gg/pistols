import { InterfaceAbi, StarknetDomain, StarknetType, TypedData } from 'starknet'
import { Connector } from '@starknet-react/core'
import { ControllerConnector } from '@cartridge/connector'
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
import { SchemaType, UnionOfModelData } from '@dojoengine/sdk'
import { ContractPolicyDescriptions, DojoManifest, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { supportedConnetorIds } from 'src/dojo/setup/connectors'
import { _useConnector } from 'src/fix/starknet_react_core'
import { stringToFelt } from 'src/utils/misc/starknet'
import { bigintToHex } from 'src/utils/misc/types'
import { assert } from 'src/utils/misc/math'



//--------------------------------------
// create a connector for starknet-react
//
// should bever be called twice!
// (create as global const)
//
export const makeControllerConnector = (
  namespace: string,
  chainId: string,
  manifest: DojoManifest,
  rpcUrl: string,
  toriiUrl: string,
  contractPolicyDescriptions: ContractPolicyDescriptions,
  signedMessagePolicyDescriptions: SignedMessagePolicyDescriptions,
  tokens: Tokens,
): Connector => {
  // const policies = _makeControllerPolicyArray(manifest, namespace, descriptions)
  const policies: SessionPolicies = {
    contracts: _makeControllerContractPolicies(manifest, namespace, contractPolicyDescriptions),
    messages: _makeControllerSignMessagePolicies(signedMessagePolicyDescriptions),
  }

  // extract slot service name from rpcUrl
  const slot = /api\.cartridge\.gg\/x\/([^/]+)\/torii/.exec(toriiUrl)?.[1];

  const options: ControllerOptions = {
    // ProviderOptions
    defaultChainId: bigintToHex(stringToFelt(chainId)),
    chains: [{ rpcUrl }],
    // IFrameOptions
    theme: 'pistols',
    colorMode: 'dark',
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
    const connector = new ControllerConnector(options) as never as Connector
    assert(connector.id == supportedConnetorIds.CONTROLLER, `ControllerConnector id does not match [${connector.id}/${supportedConnetorIds.CONTROLLER}]`)
  } catch(e) {
    console.error(`makeControllerConnector() ERROR:`, e)
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
const _makeControllerContractPolicies = (
  manifest: DojoManifest,
  namespace: string,
  descriptions: ContractPolicyDescriptions,
): ContractPolicies => {
  const contracts: ContractPolicies = {};
  manifest?.contracts.forEach((c: any) => {
    const contractName = c.tag.split(`${namespace}-`).at(-1)
    const desc = descriptions[contractName]
    if (desc) {
      let methods: Method[] = []
      // --- abis
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


//--------------------------------------
// sined message policies
//

// same as sdk.generateTypedData()
export const generateTypedData = <T extends SchemaType, M extends UnionOfModelData<T>>(
  domain: StarknetDomain,
  primaryType: string,
  message: M,
  messageFieldTypes: { [name: string]: string },
  enumTypes?: Record<string, StarknetType[]>,
): TypedData => ({
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    [primaryType]: Object.keys(message).map((key) => {
      let result: any = {
        name: key,
        type: messageFieldTypes[key],
      }
      if (enumTypes?.[result.type]) {
        result.contains = result.type
        result.type = "enum"
      }
      return result
    }),
    ...enumTypes,
  },
  primaryType,
  domain,
  message,
})


const _makeControllerSignMessagePolicies = (
  descriptions: SignedMessagePolicyDescriptions,
): SignMessagePolicy[] => {
  const messages: SignMessagePolicy[] = [];
  descriptions.forEach(desc => {
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

