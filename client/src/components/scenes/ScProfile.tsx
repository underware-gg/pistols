import React, { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { useMintMockLords } from '/src/hooks/useLordsFaucet'
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
import { _currentScene, emitter } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { MAX_TILT } from '/src/data/cardConstants'
import { CardPack } from '../ui/CardPack'
import { CARD_PACK_SIZE } from '/src/data/cardConstants'

export default function ScProfile() {
  const { isConnected } = useAccount()
  const { debugMode } = useSettings()
  const { shopOpener, bookOpener } = usePistolsContext()
  const { disconnect } = useDisconnect()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { value: itemHovered } = useGameEvent('hover_item', null)
  const { dispatchSetScene } = usePistolsScene()

  const { duelistIds } = useDuelistsOfPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)

  const [showCardPack, setShowCardPack] = useState(false)

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'book':
          bookOpener.open();
          (_currentScene as InteractibleScene)?.setClickable(false);
          break
        case 'chest':
          if (canClaimStarterPack) {
            setShowCardPack(true)
          } else {
            shopOpener.open({ packType: constants.PackType.GenesisDuelists5x })
          }
          break
        case 'door':
          disconnect()
          dispatchSetScene(SceneName.Gate)
          break
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (showCardPack) {
      (_currentScene as InteractibleScene)?.setClickable(false);
    } else {
      (_currentScene as InteractibleScene)?.setClickable(true);
    }
  }, [showCardPack])

  useEffect(() => {
    if (itemHovered == 'chest' && canClaimStarterPack) {
      emitter.emit('hover_description', 'Claim your free starter pack!')
    }
  }, [itemHovered])

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

      
      <CardPack 
        packType={constants.PackType.StarterPack} 
        isOpen={showCardPack} 
        clickable={showCardPack} 
        cardPackSize={CARD_PACK_SIZE} 
        maxTilt={MAX_TILT}
        onComplete={() => setShowCardPack(false)}
        customButtonLabel="Close"
      />

      <ShopModal opener={shopOpener} />

      {(debugMode || true) && <>
        <PublishOnlineStatusButton />
        {/* <TutorialProgressDebug /> */}
      </>}
    </div>
  )
}