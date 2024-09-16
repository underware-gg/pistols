import { useEffect, useMemo, useState } from 'react'
import { Connector, useAccount, useDisconnect } from '@starknet-react/core'
import { Policy, ControllerOptions, PaymasterOptions } from '@cartridge/controller'
import CartridgeConnector from '@cartridge/connector'
import { KATANA_CLASS_HASH } from '@dojoengine/core'
import { ContractInterfaces, DojoManifest } from '@/lib/dojo/Dojo'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import { useContractClassHash } from '@/lib/utils/hooks/useContractClassHash'
import { BigNumberish } from 'starknet'
import { bigintEquals, bigintToHex } from '@/lib/utils/types'
import { stringToFelt } from '@/lib/utils/starknet'

// sync from here:
// https://github.com/cartridge-gg/controller/blob/main/packages/account-wasm/src/constants.rs
export const CONTROLLER_CLASS_HASH = '0x05f0f2ae9301e0468ca3f9218dadd43a448a71acc66b6ef1a5570bb56cf10c6f'

const exclusions = [
  'dojo_init',
]

export const useControllerConnector = (manifest: DojoManifest, rpcUrl: string, nameSpace: string, contractInterfaces: ContractInterfaces) => {
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

  return {
    controller,
  }
}


export const useConnectedController = () => {
  const { connector } = useAccount()
  const controllerConnector = useMemo(() => (
    connector?.id == supportedConnetorIds.CONTROLLER ? connector as unknown as CartridgeConnector : undefined
  ), [connector])
  return controllerConnector
}


export const useControllerUser = () => {
  const { address } = useAccount()
  const controllerConnector = useConnectedController()
  
  // fetch username
  const [username, setUsername] = useState<string>(undefined)
  useEffect(() => {
    setUsername(undefined)
    if (address) {
      controllerConnector?.username().then((n) => setUsername(n))
    }
  }, [address, controllerConnector])

  // fetch delegate account
  // const [delegateAccount, setDelegateAccount] = useState<BigNumberish>(undefined)
  // useEffect(() => {
  //   setDelegateAccount(undefined)
  //   if (address) {
  //     controllerConnector?.delegateAccount().then((n) => setDelegateAccount(n as BigNumberish))
  //   }
  // }, [address, controllerConnector])

  return {
    username,
    // delegateAccount,
  }
}


export const useControllerMenu = () => {
  const { account } = useAccount();
  const { disconnect } = useDisconnect();
  const controllerConnector = useConnectedController()
  const openMenu = async () => {
    if (account) {
      const isConnected = await controllerConnector.openMenu()
      if (!isConnected) {
        disconnect()
      }
    }
  };
  return {
    openMenu,
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
