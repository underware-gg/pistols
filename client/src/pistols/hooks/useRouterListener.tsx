import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useDojoConstants } from '@/lib/dojo/ConstantsContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from './PistolsContext'
import { bigintToHex } from '@/lib/utils/types'

type PistolsParams = {
  duel?: string
  duelist?: string
  table?: string
  debug?: string
}

//
// read intitial url params and
// (run once when page stards)
//
export const useRouterStarter = () => {
  const { tables } = useDojoConstants()
  const router = useRouter()
  const { duel, duelist, table, debug }: PistolsParams = router.query

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
    if (typeof table == 'string' && Object.values(tables).includes(table)) {
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

//
// listen to game state and shallow route
// (makes urls linkable)
//
export const useRouterListener = () => {
  const router = useRouter()
  const routerPath = useMemo(() => (router.asPath.split('?')[0]), [router.asPath])

  const { tableId } = useSettingsContext()
  const { duelId, duelistAddress } = usePistolsContext()

  useEffect(() => {
    _updateRoute({})
  }, [routerPath, tableId])

  useEffect(() => {
    _updateRoute(duelId ? { duel: bigintToHex(duelId) } : {})
  }, [duelId])

  useEffect(() => {
    _updateRoute(duelistAddress ? { duelist: bigintToHex(duelistAddress) } : {})
  }, [duelistAddress])

  const _updateRoute = (params: PistolsParams) => {
    if (routerPath == '/tavern') {
      const url = routerPath + '?' + new URLSearchParams({
        table: tableId,
        ...params,
      })
      router.push(url, undefined, { shallow: true })
      // console.log(`ROUTING...`, url)
    }
  }

  return {}
}
