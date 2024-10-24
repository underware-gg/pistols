import { useEffect, useMemo, useState } from 'react'
import { Connector, useAccount } from '@starknet-react/core'
import { Policy, ControllerOptions, PaymasterOptions } from '@cartridge/controller'
import CartridgeConnector from '@cartridge/connector'
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { ContractInterfaces, DojoManifest } from '@/lib/dojo/Dojo'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useContractClassHash } from '@/lib/utils/hooks/useContractClassHash'
import { BigNumberish } from 'starknet'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { assert } from '@/lib/utils/math'
import { stringToFelt } from '@/lib/utils/starknet'

// sync from here:
// https://github.com/cartridge-gg/controller/blob/main/packages/account-wasm/src/constants.rs
export const CONTROLLER_CLASS_HASH = '0x05f0f2ae9301e0468ca3f9218dadd43a448a71acc66b6ef1a5570bb56cf10c6f'

const exclusions = [
  'dojo_init',
]

export const useController = (manifest: DojoManifest, rpcUrl: string, nameSpace: string, contractInterfaces: ContractInterfaces) => {
  const controller = useMemo(() => {
    const paymaster: PaymasterOptions = {
      caller: bigintToHex(stringToFelt("ANY_CALLER")),
    }
    const policies: Policy[] = []
    // contracts
    manifest?.contracts.forEach((contract) => {
      const contractName = contract.tag.split(`${nameSpace}-`).at(-1)
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
    const options: ControllerOptions = {
      paymaster,
      rpc: rpcUrl,
      theme: "pistols",
      colorMode: "dark",
      policies,
    }
    // console.log(`CONTROLLER:`, options)
    return new CartridgeConnector(options) as never as Connector
  }, [manifest])

  useEffect(() => {
    if (controller) {
      assert(controller.id == supportedConnetorIds.CONTROLLER, 'CartridgeConnector id does not match')
    }
  }, [controller])

  return {
    controller,
  }
}


export const useControllerUsername = () => {
  const { address, connector } = useAccount()
  const [username, setUsername] = useState<string>(undefined)
  const controllerConnector = useMemo(() => (connector as unknown as CartridgeConnector), [connector])
  useEffect(() => {
    setUsername(undefined)
    if (address && controllerConnector?.username) {
      controllerConnector.username().then((n) => setUsername(n))
    }
  }, [address, connector])
  return {
    username,
  }
}


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
