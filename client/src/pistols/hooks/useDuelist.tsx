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

  const timestamp = useMemo(() => (duelist?.timestamp ?? 0), [duelist])
  const total_duels = useMemo(() => (duelist?.total_duels ?? 0), [duelist])
  const total_wins = useMemo(() => (duelist?.total_wins ?? 0), [duelist])
  const total_losses = useMemo(() => (duelist?.total_losses ?? 0), [duelist])
  const total_draws = useMemo(() => (duelist?.total_draws ?? 0), [duelist])
  const total_honour = useMemo(() => (duelist?.total_honour ?? 0), [duelist])
  const honour = useMemo(() => (duelist?.honour ?? 0), [duelist])
  const honourDisplay = useMemo(() => (total_duels > 0 && honour > 0 ? (parseFloat(duelist.honour) / 10.0).toFixed(1) : '—'), [honour, total_duels])

  return {
    address,
    name,
    profilePic,
    isRegistered,
    timestamp,
    total_duels,
    total_wins,
    total_losses,
    total_draws,
    total_honour,
    honour,
    honourDisplay,
  }
}

