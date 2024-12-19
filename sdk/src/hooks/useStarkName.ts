import { useEffect, useMemo, useState } from 'react'
import { BigNumberish, constants, Provider } from 'starknet'
import { StarknetIdNavigator, StarkProfile } from "starknetid.js"
import { bigintToHex, isPositiveBigint } from '../utils'

export const useAddressFromStarkName = (starkName: string, rpcUrl: string) => {
  const provider = useMemo(() => (rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : null), [rpcUrl])

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


export const useStarkName = (address: BigNumberish, rpcUrl: string) => {
  const provider = useMemo(() => (rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : null), [rpcUrl])

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


export const useStarkProfile = (address: BigNumberish, rpcUrl: string): StarkProfile => {
  const provider = useMemo(() => (rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : null), [rpcUrl])

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

