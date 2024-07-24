import { useMemo } from 'react'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents, useDojoConstants } from '@/lib/dojo/DojoContext'
import { bigintToEntity, isPositiveBigint } from '@/lib/utils/types'
import { feltToString } from "@/lib/utils/starknet"
import { useEntityKeys } from '@/lib/dojo/hooks/useEntityKeys'
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
  const { constants } = useDojoConstants()
  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(constants.MAX_DUELIST_ID)), [duelist_id])

  const { Duelist } = useDojoComponents()
  const duelist: any = useComponentValue(Duelist, bigintToEntity(duelist_id ?? 0n))
  // console.log(`Duelist`, duelist_id, bigintToEntity(duelist_id ?? 0n), duelist)

  const name = useMemo(() => duelist?.name ? feltToString(duelist.name) : null, [duelist])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id])
  const profilePicType = useMemo(() => (duelist?.profile_pic_type ?? null), [duelist])
  const profilePic = useMemo(() => Number(duelist?.profile_pic_uri ?? 0), [duelist])
  const timestamp = useMemo(() => (duelist?.timestamp ?? 0), [duelist])
  const exists = useMemo(() => Boolean(timestamp), [timestamp])

  // scores
  const score = useScore(duelist?.score)

  return {
    isValidDuelistId,
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

