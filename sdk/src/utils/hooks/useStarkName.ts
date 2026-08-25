import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BigNumberish, constants, Provider } from 'starknet'
import { StarknetIdNavigator, StarkProfile } from "starknetid.js"
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// All three converted from useEffect + useState + a mounted flag. Keys use rpcUrl
// rather than the provider instance, because react-query hashes keys with
// JSON.stringify and a Provider is not serialisable - and rpcUrl is what the
// provider is derived from, so it carries the same information.
//
// The originals swallowed errors with an empty catch, leaving the value
// undefined. react-query records the error and leaves data undefined, so callers
// see the same thing; nothing here surfaces the error, which matches before.

const useIdNavigator = (rpcUrl: string) => useMemo(() => {
  const provider = rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : null
  return provider ? new StarknetIdNavigator(provider, constants.StarknetChainId.SN_MAIN) : null
}, [rpcUrl])

export const useAddressFromStarkName = (starkName: string, rpcUrl: string) => {
  const navigator = useIdNavigator(rpcUrl)
  const { data: address } = useQuery({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'starknetid', 'addressFromStarkName', rpcUrl, starkName],
    enabled: Boolean(starkName) && Boolean(navigator),
    queryFn: async () => {
      // https://docs.starknet.id/devs/starknetidjs
      const result = await navigator.getAddressFromStarkName(starkName)
      return isPositiveBigint(result) ? result : undefined
    },
  })
  return {
    address,
  }
}

export const useStarkName = (address: BigNumberish, rpcUrl: string) => {
  const navigator = useIdNavigator(rpcUrl)
  const { data: starkName } = useQuery({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'starknetid', 'starkName', rpcUrl, String(address)],
    enabled: Boolean(address) && Boolean(navigator),
    queryFn: () => navigator.getStarkName(bigintToHex(address ?? 0)),
  })
  return {
    starkName,
  }
}

export const useStarkProfile = (address: BigNumberish, rpcUrl: string): StarkProfile => {
  const navigator = useIdNavigator(rpcUrl)
  const { data: starkProfile } = useQuery({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'starknetid', 'profile', rpcUrl, String(address)],
    enabled: Boolean(address) && Boolean(navigator),
    queryFn: () => navigator.getProfileData(bigintToHex(address ?? 0), false),
  })

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
