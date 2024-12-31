import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useEffectOnce, bigintToDecimal, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext } from '/src/hooks/PistolsContext'

//
// listen to game state and shallow route
// (makes urls linkable)
//
export const useRouterListener = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // initialize context from url
  // (only once when mounted)
  const { dispatchTableId } = useSettings()
  const { dispatchSelectDuel, dispatchSelectDuelistId, dispatchSelectPlayerAddress } = usePistolsContext()
  useEffectOnce(() => {
    if (searchParams.get('table')) {
      dispatchTableId(searchParams.get('table'))
    }
    if (searchParams.get('duel')) {
      dispatchSelectDuel(searchParams.get('duel'))
    }
    if (searchParams.get('duelist')) {
      dispatchSelectDuelistId(searchParams.get('duelist'))
    }
    if (searchParams.get('player')) {
      dispatchSelectPlayerAddress(searchParams.get('player'))
    }
  }, [])

  // add params to url to make shareable urls
  const { selectedDuelId, selectedDuelistId, selectedPlayerAddress } = usePistolsContext()
  useEffect(() => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev)
      if (selectedDuelId) {
        params.set('duel', bigintToDecimal(selectedDuelId))
      } else {
        params.delete('duel')
      }
      if (selectedDuelistId) {
        params.set('duelist', bigintToDecimal(selectedDuelistId))
      } else {
        params.delete('duelist')
      }
      if (selectedPlayerAddress) {
        params.set('player', bigintToHex(selectedPlayerAddress))
      } else {
        params.delete('player')
      }
      return params
    })
  }, [selectedDuelId, selectedDuelistId, selectedPlayerAddress])

  return {}
}
