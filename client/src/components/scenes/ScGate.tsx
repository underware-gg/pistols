import React, { useEffect } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { TavernAudios } from '/src/components/GameContainer'
import { DojoSetupErrorDetector } from '/src/components/account/ConnectionDetector'

export default function ScGate() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'door':
          dispatchSetScene(SceneName.Door)
          break
        case 'duel':
          //TODO navigate to tutorial
          break
        case 'sign':
          //TODO navigate to pistols website
          break
      }
    }
  }, [itemClicked, timestamp])

  return (
    <>

      <TavernAudios />
      {/* <BarkeepModal /> */}

      <DojoSetupErrorDetector />
      {/* <ConnectionDetector /> */}
    </>
  )
}
