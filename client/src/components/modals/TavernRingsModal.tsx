import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useAccount } from '@starknet-react/core'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useTransactionHandler } from '/src/hooks/useTransaction'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuelIdsForClaimingRings } from '/src/queries/useDuelIdsForClaimingRings'
import { useHasClaimedRing } from '/src/hooks/usePistolsContractCalls'
import { useRingsOwnedByPlayer } from '/src/stores/playerStore'
import AnimatedText from '/src/components/ui/AnimatedText'
import { showElementPopupNotification } from '/src/components/ui/ElementPopupNotification'

interface TavernRingsModalProps {
  opener: {
    isOpen: boolean
    open: () => void
    close: () => void
  }
}

type RingClaimState = 'dialog' | 'claiming' | 'success' | 'closing'

interface ClaimableRing {
  ringType: constants.RingType
  duelIds: bigint[]
  hasClaimed: boolean
  ringName: string
  ringImage: string
}

interface RingClaimItemProps {
  ring: ClaimableRing
  onClaimComplete: (ringType: constants.RingType) => void
  isVisible: boolean
}

export default function TavernRingsModal({ opener }: TavernRingsModalProps) {
  return <>{opener.isOpen && <_TavernRingsModal opener={opener} />}</>
}

function RingClaimItem({ ring, onClaimComplete, isVisible }: RingClaimItemProps) {
  const { account } = useAccount()
  const { aspectWidth } = useGameAspect()
  const { ring_token: { claim_season_ring } } = useDojoSystemCalls()
  const buttonRef = useRef<HTMLDivElement>(null)

  // 🏭 PRODUCTION TRANSACTION HANDLER 
  const { call: claimRing, isLoading, isWaitingForIndexer } = useTransactionHandler<boolean, [bigint, constants.RingType]>({
    key: `claim_ring_${ring.ringType}`,
    transactionCall: (duelId: bigint, ringType: constants.RingType) => {
      return claim_season_ring(account, duelId, ringType)
    },
    onComplete: (result: boolean | Error) => {
      if (result instanceof Error) {
        console.error(`❌ [CLAIM ERROR] Ring claiming failed for ${ring.ringName}:`, result)
        return
      }
      
      if (result) {
        onClaimComplete(ring.ringType)
      }
    },
    indexerCheck: true, // Enable indexer check for production
  })

  useEffect(() => {
    if (isWaitingForIndexer && buttonRef.current) {
      showElementPopupNotification(buttonRef, "Transaction successful! Waiting for indexer...")
    }
  }, [isWaitingForIndexer])

  const handleClaimClick = useCallback(() => {
    if (isLoading) return
    if (ring.duelIds.length === 0) return
    
    claimRing(ring.duelIds[0], ring.ringType)
  }, [isLoading, ring.duelIds, claimRing, ring.ringType])

  // handle claimed ring
  const { ringTypes } = useRingsOwnedByPlayer()
  const ringClaimed = useMemo(() => (ringTypes.includes(ring.ringType)), [ring, ringTypes])

  if (!isVisible) return null

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: aspectWidth(1),
        padding: aspectWidth(0.5),
        backgroundColor: 'rgba(139, 69, 19, 0.3)',
        borderRadius: aspectWidth(0.5),
        border: `${aspectWidth(0.1)} solid #8B4513`,
        opacity: 0,
        animation: 'tavernRingItemFadeIn 0.8s ease-out forwards',
        marginBottom: aspectWidth(0.5)
      }}
    >
      <img 
        src={ring.ringImage} 
        alt={ring.ringName}
        style={{ 
          width: aspectWidth(3), 
          height: aspectWidth(3),
          borderRadius: aspectWidth(0.3)
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: aspectWidth(1.4), 
          fontWeight: 'bold',
          color: '#FFD700',
          marginBottom: aspectWidth(0.2)
        }}>
          {ring.ringName}
        </div>
        <div style={{ 
          fontSize: aspectWidth(1.2), 
          color: '#FFF8DC',
          opacity: 0.9
        }}>
          {ring.duelIds.length} qualifying duel{ring.duelIds.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div ref={buttonRef}>
        <button
          onClick={handleClaimClick}
          disabled={isLoading || ringClaimed}
          className="BarkeepDialogButton"
          style={{
            fontSize: aspectWidth(1.2),
            padding: `${aspectWidth(0.4)} ${aspectWidth(0.8)}`,
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {ringClaimed ? 'Claimed!' : isLoading ? 'Claiming...' : 'Claim'}
        </button>
      </div>
    </div>
  )
}

function _TavernRingsModal({ opener }: TavernRingsModalProps) {
  const { account, address } = useAccount()
  const { aspectWidth, aspectHeight } = useGameAspect()
  
  const { goldRingDuelIds, silverRingDuelIds, leadRingDuelIds } = useDuelIdsForClaimingRings()
  
  const { hasClaimed: hasClaimedGold } = useHasClaimedRing(address, constants.RingType.GoldSignetRing)
  const { hasClaimed: hasClaimedSilver } = useHasClaimedRing(address, constants.RingType.SilverSignetRing)
  const { hasClaimed: hasClaimedLead } = useHasClaimedRing(address, constants.RingType.LeadSignetRing)
  
  const [state, setState] = useState<RingClaimState>('dialog')
  const [displayText, setDisplayText] = useState('')
  const [claimingRing, setClaimingRing] = useState<ClaimableRing | null>(null)
  const [claimedRings, setClaimedRings] = useState<Set<constants.RingType>>(new Set())
  const [showCloseButton, setShowCloseButton] = useState(false)
  const [textAnimationComplete, setTextAnimationComplete] = useState(false)
  const [revealedRingsCount, setRevealedRingsCount] = useState(0)
  const [farewellAnimationComplete, setFarewellAnimationComplete] = useState(false)
  
  const ringAnimationRef = useRef<HTMLDivElement>(null)
  
  // Ring images mapping - using token ring images 🙃 like treasures from the tavern
  const ringImageMap = {
    [constants.RingType.GoldSignetRing]: '/tokens/rings/GoldRing.png',
    [constants.RingType.SilverSignetRing]: '/tokens/rings/SilverRing.png', 
    [constants.RingType.LeadSignetRing]: '/tokens/rings/LeadRing.png'
  }

  const claimableRings = useMemo(() => {
    const rings: ClaimableRing[] = []
    
    if (goldRingDuelIds.length > 0) {
      const goldRing = {
        ringType: constants.RingType.GoldSignetRing,
        duelIds: goldRingDuelIds,
        hasClaimed: hasClaimedGold,
        ringName: 'Gold Signet Ring',
        ringImage: ringImageMap[constants.RingType.GoldSignetRing]
      }
      rings.push(goldRing)
    }
    
    if (silverRingDuelIds.length > 0) {
      const silverRing = {
        ringType: constants.RingType.SilverSignetRing,
        duelIds: silverRingDuelIds,
        hasClaimed: hasClaimedSilver,
        ringName: 'Silver Signet Ring',
        ringImage: ringImageMap[constants.RingType.SilverSignetRing]
      }
      rings.push(silverRing)
    }
    
    if (leadRingDuelIds.length > 0) {
      const leadRing = {
        ringType: constants.RingType.LeadSignetRing,
        duelIds: leadRingDuelIds,
        hasClaimed: hasClaimedLead,
        ringName: 'Lead Signet Ring',
        ringImage: ringImageMap[constants.RingType.LeadSignetRing]
      }
      rings.push(leadRing)
    }
    
    const filteredRings = rings.filter(ring => {
      const shouldInclude = !ring.hasClaimed && !claimedRings.has(ring.ringType)
      return shouldInclude
    })
    
    return filteredRings
  }, [goldRingDuelIds, silverRingDuelIds, leadRingDuelIds, hasClaimedGold, hasClaimedSilver, hasClaimedLead, claimedRings])

  const handleRingClaimComplete = useCallback((ringType: constants.RingType) => {
    // Add to claimed rings
    setClaimedRings(prev => {
      const newSet = new Set(prev).add(ringType)
      return newSet
    })
    
    // Set the claiming ring for animation
    const claimedRing = claimableRings.find(r => r.ringType === ringType)
    
    if (claimedRing) {
      setClaimingRing(claimedRing)
      // Start success animation
      setState('success')
      // Note: Animation will be triggered by useEffect watching state change
    }
  }, [claimableRings])

  const playRingRewardAnimation = useCallback(() => {
    if (!ringAnimationRef.current) {
      // Retry after a short delay in case elements are still rendering
      setTimeout(() => {
        playRingRewardAnimation()
      }, 200)
      return
    }

    const ring = ringAnimationRef.current
    
    // Start with ring invisible
    ring.style.opacity = '0'
    ring.style.transform = 'translate(-50%, -50%) scale(0.2)' // Start smaller for bigger impact
    
    // Simple dramatic ring entrance
    new TWEEN.Tween({ ringOpacity: 0, ringScale: 0.2 })
      .to({ ringOpacity: 1, ringScale: 1 }, 1200)
      .easing(TWEEN.Easing.Back.Out)
      .onUpdate(({ ringOpacity, ringScale }) => {
        ring.style.opacity = ringOpacity.toString()
        ring.style.transform = `translate(-50%, -50%) scale(${ringScale})`
      })
      .onComplete(() => {
        // Start the shine sweep effect
        const shineElement = ring.querySelector('.shine-sweep') as HTMLElement
        if (shineElement) {
          shineElement.style.animation = 'shineSweep 5s ease-in-out infinite'
        }
        
        // Show continue button after ring appears
        setTimeout(() => {
          setShowCloseButton(true)
        }, 800)
      })
      .start()

    // Animation loop
    const animate = () => {
      TWEEN.update()
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  // Track if we've shown the initial greeting
  const [hasShownInitialGreeting, setHasShownInitialGreeting] = useState(false)

  useEffect(() => {
    if (opener.isOpen && state === 'dialog' && !hasShownInitialGreeting) {
      setTextAnimationComplete(false) // Reset text animation state
      setRevealedRingsCount(0) // Reset revealed rings count
      
      // Initial greetings ONLY on first open
      const greetings = [
        "Well, well... frequenting my tavern often, eh? I suppose I have some... gifts for ya.",
        "Bloody hell, you've been nursing drinks here long enough. Here's your rewards, don't say I never gave ya nothin'.",
        "Oi! You've earned yourself some baubles for all that coin you've been dropping in my tavern.",
        "Listen up, you tavern rat! Your constant presence has earned you these trinkets. Don't let it go to your head."
      ]
      const textToShow = greetings[Math.floor(Math.random() * greetings.length)]
      
      setDisplayText(textToShow)
      setHasShownInitialGreeting(true)
      
      // Calculate when text animation will complete (delayPerCharacter is 30ms)
      const textAnimationDuration = textToShow.length * 30 + 500 // Add small buffer
      setTimeout(() => {
        setTextAnimationComplete(true)
        setRevealedRingsCount(0) // Reset revealed rings count
      }, textAnimationDuration)
      
    } else if (claimableRings.length === 0 && state === 'dialog' && hasShownInitialGreeting) {
      // All rings claimed, show farewell message
      const farewellMessages = [
        "Bah! You've taken all the bloody rings I had for ya. Now get out before I charge you for the air you're breathing!",
        "That's all the trinkets I got for ya, you greedy tentacle! Now scram before I throw you out myself!",
        "Hope you're happy with your shiny baubles. Don't expect me to be this generous again, ya hear?",
        "Right then! All your precious little rings are claimed. Time to leave this old bartender alone!"
      ]
      
      const randomFarewell = farewellMessages[Math.floor(Math.random() * farewellMessages.length)]
      setDisplayText(randomFarewell)
      setFarewellAnimationComplete(false)
      
      // Calculate when farewell text animation will complete + 2 seconds
      const farewellAnimationDuration = randomFarewell.length * 30 + 500 // Text animation duration
      setTimeout(() => {
        setFarewellAnimationComplete(true)
        
        // Wait 2 more seconds then close
        setTimeout(() => {
          opener.close()
        }, 2000)
      }, farewellAnimationDuration)
    }
  }, [opener.isOpen, state, claimableRings.length, hasShownInitialGreeting])

  // Reset greeting flag when modal closes
  useEffect(() => {
    if (!opener.isOpen) {
      setHasShownInitialGreeting(false)
      setFarewellAnimationComplete(false)
    }
  }, [opener.isOpen])

  // Start revealing rings one by one after text animation completes
  useEffect(() => {
    if (textAnimationComplete && claimableRings.length > 0 && revealedRingsCount < claimableRings.length) {
      const timer = setTimeout(() => {
        setRevealedRingsCount(prev => prev + 1)
      }, 600) // 600ms delay between each ring appearance 🎯
      
      return () => clearTimeout(timer)
    }
  }, [textAnimationComplete, claimableRings.length, revealedRingsCount])

  // Trigger animation when state changes to success (after DOM is rendered)
  useEffect(() => {
    if (state === 'success' && claimingRing) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        playRingRewardAnimation()
      }, 100) // 100ms delay to ensure refs are available
      
      return () => clearTimeout(timer)
    }
  }, [state, claimingRing, playRingRewardAnimation])

  const handleCloseSuccess = useCallback(() => {
    setState('closing')
    setShowCloseButton(false)
    setClaimingRing(null)
    
    // If no more rings to claim, close the modal
    if (claimableRings.length === 0) {
      opener.close()
    } else {
      // Go back to dialog WITHOUT changing text or resetting anything
      setState('dialog')
      // Keep existing text and revealed rings - don't reset anything!
    }
  }, [claimableRings.length, opener])

  if (!opener.isOpen) return null

    return (
    <>
      <div className='TempBarkeepOverlay NoMouse NoDrag'>
        <div className='TavernRingsTalkBalloon Relative'>
          <div className='BarkeepModalContainer'>
            <AnimatedText text={displayText} delayPerCharacter={30} />
            
            {/* Ring claiming interface */}
            {state === 'dialog' && claimableRings.length > 0 && textAnimationComplete && (
              <div className='BarkeepMenuContainer'>
                {claimableRings.map((ring, index) => (
                  <RingClaimItem
                    key={ring.ringType}
                    ring={ring}
                    onClaimComplete={handleRingClaimComplete}
                    isVisible={index < revealedRingsCount}
                  />
                ))}
              </div>
            )}

            {/* Dialog buttons */}
            <div className="BarkeepButtonContainer">
              <button
                onClick={() => opener.close()}
                className="BarkeepDialogButton"
                style={{ opacity: state === 'success' ? 0.5 : 1 }}
                disabled={state === 'success'}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 CLEAN RING REWARD ANIMATION */}
      {state === 'success' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          pointerEvents: 'none'
        }}>
          {/* 💍 RING WITH SHINE SWEEP EFFECT */}
          <div 
            ref={ringAnimationRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0,
              zIndex: 10001,
              overflow: 'hidden',
              borderRadius: aspectWidth(2)
            }}
          >
            <img 
              src={claimingRing?.ringImage} 
              alt={claimingRing?.ringName}
              style={{
                width: aspectWidth(25),
                height: aspectWidth(25),
                borderRadius: aspectWidth(1),
                filter: `
                  drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) 
                  drop-shadow(0 0 40px rgba(255, 165, 0, 0.6))
                  drop-shadow(0 0 60px rgba(255, 255, 0, 0.4))
                `,
                position: 'relative',
                zIndex: 1
              }}
            />
            
            {/* 🌟 SHINE SWEEP OVERLAY */}
            <div 
              className="shine-sweep"
              style={{
                position: 'absolute',
                top: 0,
                left: '-150%',
                width: '200%',
                height: '100%',
                background: `linear-gradient(
                  50deg, 
                  transparent 0%, 
                  transparent 30%, 
                  rgba(255, 255, 255, 0.2) 47%, 
                  rgba(255, 255, 255, 0.8) 50%, 
                  rgba(255, 255, 255, 0.2) 53%, 
                  transparent 70%, 
                  transparent 100%
                )`,
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />
          </div>
          
          {/* Continue button appears after animation */}
          {showCloseButton && (
            <button
              onClick={handleCloseSuccess}
              className="BarkeepDialogButton"
              style={{
                position: 'absolute',
                bottom: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
                zIndex: 10002,
                animation: 'fadeIn 0.5s ease-out',
                fontSize: aspectWidth(2),
                padding: `${aspectWidth(1)} ${aspectWidth(2)}`
              }}
            >
              Continue
            </button>
          )}
        </div>
      )}
    </>
  )
} 