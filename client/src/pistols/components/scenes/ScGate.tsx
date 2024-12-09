import React, { useEffect } from 'react'
import { SceneName, usePistolsContext, usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'

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
