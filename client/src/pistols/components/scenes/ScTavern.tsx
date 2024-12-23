import React, { useEffect, useState } from 'react'
import { usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { SceneName } from '@/pistols/data/assets'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { _currentScene } from '@/pistols/three/game'
import { InteractibleScene } from '@/pistols/three/InteractibleScene'
import { sceneBackgrounds } from '@/pistols/data/assets'
import BarkeepModal from '../modals/BarkeepModal'
import TableModal from '@/pistols/components/modals/TableModal'

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
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (!open) {
      (_currentScene as InteractibleScene).toggleBlur(false);
      (_currentScene as InteractibleScene).setClickable(true);
      setTimeout(() => {
        (_currentScene as InteractibleScene).excludeItem(null);
      }, 400)
    }
  }, [open])

  return (
    <div>

      {/* <TableModal opener={tableOpener} /> */}
      <TavernAudios />
      <BarkeepModal open={open} setOpen={setOpen} />

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </div>
  )
}
