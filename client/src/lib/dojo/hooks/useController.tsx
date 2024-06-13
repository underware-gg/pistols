
import { useEffect, useMemo } from 'react'
import { Connector } from '@starknet-react/core'
import { Manifest } from '@dojoengine/core'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'
import CartridgeConnector from '@cartridge/connector'
import { assert } from '@/lib/utils/math'

import { Policy, ControllerOptions } from "@cartridge/controller";

export const useController = (manifest: Manifest, contractNames?: string[]) => {

  const controller = useMemo(() => {
    const options: ControllerOptions = {}
    const policies: Policy[] = []
    // contracts
    manifest?.contracts.forEach((contract) => {
      const contractName = contract.name.split('::').at(-1)
      if (!contractNames || contractNames.includes(contractName)) {
        // abis
        contract.abi.forEach((abi) => {
          // interfaces
          if (abi.type == 'interface') {
            abi.items.forEach((item) => {
              // functions
              if (item.type == 'function') {
                policies.push({
                  target: contract.address,
                  method: item.name,
                  description: `${contract.name}::${item.name}()`,
                })
              }
            })
          }
        })
      }
    })
    // console.log(`CONTROLLER:`, policies)
    return new CartridgeConnector(policies, options) as never as Connector
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

