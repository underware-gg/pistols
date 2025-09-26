import React, { useEffect, useState, useRef, useCallback } from 'react'
import { usePistolsScene, usePistolsContext } from '/src/hooks/PistolsContext'
import { SceneName, TextureName } from '/src/data/assets'
import { useGameEvent } from '/src/hooks/useGameEvent'
import { DojoSetupErrorDetector } from '/src/components/account/DojoSetupErrorDetector'
import { _currentScene } from '/src/three/game'
import { InteractibleScene } from '/src/three/InteractibleScene'
import BarkeepModal from '/src/components/modals/BarkeepModal'
import ActivityPanel from '/src/components/ActivityPanel'
import { Image } from 'semantic-ui-react'
import { useNotifications } from '/src/stores/notificationStore'
import { emitter } from '/src/three/game'
import { useAccount } from '@starknet-react/core'
import { useDuelIdsForClaimingRings } from '/src/queries/useDuelIdsForClaimingRings'
import { useHasClaimedRing } from '/src/hooks/usePistolsContractCalls'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import TavernRingsModal from '../modals/TavernRingsModal'
import { ExclamationIndicator } from '../ui/ExclamationIndicator'

// TEMP cheat to stop the rings popup from showing multiple times in a session
let hasShownInThisSession = false

export default function ScTavern() {
  const { dispatchSetScene } = usePistolsScene()
  const { barkeepModalOpener, tavernRingsOpener } = usePistolsContext()

  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

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
          (_currentScene as InteractibleScene)?.excludeItem(TextureName.bg_tavern_bartender_mask);
          (_currentScene as InteractibleScene)?.toggleBlur(true);
          (_currentScene as InteractibleScene)?.setClickable(false);
          barkeepModalOpener.open();
          break;
      }
    }
  }, [itemClicked, timestamp])

  useEffect(() => {
    if (!barkeepModalOpener.isOpen && !tavernRingsOpener.isOpen && _currentScene && _currentScene instanceof InteractibleScene) {
      (_currentScene as InteractibleScene)?.toggleBlur?.(false);
      (_currentScene as InteractibleScene)?.setClickable?.(true);
      setTimeout(() => {
        (_currentScene as InteractibleScene)?.excludeItem?.(null);
      }, 400)
    }
  }, [barkeepModalOpener.isOpen, tavernRingsOpener.isOpen])

  return (
    <div>
      <NotificationExclamation />
      <TavernRingsChecker />
      
      <BarkeepModal />

      <ActivityPanel />

      <DojoSetupErrorDetector />
    </div>
  )
}

function TavernRingsChecker() {
  const { address, isConnected } = useAccount()
  const { tavernRingsOpener } = usePistolsContext()
  const { goldRingDuelIds, silverRingDuelIds, leadRingDuelIds } = useDuelIdsForClaimingRings()
  const { hasClaimed: hasClaimedGold, isLoading: isLoadingGold } = useHasClaimedRing(address, constants.RingType.GoldSignetRing)
  const { hasClaimed: hasClaimedSilver, isLoading: isLoadingSilver } = useHasClaimedRing(address, constants.RingType.SilverSignetRing)
  const { hasClaimed: hasClaimedLead, isLoading: isLoadingLead } = useHasClaimedRing(address, constants.RingType.LeadSignetRing)
  
  const [hasShownRings, setHasShownRings] = useState(false)
  
  useEffect(() => {
    if (hasShownInThisSession) return

    let timeoutId: NodeJS.Timeout

    if (!isConnected || !address || hasShownRings || isLoadingGold || isLoadingSilver || isLoadingLead) return
    
    const hasClaimableRings = (
      (goldRingDuelIds.length > 0 && !hasClaimedGold) ||
      (silverRingDuelIds.length > 0 && !hasClaimedSilver) ||
      (leadRingDuelIds.length > 0 && !hasClaimedLead)
    )

    if (hasClaimableRings) {
      timeoutId = setTimeout(() => {
        setHasShownRings(true)
        hasShownInThisSession = true;
        (_currentScene as InteractibleScene)?.excludeItem(TextureName.bg_tavern_bartender_mask);
        (_currentScene as InteractibleScene)?.toggleBlur(true);
        (_currentScene as InteractibleScene)?.setClickable(false);
        tavernRingsOpener.open()
      }, 2000)
    }

    return () => clearTimeout(timeoutId)
  }, [
    isConnected, address, hasShownRings,
    goldRingDuelIds.length, silverRingDuelIds.length, leadRingDuelIds.length,
    hasClaimedGold, hasClaimedSilver, hasClaimedLead,
    isLoadingGold, isLoadingSilver, isLoadingLead,
    tavernRingsOpener
  ])
  
  useEffect(() => {
    if (!isConnected) {
      setHasShownRings(false)
    }
  }, [isConnected])
  
  return (
    <>
      <TavernRingsModal opener={tavernRingsOpener} />
    </>
  )
}


function NotificationExclamation() {
  const { hasUnreadNotifications } = useNotifications()
  const { barkeepModalOpener } = usePistolsContext()

  const handleMouseEnter = useCallback(() => {
    emitter.emit('hover_description', 'You have unread notifications')
  }, [])

  const handleMouseLeave = useCallback(() => {
    emitter.emit('hover_description', '')
  }, [])

  const handleClick = useCallback(() => {
    (_currentScene as InteractibleScene)?.excludeItem(TextureName.bg_tavern_bartender_mask);
    (_currentScene as InteractibleScene)?.toggleBlur(true);
    (_currentScene as InteractibleScene)?.setClickable(false);
    barkeepModalOpener.open({ initialStage: 'notifications' })
  }, [barkeepModalOpener])

  return (
    <ExclamationIndicator
      src="/images/ui/notification_exclamation.png"
      visible={hasUnreadNotifications && !barkeepModalOpener.isOpen}
      textureShiftIndex={1}
      position={{ top: '30%', left: '46%' }}
      size={{ width: 10 }}
      rotation={-20}
      animations={{
        opacity: true,
        pulse: true,
        float: true,
        hoverScale: true
      }}
      animationTiming={{
        opacityDuration: 200,
        pulseDuration: 800,
        floatDuration: 800,
        pulseIntensity: 8,
        floatAmount: 8,
        hoverScaleFactor: 1.2
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  )
}
