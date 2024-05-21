import { Chain } from '@starknet-react/chains'
import { PredeployedAccount } from '@dojoengine/create-burner'
import { stringToFelt } from '@/lib/utils/starknet'
import {
  CHAIN_ID,
  DojoChainConfig,
  dojoContextConfig,
  envChainConfig,
} from './chains'

export { CHAIN_ID, type DojoChainConfig }

export const defaultChainId = (process.env.NEXT_PUBLIC_CHAIN_ID || undefined) as CHAIN_ID

export const isChainIdSupported = (chainId: CHAIN_ID): boolean => {
  return Object.keys(dojoContextConfig).includes(chainId)
}

export const getDojoChainConfig = (chainId: CHAIN_ID): DojoChainConfig => {
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
    //
    // replace config from env
    if (chainId == defaultChainId) {
      result = Object.keys(result).reduce((a, k) => {
        if (envChainConfig[k]) {
          a[k] = envChainConfig[k]
        }
        return a
      }, result)
    }
    //
    // use Cartridge RPCs
    if (result.rpcUrl) {
      result.chain.rpcUrls.default.http = [result.rpcUrl]
      result.chain.rpcUrls.public.http = [result.rpcUrl]
    }
    // console.log(result)
  }

  return result
}

export const getStarknetProviderChains = (supportedChainIds: CHAIN_ID[]): Chain[] => {
  return supportedChainIds.reduce((acc, chainId) => {
    const dojoChainConfig = getDojoChainConfig(chainId)
    if (dojoChainConfig?.chain) {
      acc.push(dojoChainConfig.chain)
    }
    return acc
  }, [])
}

export const getChainMasterAccount = (chainId: CHAIN_ID): PredeployedAccount => {
  const dojoChainConfig = dojoContextConfig[chainId]
  if (dojoChainConfig?.masterAddress && dojoChainConfig?.masterPrivateKey) {
    return {
      name: 'Master Account',
      address: dojoChainConfig.masterAddress,
      privateKey: dojoChainConfig.masterPrivateKey,
      active: false,
    }
  }
  return null
}