import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'

export const useRouterListener = () => {
  const router = useRouter()
  const { debug } = router.query

  const { dispatchSetting, SettingsActions } = useSettingsContext()

  // useEffect(() => {
  //   console.log(`Q:`, router.query)
  // }, [router.query])

  useEffect(() => {
    if (typeof debug == 'string') {
      dispatchSetting(SettingsActions.DEBUG_MODE, parseInt(debug) != 0)
    }
  }, [debug])

  return {}
}
