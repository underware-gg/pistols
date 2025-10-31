import { useEffect, useMemo } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { getPlayernameFromAddress } from '/src/stores/playerStore'
import { SceneName  } from '/src/data/assetsTypes'

export const MenuLabels: Partial<Record<SceneName, string>> = {
  [SceneName.Door]: 'Door',
  [SceneName.Tavern]: 'Tavern',
  [SceneName.Duelists]: 'Duelists',
  [SceneName.Matchmaking]: 'Matchmaking',
  [SceneName.DuelsBoard]: 'Duels',
  [SceneName.Graveyard]: 'Catacombs',
  [SceneName.Profile]: 'Profile',
}

export const useSetPageTitle = () => {
  const { selectedDuelId, selectedDuelistId, selectedPlayerAddress } = usePistolsContext()
  const { currentScene } = usePistolsScene()

  const suffix = useMemo(() => {
    if (selectedDuelId) {
      return `Duel #${bigintToDecimal(selectedDuelId)}`
    } else if (selectedDuelistId) {
      return `Duelist #${bigintToDecimal(selectedDuelistId)}`
    } else if (selectedPlayerAddress) {
      const name = getPlayernameFromAddress(selectedPlayerAddress)
      return name ?? `Player`
    }
    return MenuLabels[currentScene]
  }, [currentScene, selectedDuelId, selectedDuelistId, selectedPlayerAddress])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      let title = `Pistols at Dawn`
      if (suffix) {
        title += ' | ' + suffix
      }
      if (document.title !== title) {
        document.title = title
      }
    }
  }, [suffix]);

  return {}
}
