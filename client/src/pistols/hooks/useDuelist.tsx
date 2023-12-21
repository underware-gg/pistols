import { useMemo } from 'react'
import { Entity, HasValue, Has, getComponentValue } from '@dojoengine/recs'
import { useComponentValue, useEntityQuery } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity, feltToString } from '@/pistols/utils/utils'
import { useEntityKeys } from '@/pistols/hooks/useEntityKeysQuery'


//------------------
// All Duels
//

export const useAllDuelistIds = () => {
  const { Duelist } = useDojoComponents()
  const duelistIds: bigint[] = useEntityKeys(Duelist, 'address')
  return {
    duelistIds,
  }
}


//------------------
// Single Duel
//

export const useDuelist = (address: bigint | string) => {
  const { Duelist } = useDojoComponents()
  const duelist: any = useComponentValue(Duelist, bigintToEntity(address))
  // console.log(`Duelist`, address, bigintToEntity(address), duelist)
  const name = useMemo(() => feltToString(duelist?.name ?? 0n), [duelist])
  const profilePic = useMemo(() => (duelist?.profile_pic ?? 0), [duelist])
  const isRegistered = useMemo(() => (name.length > 0), [name])
  return {
    address,
    name,
    profilePic,
    isRegistered,
  }
}
