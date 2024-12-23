import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useEffectOnce } from '@underware_gg/pistols-sdk/hooks'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'


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

  const { dispatchSelectDuel, dispatchSelectDuelistId } = usePistolsContext()
  const { dispatchSetting, SettingsActions } = useSettings()

  // select duel if url contains 'duel=0x1234'
  useEffectOnce(() => {
    if (typeof duel == 'string') {
      dispatchSelectDuel(duel)
    }
  }, [duel])

  useEffectOnce(() => {
    if (typeof duelist == 'string') {
      dispatchSelectDuelistId(duelist)
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
  const { dispatchTableId } = useSettings()
  useEffect(() => {
    if (tableId) {
      dispatchTableId(tableId)
    }
  }, [tableId])

  const { selectedDuelId, selectedDuelistId } = usePistolsContext()

  useEffect(() => {
    _updateRoute(selectedDuelId ? { duel: bigintToHex(selectedDuelId) } : {})
  }, [selectedDuelId])

  useEffect(() => {
    _updateRoute(selectedDuelistId ? { duelist: selectedDuelistId.toString() } : {})
  }, [selectedDuelistId])

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
