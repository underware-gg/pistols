import React, { useEffect, useState } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { TavernAudios } from '/src/components/GameContainer'
import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { sceneBackgrounds } from '/src/data/assets'
import BarkeepModal from '/src/components/modals/BarkeepModal'
import TableModal from '/src/components/modals/TableModal'
import ActivityPanel from '../ActivityPanel'

export default function ScTavern() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'pistol':
          dispatchSetScene(SceneName.Leaderboards)
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
    if (!open && _currentScene && _currentScene instanceof InteractibleScene) {
      (_currentScene as InteractibleScene).toggleBlur?.(false);
      (_currentScene as InteractibleScene).setClickable?.(true);
      setTimeout(() => {
        (_currentScene as InteractibleScene).excludeItem?.(null);
      }, 400)
    }
  }, [open])

  return (
    <div>

      <ActivityPanel />
      {/* <TableModal opener={tableOpener} /> */}
      <TavernAudios />
      <BarkeepModal open={open} setOpen={setOpen} />

      <DojoSetupErrorDetector />
    </div>
  )
}
