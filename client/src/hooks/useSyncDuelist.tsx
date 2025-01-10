import { useEffect } from 'react'
import { useSettings } from '/src/hooks/SettingsContext'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'

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
