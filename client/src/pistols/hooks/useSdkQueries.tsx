import { useEffect, useMemo } from 'react'
import { addAddressPadding, BigNumberish } from 'starknet'
import { useSdkGetEntity, PistolsGetQuery, useSdkGetEntities, EntityResult } from '@/lib/dojo/hooks/useSdkGet'
import { isPositiveBigint } from '@/lib/utils/types'
import { CONFIG, CONST } from '@/games/pistols/generated/constants'
import * as models from '@/games/pistols/generated/typescript/models.gen'
import { stringToFelt } from '@/lib/utils/starknet'

export type { PistolsGetQuery }

// const _filterEntitiesByModel = <T,>(entities: EntityResult[], modelName: string): T[] =>
//   (entities?.reduce((acc, e) => {
//     if (e[modelName]) {
//       acc.push({
//         entityId: e.entityId,
//         ...e[modelName],
//       })
//     }
//     return acc
//   }, []) ?? []) as T[]

const _filterEntitiesByModel = <T,>(entities: EntityResult[], modelName: string): T[] =>
  (entities?.map(e => (e[modelName] as T)) ?? [])

// const _filterEntityByModel = <T,>(entity: EntityResult, modelName: string): T =>
//   (entity?.[modelName] as T ?? undefined)


//--------------------------------
// Config
//
export const useGetConfigQuery = () => {
  const query = useMemo<PistolsGetQuery>(() => ({
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
export const useGetDuelistByIdQuery = (duelist_id: BigNumberish) => {
  const enabled = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(CONST.MAX_DUELIST_ID)), [duelist_id])
  const query = useMemo<PistolsGetQuery>(() => ({
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
  useEffect(() => console.log(`useGetDuelistByIdQuery(${duelist_id})`, duelist), [duelist])
  return { duelist, isLoading, refetch }
}

export const useGetAllDuelistsQuery = () => {
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Duelist: []
    },
  }), [])
  const { entities, isLoading, refetch } = useSdkGetEntities({ query })
  const duelists = useMemo(() => _filterEntitiesByModel<models.Duelist>(entities, 'Duelist'), [entities])
  useEffect(() => console.log(`useGetAllDuelistsQuery()`, duelists), [duelists])
  return { duelists, isLoading, refetch }
}



//--------------------------------
// Challenges
//

export const useGetChallengesByDuelistQuery = (duelist_id: BigNumberish) => {
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            Or: [
              //@ts-ignore
              { duelist_id_a: { $eq: addAddressPadding(duelist_id) } },
              //@ts-ignore
              { duelist_id_b: { $eq: addAddressPadding(duelist_id) } },
            ],
          },
        },
      },
    },
  }), [duelist_id])
  const { entities, isLoading, refetch } = useSdkGetEntities({ query })
  const challenges = useMemo(() => _filterEntitiesByModel<models.Challenge>(entities, 'Challenge'), [entities])
  useEffect(() => console.log(`useGetChallengesByDuelistQuery()`, challenges), [challenges])
  return { challenges, isLoading, refetch }
}

export const useGetChallengesByTableQuery = (tableId: string) => {
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: { $eq: addAddressPadding(stringToFelt(tableId)) },
          },
        },
      },
    },
  }), [tableId])
  const { entities, isLoading, refetch } = useSdkGetEntities({ query })
  const challenges = useMemo(() => _filterEntitiesByModel<models.Challenge>(entities, 'Challenge'), [entities])
  useEffect(() => console.log(`useGetChallengesByTableQuery()`, challenges), [challenges])
  return { challenges, isLoading, refetch }
}



//--------------------------------
// ERC-721 Tokens
//
export const useGetDuelistTokensByOwnerQuery = (contractAddress: BigNumberish, owner: BigNumberish) => {
  const enabled = useMemo(() => (isPositiveBigint(owner)), [owner])
  const query = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      ERC__Balance: {
        $: {
          where: {
            type: {
              $eq: 'ERC721',
            },
          },
        },
      },
      // ERC__Token: {
      //   $: {
      //     where: {
      //       symbol: {
      //         $eq: 'DUELIST',
      //       },
      //     },
      //   },
      // },
    },
  }), [owner])
  const { entities, isLoading, refetch } = useSdkGetEntities({ query, enabled })
  useEffect(() => console.log(`useGetDuelistTokensByOwnerQuery()`, entities), [entities])
  return {}
  // const tokens = useMemo(() => entities?.map(e => (e.ERC__Balance as models.ERC__Balance)), [entities])
  // useEffect(() => console.log(`useGetDuelistTokensByOwnerQuery()`, owner, tokens), [owner, tokens])
  // return { tokens, isLoading, refetch }
}
