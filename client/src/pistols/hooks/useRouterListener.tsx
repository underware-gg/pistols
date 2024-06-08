import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from './PistolsContext'
import { bigintToHex } from '@/lib/utils/types'


//
// Get current table from route
// (makes urls linkable)
//
export const useRouterTable = () => {
  const router = useRouter()

  const tableId = useMemo(() => {
    if (router.isReady && router.query.main) {
      const _page = router.query.main[0]
      const _slugs = router.query.main.slice(1)
      if (_page == 'tavern') {
        return _slugs[0] ?? null
      }
    }
    return undefined
  }, [router.isReady, router.query])
  // console.log(`ROUTE:`, router.isReady, tableId, router.query.main)

  return {
    tableId
  }
}


//
// read intitial url params and
// (run once when page stards)
//
type PistolsParams = {
  duel?: string
  duelist?: string
  debug?: string
}
export const useRouterStarter = () => {
  const router = useRouter()
  const { duel, duelist, debug }: PistolsParams = router.query

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
    if (typeof debug == 'string') {
      dispatchSetting(SettingsActions.DEBUG_MODE, parseInt(debug) != 0)
    }
  }, [debug])

  return {}
}

//
// listen to game state and shallow route
// (makes urls linkable)
//
export const useRouterListener = () => {
  const router = useRouter()
  const routerPath = useMemo(() => (router.asPath.split('?')[0]), [router.asPath])

  // keep settings updated with slug
  const { tableId } = useRouterTable()
  const { dispatchSetting, SettingsActions } = useSettingsContext()
  useEffect(() => {
    if (tableId) {
      dispatchSetting(SettingsActions.TABLE_ID, tableId)
    }
  }, [tableId])

  const { duelId, duelistAddress } = usePistolsContext()

  useEffect(() => {
    _updateRoute(duelId ? { duel: bigintToHex(duelId) } : {})
  }, [duelId])

  useEffect(() => {
    _updateRoute(duelistAddress ? { duelist: bigintToHex(duelistAddress) } : {})
  }, [duelistAddress])

  const _updateRoute = (params: PistolsParams) => {
    if (routerPath.startsWith('/tavern/')) {
      const url = routerPath + '?' + new URLSearchParams({
        ...params,
      })
      router.push(url, undefined, { shallow: true })
      // console.log(`ROUTING...`, url)
    }
  }

  return {}
}
