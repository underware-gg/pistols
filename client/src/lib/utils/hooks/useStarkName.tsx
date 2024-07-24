import { useEffect, useState } from 'react'
import { BigNumberish, constants } from 'starknet'
import { StarknetIdNavigator, StarkProfile } from "starknetid.js";
import { useChainConfigProvider } from '@/lib/dojo/hooks/useChain'
import { ChainId } from '@/lib/dojo/setup/chains'
import { bigintToHex, isPositiveBigint } from '@/lib/utils/types'

export const useAddressFromStarkName = (starkName: string) => {
  const provider = useChainConfigProvider(ChainId.SN_MAINNET)

  const [address, setAddress] = useState<string>()
  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        // https://docs.starknet.id/devs/starknetidjs
        const starknetIdNavigator = new StarknetIdNavigator(provider, constants.StarknetChainId.SN_MAIN);
        const result = await starknetIdNavigator.getAddressFromStarkName(starkName);
        if (_mounted) {
          setAddress(isPositiveBigint(result) ? result : undefined)
        }
      } catch { }
    }
    setAddress(undefined)
    if (starkName && provider) {
      _fetch()
    }
    return () => { _mounted = false }
  }, [starkName, provider])

  return {
    address,
  }
}


export const useStarkName = (address: BigNumberish) => {
  const provider = useChainConfigProvider(ChainId.SN_MAINNET)

  const [starkName, setStarkName] = useState<string>()
  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        // https://docs.starknet.id/devs/starknetidjs
        const starknetIdNavigator = new StarknetIdNavigator(provider, constants.StarknetChainId.SN_MAIN);
        const result = await starknetIdNavigator.getStarkName(bigintToHex(address ?? 0));
        if (_mounted) {
          setStarkName(result)
        }
      } catch { }
    }
    setStarkName(undefined)
    if (address && provider) {
      _fetch()
    }
    return () => { _mounted = false }
  }, [address, provider])

  return {
    starkName,
  }
}


export const useStarkProfile = (address: BigNumberish): StarkProfile => {
  const provider = useChainConfigProvider(ChainId.SN_MAINNET)

  const [starkProfile, setStarkProfile] = useState<StarkProfile>()
  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      try {
        // https://docs.starknet.id/devs/starknetidjs
        const starknetIdNavigator = new StarknetIdNavigator(provider, constants.StarknetChainId.SN_MAIN);
        const result = await starknetIdNavigator.getProfileData(bigintToHex(address ?? 0), false);
        // console.log(`PROFILE:`, result)
        if (_mounted) {
          setStarkProfile(result)
        }
      } catch { }
    }
    setStarkProfile(undefined)
    if (address && provider) {
      _fetch()
    }
    return () => { _mounted = false }
  }, [address, provider])

  const { name, profilePicture, discord, twitter, github, proofOfPersonhood } = starkProfile ?? {}

  return {
    name,
    profilePicture,
    discord,
    twitter,
    github,
    proofOfPersonhood,
  }
}

