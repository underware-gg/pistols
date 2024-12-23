import React, { useEffect } from 'react'
import { usePistolsContext, usePistolsScene } from '@/hooks/PistolsContext'
import { SceneName } from '@/data/assets'
import { useGameEvent } from '@/hooks/useGameEvent'
import { TavernAudios } from '@/components/GameContainer'
import { DojoSetupErrorDetector } from '@/components/account/ConnectionDetector'

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
