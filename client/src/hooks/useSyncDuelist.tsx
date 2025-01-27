import { useEffect, useState } from 'react'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'

//
// Switch selected duelist if not owned by player
export const useSyncSelectedDuelist = () => {
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistIds, isLoading } = useDuelistsOfPlayer()

  useEffect(() => {
    if (!isLoading && !duelistIds.includes(duelistId)) {
      dispatchDuelistId(duelistIds[0] ?? 0n)
    }
  }, [duelistId, duelistIds, isLoading])

  return {}
}

//
// Switch to active duelist if it belongs to player
export const useSyncToActiveDuelists = (activeDuelistIds: bigint[]) => {
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistIds, isLoading } = useDuelistsOfPlayer()

  const [isSynced, setIsSynced] = useState(false)
  useEffect(() => {
    // sync only once when duelistIds is loaded
    if (!isLoading && !isSynced) {
      // if not using an active duelist...
      if (!activeDuelistIds.includes(duelistId)) {
        // ...switch to the first active duelist
        for (const id of activeDuelistIds) {
          if (duelistIds.includes(id) && duelistId != id) {
            dispatchDuelistId(id)
            break;
          }
        }
      }
      setIsSynced(true)
    }
  }, [activeDuelistIds, duelistId, duelistIds, isLoading])

  return {
    isSynced
  }
}
