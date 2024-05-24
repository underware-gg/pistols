import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { usePistolsContext } from './PistolsContext'

export const useRouterStarter = () => {
  const router = useRouter()
  const { duel, duelist, table, debug } = router.query

  const { dispatchSelectDuel, dispatchSelectDuelist } = usePistolsContext()
  const { dispatchSetting, SettingsActions } = useSettingsContext()

  // select duel if url contains 'duel=0x1234'
  useEffectOnce(() => {
    if (typeof duel == 'string') {
      dispatchSelectDuel(duel)
    }
  }, [duel])

  useEffectOnce(() => {
    if (typeof duelist == 'string') {
      dispatchSelectDuelist(duelist)
    }
  }, [duelist])

  useEffectOnce(() => {
    if (typeof table == 'string') {
      dispatchSetting(SettingsActions.TABLE_ID, table)
    }
  }, [table])

  useEffectOnce(() => {
    if (typeof debug == 'string') {
      dispatchSetting(SettingsActions.DEBUG_MODE, parseInt(debug) != 0)
    }
  }, [debug])

  return {}
}
