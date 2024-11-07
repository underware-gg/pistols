import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useSdkGetEntity, PistolsQuery } from '@/lib/dojo/hooks/useSdkGet'
import { isPositiveBigint } from '@/lib/utils/types'
import { CONFIG, CONST } from '@/games/pistols/generated/constants'
import * as models from '@/games/pistols/generated/typescript/models.gen'

export type { PistolsQuery }


//--------------------------------
// Config
//
export const useConfigQuery = () => {
  const query = useMemo<PistolsQuery>(() => ({
    pistols: {
      Config: {
        $: {
          where: {
            key: {
              $eq: CONFIG.CONFIG_KEY,
            },
          },
        },
      },
    },
  }), [])
  const { entity, isLoading, refetch } = useSdkGetEntity({ query })
  const config = useMemo(() => entity?.Config as models.Config, [entity])
  return { config, isLoading, refetch }
}


//--------------------------------
// Duelist
//
export const useDuelistByIdQuery = (duelist_id: BigNumberish) => {
  const enabled = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(CONST.MAX_DUELIST_ID)), [duelist_id])
  const query = useMemo<PistolsQuery>(() => ({
    pistols: {
      Duelist: {
        $: {
          where: {
            duelist_id: {
              //@ts-ignore
              $eq: addAddressPadding(duelist_id),
            },
          },
        },
      },
    },
  }), [duelist_id])
  const { entity, isLoading, refetch } = useSdkGetEntity({ query, enabled })
  const duelist = useMemo(() => entity?.Duelist as models.Duelist, [entity])
  useEffect(() => console.log(`useDuelistByIdQuery(${duelist_id})`, duelist), [duelist])
  return { duelist, isLoading, refetch }
}
