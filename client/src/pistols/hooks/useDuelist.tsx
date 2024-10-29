import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useEntityKeys } from '@/lib/dojo/hooks/useEntityKeys'
import { useScore } from '@/pistols/hooks/useScore'
import { feltToString } from "@/lib/utils/starknet"
import { bigintToEntity, isPositiveBigint } from '@/lib/utils/types'
import { CONST } from '@/games/pistols/generated/constants'


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
  const isValidDuelistId = useMemo(() => (isPositiveBigint(duelist_id) && BigInt(duelist_id) <= BigInt(CONST.MAX_DUELIST_ID)), [duelist_id])

  const { Duelist } = useDojoComponents()
  const entityId = useMemo(() => bigintToEntity(duelist_id ?? 0n), [duelist_id])
  const duelist: any = useComponentValue(Duelist, entityId)
  // console.log(`Duelist`, duelist_id, entityId, duelist)

  const name = useMemo(() => duelist?.name ? feltToString(duelist.name) : null, [duelist])
  const nameDisplay = useMemo(() => (`${name || 'Duelist'} #${isValidDuelistId ? duelist_id : '?'}`), [name, duelist_id, isValidDuelistId])
  const duelistIdDisplay = useMemo(() => (`Duelist #${isValidDuelistId ? duelist_id : '?'}`), [duelist_id, isValidDuelistId])
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
    duelistIdDisplay,
    exists,
    timestamp,
    profilePicType,
    profilePic,
    score,
  }
}

