import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString } from "@/lib/utils/starknet"
import { useEntityKeys } from '@/lib/dojo/hooks/useEntityKeys'
import { Archetype, ArchetypeNames } from '@/pistols/utils/pistols'
import { BigNumberish } from 'starknet'
import { useScore } from './useScore'


//------------------
// All Duels
//

export const useAllDuelistKeys = () => {
  const { Duelist } = useDojoComponents()
  const duelistKeys: bigint[] = useEntityKeys(Duelist, 'duelist_id')
  return {
    duelistKeys,
    duelistKeysCount: duelistKeys.length,
  }
}


//------------------
// Single Duel
//

export const useDuelist = (duelist_id: BigNumberish) => {
  const { Duelist } = useDojoComponents()
  const duelist: any = useComponentValue(Duelist, bigintToEntity(duelist_id ?? 0n))
  // console.log(`Duelist`, address, bigintToEntity(address ?? 0n), duelist)

  const name = useMemo(() => duelist?.name ? feltToString(duelist.name) : null, [duelist])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${duelist_id}`), [name, duelist_id])
  const profilePicType = useMemo(() => (duelist?.profile_pic_type ?? null), [duelist])
  const profilePic = useMemo(() => Number(duelist?.profile_pic_uri ?? 0), [duelist])
  const timestamp = useMemo(() => (duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  // scores
  const score = useScore(duelist?.score)

  return {
    duelistId: duelist_id,
    name,
    nameDisplay,
    exists,
    timestamp,
    profilePicType,
    profilePic,
    score,
  }
}

