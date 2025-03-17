import React, { useEffect } from 'react'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { TavernAudios } from '/src/components/GameContainer'
import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
import Logo from '/src/components/Logo'
import { useAccount } from '@starknet-react/core'
import { useDisconnect } from '@starknet-react/core'

export default function ScGate() {
  const { tableOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()

  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  
  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'door':
          dispatchSetScene(SceneName.Door)
          break
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (isConnected) {
      disconnect()
    }
  }, [isConnected, disconnect])

  return (
    <>
      <div style={{ position: 'absolute', left: '4%', bottom: '6%',zIndex: 1 }}>
        <Logo width={12} showName square />
      </div>

      <TavernAudios />
      {/* <BarkeepModal /> */}

      <DojoSetupErrorDetector />

    </>
  )
}
