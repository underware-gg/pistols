import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { useAccount } from '@starknet-react/core'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useTransactionHandler } from '/src/hooks/useTransaction'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { useDuelIdsForClaimingRings } from '/src/queries/useDuelIdsForClaimingRings'
import { usePlayer, useRingEntityIdsOwnedByPlayer } from '/src/stores/playerStore'
import AnimatedText from '/src/components/ui/AnimatedText'
import { Opener } from '/src/hooks/useOpener'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { Modal } from 'semantic-ui-react'

type RingClaimState = 'loading' | 'open' | 'intro' | 'claiming' | 'success' | 'closing'

export interface ClaimableRing {
  ringType: constants.RingType
  duelIds: bigint[]
  hasClaimed: boolean
  ringName: string
  ringImage: {
    cover: string
    ring: string
  }
}

interface RingClaimItemProps {
  ring: ClaimableRing
  disabled: boolean
  isVisible: boolean
  onClaimComplete: (ringType: constants.RingType) => void
  onClaiming: (ringType: constants.RingType) => void
}

interface RingAnimationProps {
  playerName?: string
  ringName?: string
  ringType?: constants.RingType
  ringImage?: string
  onClose?: () => void
  opener: Opener
}

export default function TavernRingsModal({ opener }: { opener: Opener }) {
  return <>{opener.isOpen && <_TavernRingsModal opener={opener} />}</>
}

export function RingAnimationModal({ playerName, ringName, ringType, ringImage, onClose, opener }: RingAnimationProps) {

  if (!ringName || !ringType || !ringImage || !playerName || !opener.isOpen) return null
  
  return <RingAnimation playerName={playerName} ringName={ringName} ringType={ringType} ringImage={ringImage} onClose={onClose} opener={opener} />
}

function RingAnimation({ playerName, ringName, ringType, ringImage, onClose, opener }: RingAnimationProps) {
  const { aspectWidth } = useGameAspect()

  const ringAnimationRef = useRef<HTMLDivElement>(null)
  const [showCloseButton, setShowCloseButton] = useState(false)

  const getRingBenefits = (ringType: constants.RingType): string[] => {
    switch (ringType) {
      case constants.RingType.GoldSignetRing:
        return ['+40% bonus FOOLS rewards', 'Exclusive gold club membership']
      case constants.RingType.SilverSignetRing:
        return ['+20% bonus FOOLS rewards', 'Silver club membership']
      case constants.RingType.LeadSignetRing:
        return ['+10% bonus FOOLS rewards', 'Lead club membership']
      default:
        return ['+10% bonus FOOLS rewards']
    }
  }

  const getRingStampImage = (ringType: constants.RingType): string => {
    switch (ringType) {
      case constants.RingType.GoldSignetRing:
        return '/images/ui/stamps/gold_stamp_cork.png'
      case constants.RingType.SilverSignetRing:
        return '/images/ui/stamps/silver_stamp_cork.png'
      case constants.RingType.LeadSignetRing:
        return '/images/ui/stamps/lead_stamp_cork.png'
      default:
        return '/images/ui/stamps/gold_stamp_cork.png'
    }
  }

  const playRingRewardAnimation = useCallback(() => {
    if (!ringAnimationRef.current) {
      setTimeout(() => {
        playRingRewardAnimation()
      }, 200)
      return
    }

    const ring = ringAnimationRef.current
    
    ring.style.opacity = '0'
    ring.style.transform = 'translate(-50%, -50%) scale(0.2)'
    
    new TWEEN.Tween({ ringOpacity: 0, ringScale: 0.2 })
      .to({ ringOpacity: 1, ringScale: 1.2 }, 1200)
      .easing(TWEEN.Easing.Back.Out)
      .onUpdate(({ ringOpacity, ringScale }) => {
        ring.style.opacity = ringOpacity.toString()
        ring.style.transform = `translate(-50%, -50%) scale(${ringScale})`
      })
      .onComplete(() => {
        const shineElement = ring.querySelector('.shine-sweep') as HTMLElement
        if (shineElement) {
          shineElement.style.animation = 'shineSweep 5s ease-in-out infinite'
        }
        
        new TWEEN.Tween({ ringX: 0 })
          .to({ ringX: -aspectWidth(14) }, 800)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(({ ringX }) => {
            ring.style.transform = `translate(calc(-50% + ${ringX}px), -50%) scale(1.2)`
          })
          .onComplete(() => {
            setTimeout(() => {
              setShowCloseButton(true)
            }, 200)
          })
          .start()
      })
      .start()
  }, [aspectWidth])

  useEffect(() => {
    if (ringName && ringType && ringImage && playerName && ringAnimationRef.current) {
      playRingRewardAnimation()
    }
  }, [playRingRewardAnimation, ringName, ringType, ringImage, playerName, ringAnimationRef])

  const handleCloseSuccess = useCallback(() => {
    setShowCloseButton(false)
    onClose()
    opener.close()
  }, [opener])

  const diamond = useMemo(() => {
    return (
      <svg
        width={aspectWidth(0.8)}
        height={aspectWidth(1)}
        viewBox="0 0 120 140"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))',
        }}
        aria-hidden="true"
        focusable="false"
      >
        <polygon
          points="60,5 115,70 60,135 5,70"
          fill="#FFD700"
          stroke="#fffbe6"
          strokeWidth="6"
        />
        <circle
          cx="60"
          cy="70"
          r="13"
          fill="#fffbe6"
          filter="drop-shadow(0 0 6px #fffbe6)"
        />
      </svg>
    )
  }, [aspectWidth])

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={onClose}
      open={opener.isOpen}
      className=''
    >
      <div className={`RingAnimationOverlay RingAnimationOverlay${constants.getRingTypeValue(ringType)}`}>
        <div 
          ref={ringAnimationRef}
          className="RingAnimationContainer"
        >
          <img 
            src={ringImage} 
            alt={ringType.toString()}
            className="RingAnimationImage"
          />
          
          {/* Shine container with mask */}
          <div className="RingAnimationShineContainer">
            <div className="RingAnimationShineSweep shine-sweep" />
          </div>
        </div>
      
        <div className={`RingInfoCard ${showCloseButton ? 'RingInfoCardVisible' : ''}`}>
          <div className="RingInfoCardCorner TopRight">
            {diamond}
          </div>

          <div className="RingInfoCardCorner BottomLeft">
            {diamond}
          </div>

          <div className="RingInfoCardCorner BottomRight">
            {diamond}
          </div>

          <div className="RingInfoCardCorner TopLeft">
            {diamond}
          </div>
          
          {/* Ring Info Card Content */}
          <div className="RingInfoCardContent">
            {/* Certificate Title */}
            <div className="RingInfoCardTitle">
              <div className="RingInfoCardTitleMain">
                Certificate
              </div>
              <div className="RingInfoCardTitleSub">
                of Recognition
              </div>
              <div className="RingInfoCardTitleDivider"></div>
            </div>

            {/* Recognition Text */}
            <div className="RingInfoCardRecognition">
              <div className="RingInfoCardRecognitionIntro">
                This certifies that
              </div>
              <div className="RingInfoCardRecognitionName">
                {playerName || 'Player'}
              </div>
              <div className="RingInfoCardRecognitionDescription">
                was among the first brave souls to participate in Pistols at Dawn, earning them the prestigious
              </div>
              <div className="RingInfoCardRecognitionRingName">
                {ringName}
              </div>
              <div className="RingInfoCardRecognitionGratitude">
                as a token of our gratitude for their early participation
              </div>
            </div>

            {/* Golden Stamp Divider */}
            <div className="RingInfoCardStampDivider">
              <div className="RingInfoCardStampLine"></div>
              
              {/* Golden Stamp */}
              <img
                src={getRingStampImage(ringType)}
                alt="Ring Stamp"
                className="RingInfoCardStamp"
                tabIndex={0}
                aria-label="Ring Stamp"
              />
              
              <div className="RingInfoCardStampLine"></div>
            </div>

            {/* Benefits Explanation */}
            <div className="RingInfoCardBenefitsIntro">
              <div className="RingInfoCardBenefitsIntroText">
                This ring grants the bearer the following benefits:
              </div>
            </div>

            {/* Benefits Section */}
            <div className="RingInfoCardBenefitsList">
              {getRingBenefits(ringType).slice(0, 2).map((benefit, index) => (
                <div key={index} className="RingInfoCardBenefitItem">
                  {benefit}
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="RingInfoCardBottomSection">
              <div className="RingInfoCardBottomField">
                <div className="RingInfoCardBottomLabel">
                  Date
                </div>
                <div className="RingInfoCardBottomValue">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="RingInfoCardBottomField RingInfoCardBottomFieldRight">
                <div className="RingInfoCardBottomLabel">
                  Signed
                </div>
                <div className="RingInfoCardBottomValue">
                  Pistols at Dawn
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleCloseSuccess}
              className="BarkeepDialogButton RingInfoCardCloseButton"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function RingClaimItem({ ring, disabled, isVisible, onClaimComplete, onClaiming }: RingClaimItemProps) {
  const { account } = useAccount()
  const { ring_token: { claim_season_ring } } = useDojoSystemCalls()
  
  const buttonRef = useRef<HTMLDivElement>(null)


  // Stable onComplete callback
  const onCompleteClaim = React.useCallback((result: boolean | Error) => {
    if (result instanceof Error) {
      console.error(`❌ [CLAIM ERROR] Ring claiming failed for ${ring.ringName}:`, result)
      return
    }
    if (result) {
      onClaimComplete(ring.ringType)
    }
  }, [onClaimComplete, ring.ringType, ring.ringName])

  const { call: claimRing, isLoading } = useTransactionHandler<boolean, [bigint, constants.RingType]>({
    key: `claim_ring_${ring.ringType}`,
    transactionCall: (duelId: bigint, ringType: constants.RingType, key: string) => {
      return claim_season_ring(account, duelId, ringType, key)
    },
    onComplete: onCompleteClaim,
    indexerCheck: ring.hasClaimed,
    messageTargetRef: buttonRef,
    waitingMessage: "Transaction successful! Waiting for indexer...",
    messageDelay: 1000,
  })

  const handleClaimClick = useCallback(() => {
    if (isLoading) return
    if (ring.duelIds.length === 0) return
    
    claimRing(ring.duelIds[0], ring.ringType)
    onClaiming(ring.ringType)
  }, [isLoading, ring.duelIds, claimRing, ring.ringType, onClaiming])

  if (!isVisible) return null

  return (
    <div className="TavernRingItem">
      <img 
        src={ring.ringImage.cover} 
        alt={ring.ringName}
        className="TavernRingItemImage"
      />
      <div className="TavernRingItemContent">
        <div className="TavernRingItemTitle">
          {ring.ringName}
        </div>
        <div className="TavernRingItemSubtitle">
          {ring.duelIds.length} qualifying duel{ring.duelIds.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div ref={buttonRef}>
        <button
          onClick={handleClaimClick}
          disabled={isLoading || disabled || ring.hasClaimed}
          className="BarkeepDialogButton TavernRingItemButton"
        >
          {ring.hasClaimed ? 'Claimed!' : isLoading ? 'Claiming...' : 'Claim'}
        </button>
      </div>
    </div>
  )
}

const greetings = [
  "Well, well... frequenting my tavern often, eh? I suppose I have some... gifts for ya.",
  "Bloody hell, you've been nursing drinks here long enough. Here's your rewards, don't say I never gave ya nothin'.",
  "Oi! You've earned yourself some baubles for all that coin you've been dropping in my tavern.",
  "Listen up, you tavern rat! Your constant presence has earned you these trinkets. Don't let it go to your head."
]

const farewellMessages = [
  "Bah! You've taken all the bloody rings I had for ya. Now get out before I charge you for the air you're breathing!",
  "That's all the trinkets I got for ya, you greedy tentacle! Now scram before I throw you out myself!",
  "Hope you're happy with your shiny baubles. Don't expect me to be this generous again, ya hear?",
  "Right then! All your precious little rings are claimed. Time to leave this old bartender alone!"
]

export const ringImageMap = {
  [constants.RingType.GoldSignetRing]: {
    cover: '/tokens/rings/GoldRing.png',
    ring: '/images/ui/rings/GoldRing.png'
  },
  [constants.RingType.SilverSignetRing]: {
    cover: '/tokens/rings/SilverRing.png',
    ring: '/images/ui/rings/SilverRing.png'
  },
  [constants.RingType.LeadSignetRing]: {
    cover: '/tokens/rings/LeadRing.png',
    ring: '/images/ui/rings/LeadRing.png'
  }
}

export const getRingName = (ringType: constants.RingType, ringId: number): string => {
  switch (ringType) {
    case constants.RingType.GoldSignetRing:
      return `Gold Signet Ring #${ringId}`
    case constants.RingType.SilverSignetRing:
      return `Silver Signet Ring #${ringId}`
    case constants.RingType.LeadSignetRing:
      return `Lead Signet Ring #${ringId}`
    default:
      return 'Ring'
  }
}

const DELAY_PER_CHARACTER = 30

function _TavernRingsModal({ opener }: { opener: Opener }) {
  const { address } = useAccount()
  const { username } = usePlayer(address)
  const { ringAnimationOpener } = usePistolsContext()
  
  const { totalRings, ringIds, ringTypes } = useRingEntityIdsOwnedByPlayer(address)
  const { goldRingDuelIds, silverRingDuelIds, leadRingDuelIds } = useDuelIdsForClaimingRings()
  
  const [displayText, setDisplayText] = useState('')
  const [textAnimationComplete, setTextAnimationComplete] = useState(false)
  const [revealedRingsCount, setRevealedRingsCount] = useState(0)
  const [state, setState] = useState<RingClaimState>('loading')
  const [lastCompletedRingType, setLastCompletedRingType] = useState<constants.RingType | null>(null)
  const [animatingRing, setAnimatingRing] = useState<{ ringType: constants.RingType, ringImage: string, ringName: string } | null>(null)

  const [hasClaimedGoldRing, setHasClaimedGoldRing] = useState(false)
  const [hasClaimedSilverRing, setHasClaimedSilverRing] = useState(false)
  const [hasClaimedLeadRing, setHasClaimedLeadRing] = useState(false)

  const initialRings = useMemo(() => {
    const rings: constants.RingType[] = []
    
    //NOTE: this works as we know there is already rings claimed so we can be sure that it has to have some rings loaded before rest of logic can be executed
    //NOTE: can't doesnt work locally, replace with logic that makes sure we loaded the rings.
    if (totalRings > 0) {
      rings.push(...ringTypes)
      setState('open')
    }
    
    return rings
  }, [totalRings, ringTypes])

  const claimableRings = useMemo(() => {
    const rings: ClaimableRing[] = []
    
    if (goldRingDuelIds.length > 0 && !hasClaimedGoldRing && !initialRings.includes(constants.RingType.GoldSignetRing)) {
      const goldRing = {
        ringType: constants.RingType.GoldSignetRing,
        duelIds: goldRingDuelIds,
        hasClaimed: ringTypes.includes(constants.RingType.GoldSignetRing),
        ringName: 'Gold Signet Ring',
        ringImage: ringImageMap[constants.RingType.GoldSignetRing]
      }
      rings.push(goldRing)
    }
    
    if (silverRingDuelIds.length > 0 && !hasClaimedSilverRing && !initialRings.includes(constants.RingType.SilverSignetRing)) {
      const silverRing = {
        ringType: constants.RingType.SilverSignetRing,
        duelIds: silverRingDuelIds,
        hasClaimed: ringTypes.includes(constants.RingType.SilverSignetRing),
        ringName: 'Silver Signet Ring',
        ringImage: ringImageMap[constants.RingType.SilverSignetRing]
      }
      rings.push(silverRing)
    }
    
    if (leadRingDuelIds.length > 0 && !hasClaimedLeadRing && !initialRings.includes(constants.RingType.LeadSignetRing)) {
      const leadRing = {
        ringType: constants.RingType.LeadSignetRing,
        duelIds: leadRingDuelIds,
        hasClaimed: ringTypes.includes(constants.RingType.LeadSignetRing),
        ringName: 'Lead Signet Ring',
        ringImage: ringImageMap[constants.RingType.LeadSignetRing]
      }
      rings.push(leadRing)
    }
    
    return rings
  }, [goldRingDuelIds, silverRingDuelIds, leadRingDuelIds, ringTypes, hasClaimedGoldRing, hasClaimedSilverRing, hasClaimedLeadRing, initialRings])

  const handleRingClaiming = useCallback((ringType: constants.RingType) => {
    setState('claiming')
  }, [])

  const handleRingClaimComplete = useCallback((ringType: constants.RingType) => {
    setState('success')
    setLastCompletedRingType(ringType)

    if (ringType === constants.RingType.GoldSignetRing) {
      setHasClaimedGoldRing(true)
    } else if (ringType === constants.RingType.SilverSignetRing) {
      setHasClaimedSilverRing(true)
    } else if (ringType === constants.RingType.LeadSignetRing) {
      setHasClaimedLeadRing(true)
    }
  }, [])

  const handleAnimationClose = useCallback(() => {
    setAnimatingRing(null)
    setState('intro')
  }, [])

  useEffect(() => {
    if (opener.isOpen && state === 'open' && claimableRings.length > 0) {
      const textToShow = greetings[Math.floor(Math.random() * greetings.length)]
      
      setTextAnimationComplete(false)
      setDisplayText(textToShow)
      setState('intro')
      
    } else if (claimableRings.length === 0 && (state === 'intro' || state === 'open')) {
      const randomFarewell = farewellMessages[Math.floor(Math.random() * farewellMessages.length)]
      
      setTextAnimationComplete(false)
      setDisplayText(randomFarewell)
      setState('closing')
    }
  }, [opener.isOpen, claimableRings.length, state])

  useEffect(() => {
    if (lastCompletedRingType !== null) {
      const ringTypeIndex = ringTypes.findIndex(type => type === lastCompletedRingType)
      const ringId = ringTypeIndex !== -1 ? Number(ringIds[ringTypeIndex]) : 0

      if (ringId !== 0) {
        setAnimatingRing({
          ringType: lastCompletedRingType,
          ringImage: ringImageMap[lastCompletedRingType].ring,
          ringName: getRingName(lastCompletedRingType, ringId)
        })
        ringAnimationOpener.open()
        setLastCompletedRingType(null)
      }
    }
  }, [lastCompletedRingType, ringTypes, ringIds])

  useEffect(() => {
    if (state === 'closing' && textAnimationComplete) {
      setTimeout(() => {
        opener.close()
      }, 1000)
    }
  }, [state, opener, textAnimationComplete])

  useEffect(() => {
    if (!opener.isOpen) {
      setState('loading')
      setTextAnimationComplete(false)
      setDisplayText("")
      setHasClaimedGoldRing(false)
      setHasClaimedSilverRing(false)
      setHasClaimedLeadRing(false)
    }
  }, [opener.isOpen])

  useEffect(() => {
    if (textAnimationComplete && claimableRings.length > 0 && revealedRingsCount < claimableRings.length) {
      const timer = setTimeout(() => {
        setRevealedRingsCount(prev => prev + 1)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [textAnimationComplete, claimableRings.length, revealedRingsCount])

  if (!opener.isOpen) return null

    return (
    <>
      <div className='TempBarkeepOverlay NoMouse NoDrag'>
        <div className='TavernRingsTalkBalloon Relative'>
          <div className='BarkeepModalContainer'>
            <AnimatedText text={displayText} delayPerCharacter={DELAY_PER_CHARACTER} onAnimationComplete={() => setTextAnimationComplete(true)} />
            
            {/* Ring claiming interface */}
            {claimableRings.length > 0 && textAnimationComplete && (
              <div className='BarkeepMenuContainer'>
                {claimableRings.map((ring, index) => (
                  <RingClaimItem
                    key={ring.ringType}
                    ring={ring}
                    isVisible={index < revealedRingsCount}
                    disabled={state === 'claiming'}
                    onClaimComplete={handleRingClaimComplete}
                    onClaiming={handleRingClaiming}
                  />
                ))}
              </div>
            )}

            {/* Dialog buttons */}
            <div className="BarkeepButtonContainer">
              <button
                onClick={() => opener.close()}
                className="BarkeepDialogButton"
                disabled={state === 'claiming'}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <RingAnimationModal
        playerName={username}
        ringName={animatingRing?.ringName}
        ringType={animatingRing?.ringType}
        ringImage={animatingRing?.ringImage}
        onClose={handleAnimationClose}
        opener={ringAnimationOpener}
      />
    </>
  )
} 