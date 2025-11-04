import React, { useEffect, useState } from 'react'
import { useDisconnect } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useMintMockLords } from '/src/hooks/useLordsFaucet'
import { PublishOnlineStatusButton } from '/src/stores/sync/PlayerOnlineSync'
import { SceneName  } from '/src/data/assetsTypes'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { _currentScene, emitter } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import { useCanClaimStarterPack } from '/src/hooks/usePistolsContractCalls'
import { useDuelistsOwnedByPlayer } from '/src/hooks/useTokenDuelists'
import { MAX_TILT } from '/src/data/cardConstants'
import { CardPack } from '/src/components/ui/CardPack'
import { CARD_PACK_SIZE } from '/src/data/cardConstants'

export default function ScProfile() {
  const { debugMode } = useSettings()

  const { disconnect } = useDisconnect()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)
  const { value: itemHovered } = useGameEvent('hover_item', null)
  const { dispatchSetScene } = usePistolsScene()

  const { duelistIds } = useDuelistsOwnedByPlayer()
  const { canClaimStarterPack } = useCanClaimStarterPack(duelistIds.length)

  const [showCardPack, setShowCardPack] = useState(false)

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'book':
          dispatchSetScene(SceneName.DuelistBook)
          break
        case 'chest':
          if (canClaimStarterPack) {
            setShowCardPack(true)
          } else {
            dispatchSetScene(SceneName.CardPacks)
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
      (_currentScene as InteractibleScene)?.toggleBlur(true);
    } else {
      (_currentScene as InteractibleScene)?.setClickable(true);
      (_currentScene as InteractibleScene)?.toggleBlur(false);
    }
  }, [showCardPack])

  useEffect(() => {
    if (itemHovered == 'chest' && canClaimStarterPack) {
      emitter.emit('hover_description', 'Claim your free starter pack!')
    }
  }, [itemHovered])

  // auto mint mock lords on testnets
  useMintMockLords()

  return (
    <div id='Profile'>
      {showCardPack && (
        <CardPack 
          packType={constants.PackType.StarterPack} 
          isOpen={showCardPack} 
          clickable={showCardPack} 
          cardPackSize={CARD_PACK_SIZE} 
          maxTilt={MAX_TILT}
          onComplete={() => setShowCardPack(false)}
          customButtonLabel="Close"
        />
      )}

      {(debugMode || true) && <>
        <PublishOnlineStatusButton />
        {/* <TutorialProgressDebug /> */}
      </>}
    </div>
  )
}