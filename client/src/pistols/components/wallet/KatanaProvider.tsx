import React from 'react'
import { StarknetConfig, argent, braavos } from '@starknet-react/core'
import { jsonRpcProvider } from '@starknet-react/core'
import { Chain } from '@starknet-react/chains'
import { DojoConfig } from '@dojoengine/core'

export function KatanaProvider({
  dojoConfig,
  children,
}: {
  dojoConfig: DojoConfig,
  children: any
}) {
  const katana: Chain = {
    id: BigInt(420),
    network: 'katana',
    name: 'Katana Devnet',
    nativeCurrency: {
      address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
    rpcUrls: {
      default: {
        http: [],
      },
      public: {
        http: [dojoConfig.rpcUrl],
      },
    },
  }

  function rpc(chain: Chain) {
    return {
      nodeUrl: dojoConfig.rpcUrl,
    }
  }

  const provider = jsonRpcProvider({ rpc })

  const chains = [katana]
  const connectors = [braavos(), argent()]

  return (
    <StarknetConfig
      chains={chains}
      provider={() => provider(katana)}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  )
}
