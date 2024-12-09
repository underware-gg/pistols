import React, { useEffect, useState } from 'react'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { useElizaMessage } from '@/pistols/utils/eliza'
import { useControllerUsername } from '@/lib/dojo/hooks/useController'
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

  const { username } = useControllerUsername()
  const { sendMessage, responses } = useElizaMessage(username)
  useEffect(() => console.log(`BARKEEP RESPONSES:`, responses), [responses])
  
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
          sendMessage('are you there?')
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
      <TavernAudios />
      <BarkeepModal open={open} />

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </div>
  )
}
