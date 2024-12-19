import dotenv from 'dotenv'
import { Chain } from '@starknet-react/chains'
import {
  ChainId,
  DojoChainConfig,
  dojoContextConfig,
  envChainConfig,
} from 'src/dojo/setup/chains'
import { stringToFelt } from 'src/utils/starknet'
import { cleanObject } from 'src/utils/types'

dotenv.config()
export const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID || undefined) as ChainId

export const isChainIdSupported = (chainId: ChainId): boolean => {
  return Object.keys(dojoContextConfig).includes(chainId)
}

export const getDojoChainConfig = (chainId: ChainId): DojoChainConfig => {
  if (!isChainIdSupported(chainId)) {
    return null
  }
  let result = { ...dojoContextConfig[chainId] }
  //
  // derive starknet Chain
  if (!result.chain) {
    result.chain = {
      id: BigInt(stringToFelt(result.chainId)),
      name: result.name,
      network: result.network ?? 'katana',
      testnet: result.testnet ?? true,
      nativeCurrency: result.nativeCurrency,
      rpcUrls: {
        default: { http: [] },
        public: { http: [] },
      },
      explorers: result.explorers,
    } as Chain
  }
  //
  // override env (default chain only)
  if (chainId == defaultChainId) {
    result = {
      ...result,
      ...cleanObject(envChainConfig),
    }
  }
  //
  // use Cartridge RPCs
  if (result.rpcUrl) {
    result.chain.rpcUrls.default.http = [result.rpcUrl]
    result.chain.rpcUrls.public.http = [result.rpcUrl]
  }
  // console.log(result)

  return result
}

export const getStarknetProviderChains = (supportedChainIds: ChainId[]): Chain[] => {
  return supportedChainIds.reduce((acc, chainId) => {
    const dojoChainConfig = getDojoChainConfig(chainId)
    if (dojoChainConfig?.chain) {
      acc.push(dojoChainConfig.chain)
    }
    return acc
  }, [])
}
