import React, { useEffect } from 'react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useMintMockLords } from '/src/hooks/useMintMockLords'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ConnectButton, EnterAsGuestButton } from '/src/components/scenes/ScDoor'
import { PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import { SceneName } from '/src/data/assets'
import { Divider } from '/src/components/ui/Divider'
import { VStack } from '/src/components/ui/Stack'
import ShopModal from '/src/components/modals/ShopModal'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { DuelistsBook } from '../ui/DuelistsBook'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'

export default function ScProfile() {
  const { isConnected } = useAccount()
  const { debugMode } = useSettings()
  const { shopOpener, bookOpener } = usePistolsContext()
  const { disconnect } = useDisconnect()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { dispatchSetScene } = usePistolsScene()

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'book':
          bookOpener.open();
          (_currentScene as InteractibleScene)?.setClickable(false);
          break
        case 'chest':
          shopOpener.open({ packType: constants.PackType.Duelists5x })
          break
        case 'door':
          disconnect()
          dispatchSetScene(SceneName.Gate)
          break
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (bookOpener.isOpen || shopOpener.isOpen) {
      (_currentScene as InteractibleScene)?.setClickable(false);
    } else {
      (_currentScene as InteractibleScene)?.setClickable(true);
    }
  }, [bookOpener.isOpen, shopOpener.isOpen])

  // auto mint mock lords on testnets
  useMintMockLords()

  return (
    <div id='Profile'>
      <div className='UIContainer'>
        {/* <DuelistsConnect /> */}
        <DuelistsBook 
          opener={bookOpener}
          width={30} 
          height={40}
          bookTranslateXClosed={16}
          bookTranslateYClosed={18}
          bookRotateXClosed={60}
          bookRotateYClosed={0}
          bookRotateZClosed={-30}
          bookRotateXOpen={20}
        />
      </div>

      <ShopModal opener={shopOpener} />

      {(debugMode || true) && <>
        <PublishOnlineStatusButton />
        {/* <TutorialProgressDebug /> */}
      </>}
    </div>
  )
}


//------------------------------------
// Duelists
//


function DuelistsConnect() {
  const { aspectWidth } = useGameAspect()

  return (
    <VStack className='Faded FillWidth' style={{ marginTop: aspectWidth(10) }}>
      <span className='Title'>
        Create or Log In with your
        <br />
        Controller Account
      </span>

      <Divider />
      <ConnectButton />

      <Divider content='OR' />
      <EnterAsGuestButton />
    </VStack>
  )
}