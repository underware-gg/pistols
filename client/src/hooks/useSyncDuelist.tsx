import { useEffect } from 'react'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'

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
export const useSyncToActiveDuelist = (activeDuelistId: bigint) => {
  const { duelistId, dispatchDuelistId } = useSettings()
  const { duelistIds, isLoading } = useDuelistsOfPlayer()

  useEffect(() => {
    if (
      !isLoading &&
      activeDuelistId &&
      duelistIds.includes(activeDuelistId) &&
      duelistId != activeDuelistId
    ) {
      dispatchDuelistId(activeDuelistId)
    }
  }, [activeDuelistId, duelistId, duelistIds, isLoading])

  return {}
}
