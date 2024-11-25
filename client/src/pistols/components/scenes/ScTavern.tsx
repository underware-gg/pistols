import React, { useEffect, useMemo, useState } from 'react'
import { QueryProvider } from '@/pistols/hooks/QueryContext'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'
import TableModal from '@/pistols/components/modals/TableModal'
import BarkeepModal from '../modals/BarkeepModal'
import { _currentScene } from '@/pistols/three/game'
import { InteractibleScene } from '@/pistols/three/InteractibleScene'
import { sceneBackgrounds } from '@/pistols/data/assets'

export default function ScTavern() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'pistol':
          dispatchSetScene(SceneName.Duels)
          break
        case 'bottle':
          dispatchSetScene(SceneName.Duelists)
          break
        case 'shovel':
          dispatchSetScene(SceneName.Graveyard)
          break
        case 'bartender':
          setOpen(true);
          (_currentScene as InteractibleScene).toggleBlur(true);
          (_currentScene as InteractibleScene).setClickable(false);
          (_currentScene as InteractibleScene).excludeItem(sceneBackgrounds.Tavern.items.find(item => item.name === 'bartender'));
          break;
      }
    } else {
      if (open) {
        setOpen(false);
        (_currentScene as InteractibleScene).toggleBlur(false);
        (_currentScene as InteractibleScene).setClickable(true);
        setTimeout(() => {
          (_currentScene as InteractibleScene).excludeItem(null);
        }, 400)
      }
    }
  }, [itemClicked, timestamp])

  return (
    <div>

      {/* <TableModal opener={tableOpener} /> */}
      <DuelistModal />
      <ChallengeModal />
      <NewChallengeModal />
      <TavernAudios />
      <BarkeepModal open={open} />

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </div>
  )
}
