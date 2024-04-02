import React from 'react'
import { StarknetConfig, argent, braavos, jsonRpcProvider } from '@starknet-react/core'
import { Chain } from '@starknet-react/chains'
import { DojoChainConfig } from '@/lib/dojo/setup/config'

export function StarknetProvider({
  dojoChainConfig,
  chains,
  children,
}: {
  dojoChainConfig: DojoChainConfig,
  chains: Chain[]
  children: any
}) {

  function rpc(chain: Chain) {
    const nodeUrl = chain.rpcUrls.default.http[0]
    return {
      nodeUrl,
    }
  }

  const provider = jsonRpcProvider({ rpc })

  const connectors = [
    argent(),
    braavos(),
  ]

  // const [explorer, setExplorer] = useState<ExplorerFactory>(() => starkscan);

  return (
    <StarknetConfig
      chains={chains}
      provider={() => provider(dojoChainConfig.chainConfig)}
      connectors={connectors}
      autoConnect={false}
    // explorer={explorer}
    >
      {children}
    </StarknetConfig>
  )
}
