import { InterfaceAbi, StarknetDomain, StarknetType, TypedData } from 'starknet'
import { Connector } from '@starknet-react/core'
import { ControllerConnector } from '@cartridge/connector'
import type { ControllerOptions, Tokens } from '@cartridge/controller'
import type { SessionPolicies, ContractPolicies, SignMessagePolicy, Method } from '@cartridge/presets'
import { SchemaType, UnionOfModelData } from '@dojoengine/sdk'
import { ContractPolicyDescriptions, DojoManifest, SignedMessagePolicyDescriptions } from 'src/dojo/contexts/Dojo'
import { supportedConnetorIds } from 'src/dojo/setup/connectors'
import { formatQueryValue } from 'src/dojo/hooks/useSdkEntities'
import { stringToFelt } from 'src/utils/misc/starknet'
import { bigintToHex } from 'src/utils/misc/types'
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
  toriiUrl: string,
  policies: SessionPolicies | undefined, // if undefined, use preset 
  tokens: Tokens,
): Connector => {
  // extract slot service name from rpcUrl
  const slot = /api\.cartridge\.gg\/x\/([^/]+)\/torii/.exec(toriiUrl)?.[1];

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
    const desc = policyDescriptions[name]
    const c = getContractByName(manifest, namespace, name)
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
              entrypoint,
              // name: `${i.name}()`,
              description: INTERFACE_DESCRIPTIONS[interfaceName]?.[entrypoint] ?? undefined,
            }
            methods.push(method)
          }
        })
      }
    })
    if (methods.length > 0) {
      contracts[formatQueryValue(c.address)] = {
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

