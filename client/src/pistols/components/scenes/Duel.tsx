import 'react-circular-progressbar/dist/styles.css';
import 'react-circular-progressbar/dist/styles.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, SemanticFLOATS, Image, Button, Modal } from 'semantic-ui-react'
import { BigNumberish, num } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useMounted, useClientTimestamp } from '@underware_gg/pistols-sdk/hooks'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallengeDescription } from '@/pistols/hooks/useChallengeDescription'
import { useChallenge } from '@/pistols/stores/challengeStore';
import { useFinishedDuelProgress } from '@/pistols/hooks/useContractCalls'
import { useDuelist } from '@/pistols/stores/duelistStore'
import { useTable } from '@/pistols/stores/tableStore'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '@/pistols/hooks/useRevealAction'
import { useIsYou } from '@/pistols/hooks/useIsYou'
import { useOwnerOfDuelist } from '@/pistols/hooks/useDuelistToken';
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileModels } from '@/pistols/data/assets'
import { EnvironmentCardsTextures } from '@/pistols/data/cardAssets'
import { AnimationState } from '@/pistols/three/game'
import { Action, ArchetypeNames } from '@/pistols/utils/pistols'
import { MenuDebugAnimations, MenuDuel, MenuDuelControl } from '@/pistols/components/Menus'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { DuelistCardType } from '@/pistols/components/cards/Cards'
import { FameBalanceDuelist } from '../account/LordsBalance';
import CommitPacesModal from '@/pistols/components/modals/CommitPacesModal'
import Cards, { CardsHandle, DuelistHand } from '@/pistols/components/cards/DuelCards'
import useGameAspect from '@/pistols/hooks/useGameApect'
import * as Constants from '@/pistols/data/cardConstants'
import * as TWEEN from '@tweenjs/tween.js'
import DuelistModal from '../modals/DuelistModal';


export type DuelistState = {
  damage: number, 
  hitChance: number, 
  health: number,
  shotPaces: number, 
  dodgePaces: number,
}

export default function Duel({
  duelId
} : {
  duelId: bigint
}) {
  const { gameImpl } = useThreeJsContext()
  const { animated, dispatchAnimated } = useGameplayContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { tableId, isFinished, quote, duelistIdA, duelistIdB, timestamp_start } = useChallenge(duelId)
  const { description } = useTable(tableId)

  // guarantee to run only once when this component mounts
  const mounted = useMounted()
  const [duelSceneStarted, setDuelSceneStarted] = useState(false)
  const { profilePic: profilePicA, name: nameA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB, name: nameB } = useDuelist(duelistIdB)
  const { isYou: isYouA } = useIsYou(duelistIdA)
  const { isYou: isYouB } = useIsYou(duelistIdB)
  
  useEffect(() => {
    if (gameImpl && mounted && !duelSceneStarted && profilePicA && profilePicB && nameA && nameB) {
      gameImpl.startDuelWithPlayers(nameA, ProfileModels[profilePicA], isYouA, isYouB, nameB, ProfileModels[profilePicB])
      setDuelSceneStarted(true)
      dispatchAnimated(AnimationState.None)
    }
  }, [gameImpl, mounted, duelSceneStarted, profilePicA, profilePicB, nameA, nameB, isYouA, isYouB])

  // setup grass animation
  const { clientSeconds } = useClientTimestamp(false)
  useEffect(() => {
    if (clientSeconds && timestamp_start) {
      gameImpl?.setDuelTimePercentage(clientSeconds - timestamp_start)
    }
  }, [gameImpl, clientSeconds, timestamp_start])

  // Animated duel is useDuel added with intermediate animation stages
  const {
    duelStage,
    completedStagesA, completedStagesB,
    canAutoRevealA, canAutoRevealB,
  } = useAnimatedDuel(duelId, duelSceneStarted)

  const { debugMode, duelSpeedFactor } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  const [statsA, setStatsA] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })
  const [statsB, setStatsB] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })

  const [ isPlaying, setIsPlaying ] = useState(true)
  const [ triggerReset, setTriggerReset ] = useState(false)
  
  const cardRef = useRef<CardsHandle>(null)
  const currentStep = useRef(0)

  const isPlayingRef = useRef(true)
  const speedRef = useRef(duelSpeedFactor)
  const isAnimatingStepRef = useRef(false)
  const hasSpawnedCardsA = useRef(false)
  const hasSpawnedCardsB = useRef(false)
  const hasUnmounted = useRef(false)

  useEffect(() => {
    speedRef.current = duelSpeedFactor
    gameImpl?.setDuelistSpeedFactor(duelSpeedFactor)
  }, [duelSpeedFactor, gameImpl])

  //spawns cards for all duelists if they committed
  useEffect(() => {
    if (!cardRef.current) return

    setTimeout(() => {
      if(completedStagesA[DuelStage.Round1Reveal] && completedStagesB[DuelStage.Round1Reveal]) return
      if (!isYouA) {
        if (completedStagesA[DuelStage.Round1Commit] && !hasSpawnedCardsA.current) {
          hasSpawnedCardsA.current = true
          cardRef.current?.spawnCards('A', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
      if (!isYouB) {
        if (completedStagesB[DuelStage.Round1Commit] && !hasSpawnedCardsB.current) {
          hasSpawnedCardsB.current = true
          cardRef.current?.spawnCards('B', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
    }, 1000);
  }, [completedStagesA, completedStagesB, isYouA, isYouB])

  
  const nextStepCallback = useRef(null);
  const cardRevealTimeout = useRef(null);
  const gameBladeAnimationTimeout = useRef(null);
  const gameAnimationTimeout = useRef(null);

  const duelProgress = useFinishedDuelProgress(duelId)

  useEffect(() => {
    return () => {
      hasUnmounted.current = true
    }
  }, [])
  
  useEffect(() => {
    if (duelProgress) {

      resetEverything()

      const envCardsList = duelProgress.steps.reduce((acc, step) => {
        if (step.card_env !== constants.EnvCard.None) {
          acc.push(EnvironmentCardsTextures[step.card_env]);
        }
        return acc;
      }, []);
      
      cardRef.current?.setAllEnvCards(envCardsList)

      setTimeout(() => {
        cardRef.current?.spawnCards('A', { fire: duelProgress.hand_a.card_fire, dodge: duelProgress.hand_a.card_dodge, blade: duelProgress.hand_a.card_blades, tactics: duelProgress.hand_a.card_tactics })
        cardRef.current?.spawnCards('B', { fire: duelProgress.hand_b.card_fire, dodge: duelProgress.hand_b.card_dodge, blade: duelProgress.hand_b.card_blades, tactics: duelProgress.hand_b.card_tactics })
      }, 1500)

      setTimeout(() => {
        const step = duelProgress.steps[currentStep.current]

        setStatsA((prevValue) => {
          return { 
            damage: Number(step.state_a.damage),
            hitChance: Number(step.state_a.chances),
            health: Number(step.state_a.health),
            shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_a.fire ? currentStep.current : undefined),
            dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_a.dodge ? currentStep.current : undefined),
          }
        })
        setStatsB((prevValue) => {
          return { 
            damage: Number(step.state_b.damage),
            hitChance: Number(step.state_b.chances),
            health: Number(step.state_b.health),
            shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_b.fire ? currentStep.current : undefined),
            dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_b.dodge ? currentStep.current : undefined),
          }
        })
      }, 2500);

      setTimeout(() => {
        gameImpl?.hideDialogs()

        cardRef.current?.revealCard("A", DuelistCardType.TACTICS, speedRef.current)
        cardRef.current?.revealCard("B", DuelistCardType.TACTICS, speedRef.current)

        if (isPlayingRef.current) {
          nextStepCallback.current = setTimeout(() => {
            playStep()
          }, (Constants.BASE_CARD_REVEAL_DURATION * 1.2) / speedRef.current)
        }
      }, 4000)
    }

    return () => {
        hasUnmounted.current = true
    };
  }, [duelProgress, triggerReset])
  
  const { aspectWidth } = useGameAspect()

  const playStep = () => {
    currentStep.current += 1

    const step = duelProgress.steps[currentStep.current]

    if (!step) return

    isAnimatingStepRef.current = true

    if (step.card_env != constants.EnvCard.None) cardRef.current?.drawNextCard(speedRef.current)

    let shouldDoblePause = false

    // Reveal all cards in hand A
    let revealCardsA = [];
    let revealCardsB = [];

    if (step.card_a.fire) {
      shouldDoblePause = true;
      revealCardsA.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_a.dodge) {
      shouldDoblePause = true;
      revealCardsA.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_a.blades) {
      revealCardsA.push({ type: DuelistCardType.BLADE, delay: 1000 });
    }

    // Reveal all cards in hand B
    if (step.card_b.fire) {
      shouldDoblePause = true;
      revealCardsB.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_b.dodge) {
      shouldDoblePause = true;
      revealCardsB.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_b.blades) {
      revealCardsB.push({ type: DuelistCardType.BLADE, delay: 1000 });
    }

    cardRevealTimeout.current = setTimeout(() => {
      revealCardsA.forEach(card => cardRef.current?.revealCard("A", card.type, speedRef.current));
      revealCardsB.forEach(card => cardRef.current?.revealCard("B", card.type, speedRef.current));
    }, Math.max(...[...revealCardsA, ...revealCardsB].map(card => card.delay || 0), 0) / speedRef.current);

    let newStatsA: DuelistState;
    let newStatsB: DuelistState;

    setStatsA((prevValue) => {
      newStatsA = { 
        damage: Number(step.state_a.damage),
        hitChance: Number(step.state_a.chances),
        health: Number(step.state_a.health),
        shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_a.fire ? currentStep.current : undefined),
        dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_a.dodge ? currentStep.current : undefined),
      }
      return newStatsA
    })
    setStatsB((prevValue) => {
      newStatsB = { 
        damage: Number(step.state_b.damage),
        hitChance: Number(step.state_b.chances),
        health: Number(step.state_b.health),
        shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_b.fire ? currentStep.current : undefined),
        dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_b.dodge ? currentStep.current : undefined),
      }
      return newStatsB
    })

    if (currentStep.current > 1 && step.card_env == constants.EnvCard.None) {
      gameBladeAnimationTimeout.current = setTimeout(() => {
        gameImpl?.prepareActionAnimation()
        gameImpl?.animateDuelistBlade()
      }, 1000 / speedRef.current);
    }

    const timeDelay = Constants.DRAW_CARD_BASE_DURATION + 200 + (shouldDoblePause ? (Constants.BASE_CARD_REVEAL_DURATION + 200) : 200)
    const timeDelayNextStep = timeDelay + (shouldDoblePause ? 1400 : 1000)

    gameAnimationTimeout.current = setTimeout(() => {
      cardRef.current?.updateDuelistData(newStatsA?.damage, newStatsB?.damage, newStatsA?.hitChance, newStatsB?.hitChance)
      if (step.card_env != constants.EnvCard.None) {
        gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
      } else {
        gameImpl?.animateActions(Action[step.card_a.blades], Action[step.card_b.blades], newStatsA?.health, newStatsB?.health)
      }
    }, step.card_env != constants.EnvCard.None ? (timeDelay / speedRef.current) : 1000 / speedRef.current);

    if (currentStep.current < duelProgress.steps.length && isPlayingRef.current) {
      nextStepCallback.current = setTimeout(() => {
        if (hasUnmounted.current) {
          resetEverything()
        } else {
          playStep()
        }
      }, timeDelayNextStep / speedRef.current)
    }
    setTimeout(() => {
      isAnimatingStepRef.current = false
    }, timeDelayNextStep / speedRef.current) 
  }

  const resetStep = () => {
    clearTimeout(nextStepCallback.current)
    clearTimeout(cardRevealTimeout.current)
    clearTimeout(gameBladeAnimationTimeout.current)
    clearTimeout(gameAnimationTimeout.current)
  }

  const resetDuel = () => {
    resetStep()
    resetEverything()
    cardRef.current?.resetCards()
    gameImpl?.resetDuelScene(false)
    
    setTimeout(() => {
      setTriggerReset(!triggerReset)
    }, 1200);
  }

  const resetEverything = () => {
    setStatsA((prevValue) => {
        return { 
          damage: 0,
          hitChance: 0,
          health: 3,
          shotPaces: undefined,
          dodgePaces: undefined,
        }
      })
      setStatsB((prevValue) => {
        return { 
          damage: 0,
          hitChance: 0,
          health: 3,
          shotPaces: undefined,
          dodgePaces: undefined,
        }
      })
    
    currentStep.current = 0
    hasSpawnedCardsA.current = false
    hasSpawnedCardsB.current = false
    hasUnmounted.current = false

    nextStepCallback.current = null
    cardRevealTimeout.current = null
    gameBladeAnimationTimeout.current = null
    gameAnimationTimeout.current = null
  }

  if (!duelSceneStarted) return <></>

  return (
    <>
      <DuelProgress 
        isA
        name={nameA}
        duelId={duelId}
        duelStage={duelStage}
        duelistId={duelistIdA}
        completedStages={completedStagesA}
        canAutoReveal={canAutoRevealA}
        revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('A', cards)}
      />
      <DuelProgress
        isB
        name={nameB}
        duelId={duelId}
        duelStage={duelStage}
        duelistId={duelistIdB}
        completedStages={completedStagesB}
        canAutoReveal={canAutoRevealB}
        revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('B', cards)}
      />
      <Cards duelId={duelId} ref={cardRef} />
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/duel/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div className='TavernQuote' data-contentlength={Math.floor(quote.length / 10)}>{`"${quote}"`}</div>
        <div className='TavernTable' data-contentlength={Math.floor(description.length / 10)}>{description}</div>
      </div>

      {(isFinished && animated == AnimationState.Finished) &&  /*TODO add a modal? or something where the winner and wager will be displayed!  */
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
        </Segment>
      }

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile floated='left' duelistId={duelistIdA} />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile floated='left' duelistId={duelistIdA} damage={statsA.damage} hitChance={statsA.hitChance} speedFactor={duelSpeedFactor} />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag' >
          <DuelProfile floated='right' duelistId={duelistIdB} />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag' >
          <DuelistProfile floated='right' duelistId={duelistIdB} damage={statsB.damage} hitChance={statsB.hitChance} speedFactor={duelSpeedFactor} />
        </div>
      </div>

      {/* {duelProgress &&
        <div className='CenteredPanel'>
          <pre className='Code FillParent Scroller NoMargin'>
            {serialize(duelProgress, 2)}
          </pre>
        </div>
      } */}

      <MenuDuel duelStage={duelStage} duelId={duelId} tableId={tableId} />
      <MenuDuelControl 
        clickPlay={() => {
          isPlayingRef.current = !isPlayingRef.current
          setIsPlaying(isPlayingRef.current)
          if (isPlayingRef.current) {
            playStep()
          }
        }} 
        clickStep={() => {
          if (!isAnimatingStepRef.current) {
            playStep()
          }
        }} 
        clickReset={() => {
          resetDuel()
        }} 
        isPlaying={isPlaying} />

      <DuelistModal />

      <DojoSetupErrorDetector />

      {debugMode && <MenuDebugAnimations />}
    </>
  )
}

function DuelProfile({
  duelistId,
  floated
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
}) {
  const { profilePic, name, nameDisplay } = useDuelist(duelistId)
  const { owner } = useOwnerOfDuelist(duelistId)
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectDuelistId } = usePistolsContext()

  const contentLength = useMemo(() => Math.floor(nameDisplay.length/10), [nameDisplay])

  return (
    <>
      {floated == 'left' &&
        <>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)} >
            <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag' />
          </div>
          <Image className='NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), left: aspectWidth(8.3) }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><FameBalanceDuelist duelistId={duelistId}/></div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), right: aspectWidth(8.3), display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><FameBalanceDuelist duelistId={duelistId}/></div>
          </div>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)}>
            <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag' />
          </div>
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
        </>
      }
    </>
  )
}

function DuelistProfile({
  duelistId,
  floated,
  damage,
  hitChance,
  speedFactor
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  damage: number
  hitChance: number
  speedFactor: number
}) {
  const { score } = useDuelist(duelistId)
  const { aspectWidth } = useGameAspect()

  const [archetypeImage, setArchetypeImage] = useState<string>()
  const [lastDamage, setLastDamage] = useState(0)
  const [lastHitChance, setLastHitChance] = useState(0)

  useEffect(() => {
    // let imageName = 'duelist_' + ProfileModels[profilePic].toLowerCase() + '_' + ArchetypeNames[score.archetype].toLowerCase()
    let imageName = 'duelist_female_' + (ArchetypeNames[score.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[score.archetype].toLowerCase())
    setArchetypeImage('/images/' + imageName + '.png')
  }, [score])

  useEffect(() => {
    const damageDelta = damage - lastDamage
    if (damageDelta !== 0) {
      animateNumber(damageContainerRef, damageNumberRef)
      setLastDamage(damage)
    }
  }, [damage])

  useEffect(() => {
    const hitChanceDelta = hitChance - lastHitChance
    if (hitChanceDelta !== 0) {
      animateNumber(hitChanceContainerRef, hitChanceNumberRef)
      setLastHitChance(hitChance)
    }
  }, [hitChance])

  const animateNumber = (referenceContainer, referenceText) => {
    const endRotation = Math.random() * 10 * (floated == "left" ? 1 : -1);
    const startRotationText = Math.random() * 20 - 10;
    const endRotationText = Math.random() * 20 - 10;
    const duration = Constants.DRAW_CARD_BASE_DURATION / speedFactor;

    new TWEEN.Tween({ rotation: 0, rotationText: startRotationText, y: 0, scale: 0.9 })
      .to({ rotation: endRotation, rotationText: endRotationText, y: -150, scale: 1.6 }, duration)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate((value) => {
        referenceContainer.current.style.transform = `rotate(${value.rotation}deg) translateY(${value.y}px)`;
        referenceText.current.style.transform = `rotate(${value.rotationText}deg) scale(${value.scale})`;
      })
      .start();

    new TWEEN.Tween({ opacity: 0 })
      .to({ opacity: 1 }, duration / 4)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate((value) => {
        referenceText.current.style.opacity = value.opacity.toString();
      })
      .chain(new TWEEN.Tween({ opacity: 1 })
        .to({ opacity: 0 }, duration / 4)
        .delay(duration / 2)
        .onUpdate((value) => {
          referenceText.current.style.opacity = value.opacity.toString();
        })
        .onComplete(() => {
          referenceContainer.current.style.transform = `rotate(0deg) translateY(0px)`;
          referenceText.current.style.transform = `rotate(0deg) scale(0.9)`;
          referenceText.current.style.opacity = '0';
        })
      )
      .start();
  }

  const hitChanceContainerRef = useRef<HTMLDivElement>(null)
  const hitChanceNumberRef = useRef<HTMLDivElement>(null)
  const damageContainerRef = useRef<HTMLDivElement>(null)
  const damageNumberRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div className='DuelistHonourProgress NoMouse NoDrag' data-floated={floated}>
        <CircularProgressbar minValue={0} maxValue={100} circleRatio={10/15}  value={hitChance} strokeWidth={7} styles={buildStyles({ 
          pathColor: `#efc258`,
          trailColor: '#4c3926',
          strokeLinecap: 'butt',
          rotation: 0.6666666 })}/>
      </div>
      {floated == 'left' &&
        <>
          <ProfilePic className='NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{hitChance + "%"}</div>
          </div>
          <DuelistPistol damage={damage} floated={floated} />
          <Image className='NoMouse NoDrag' src='/images/ui/duel/duelist_profile.png' style={{ position: 'absolute' }} />

          <div ref={hitChanceContainerRef} className='NumberDeltaContainer NoMouse NoDrag'>
            <div ref={hitChanceNumberRef} className='NumberDelta HitChance' data-floated={floated}>
              {hitChance}%
            </div>
          </div>
          <div ref={damageContainerRef} className='NumberDeltaContainer NoMouse NoDrag'>
            <div ref={damageNumberRef} className='NumberDelta Damage' data-floated={floated}>
              {damage}
            </div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <ProfilePic className='FlipHorizontal NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{hitChance + "%"}</div>
          </div>
          <DuelistPistol damage={damage} floated={floated} />
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/duel/duelist_profile.png' style={{ position: 'absolute' }} />

          <div ref={hitChanceContainerRef} className='NumberDeltaContainer NoMouse NoDrag'>
            <div ref={hitChanceNumberRef} className='NumberDelta HitChance' data-floated={floated}>
              {/* { hitChanceDelta > 0 ? '+' : '' }{hitChanceDelta}% */}
              {hitChance}%
            </div>  
          </div>
          <div ref={damageContainerRef} className='NumberDeltaContainer NoMouse NoDrag'>
            <div ref={damageNumberRef} className='NumberDelta Damage' data-floated={floated}>
              {/* { damageDelta > 0 ? '+' : '' }{damageDelta} */}
              {damage}
            </div>
          </div>
        </>
      }
    </>
  )
}

function DuelistPistol({
  damage,
  floated,
}) {
  const { aspectWidth } = useGameAspect()
  const damageUrl = useMemo(() => {
    return '/images/ui/duel/gun/gun_damage_' + Math.min(damage, 4) + '.png'
  }, [damage])
  return (
    <>
      <div className='NoMouse NoDrag' style={{ position: 'absolute', width: aspectWidth(17.5), [floated == 'right' ? 'right' : 'left']: aspectWidth(8.9) }}>
        <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={'/images/ui/duel/gun/gun_main.png'} />
      </div>
      <div className='NoMouse NoDrag' style={{ position: 'absolute', width: aspectWidth(17.5), [floated == 'right' ? 'right' : 'left']: aspectWidth(8.9) }}>
        {damage > 0 && <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={damageUrl} />}
      </div>
    </>
  )
}


function DuelProgress({
  isA = false,
  isB = false,
  name,
  duelId,
  duelStage,
  duelistId,
  completedStages,
  revealCards,
  canAutoReveal = false
}) {
  const { gameImpl } = useThreeJsContext()
  const { round1, challenge: { tableId } } = useDuel(duelId)
  const round1Moves = useMemo(() => (isA ? round1?.moves_a : round1?.moves_b), [isA, round1])

  const duelProgressRef = useRef(null)


  //------------------------------
  // Duelist interaction
  //
  const { isConnected } = useAccount()
  const { isYou } = useIsYou(duelistId)

  // Commit modal control
  const [didReveal, setDidReveal] = useState(false)
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, tableId, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal)

  const onClick = useCallback(() => {
    if (!isConnected) console.warn(`onClickReveal: not connected!`)
    if (isYou && isConnected && completedStages[duelStage] === false) {
      if (duelStage == DuelStage.Round1Commit) {
        setCommitModalIsOpen(true)
      } else if (duelStage == DuelStage.Round1Reveal) {
        if (canReveal && !didReveal) {
          console.log(`reveal(${isA ? 'A' : 'B'}) hash:`, bigintToHex(round1Moves?.hashed ?? 0))
          setDidReveal(true)
          reveal()
        }
      }
    }
  }, [isYou, isConnected, duelStage, completedStages, canReveal])

  // auto-reveal
  useEffect(() => {
    if (canAutoReveal && canReveal) {
      onClick?.()
    }
  }, [onClick, canAutoReveal, canReveal])


  //-------------------------
  // Duel progression
  //
  useEffect(() => {
    gameImpl.updatePlayerProgress(isA, completedStages, onClick)
  }, [gameImpl, isA, completedStages, onClick])
  
  useEffect(() => {
    if (duelProgressRef.current) {
      gameImpl?.setDuelistElement(isA, duelProgressRef.current)
    }
  }, [gameImpl, duelProgressRef, isA, name]);

  const id = isA ? 'player-bubble-left' : 'player-bubble-right'

  const { canSign, sign_and_restore, hand } = useSignAndRestoreMovesFromHash(duelId, tableId, round1Moves?.hashed)

  useEffect(() =>{
    if (isYou && canSign) {
      sign_and_restore()
    }
  }, [canSign, isYou])

  useEffect(() =>{
    if (isYou && hand && hand.card_fire && hand.card_dodge && hand.card_tactics && hand.card_blades) {
      setTimeout(() => {
        revealCards({
          fire: hand.card_fire,
          dodge: hand.card_dodge,
          tactics: hand.card_tactics,
          blade: hand.card_blades,
        })
      }, 1000);
    }
  }, [hand, isYou])

  //------------------------------
  return (
    <>
      <CommitPacesModal duelId={duelId} isOpen={commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <div id={id} className='dialog-container NoMouse NoDrag' ref={duelProgressRef}>
        <Image className='dialog-background' />
        <div className='dialog-data'>
          <div className='dialog-title'></div>
          <div className='dialog-duelist'></div>
          <div className='dialog-content'>
            <button className='dialog-button'></button>
            <div className='dialog-quote'></div>
            <div className='dialog-spinner'></div>
          </div>
        </div>
      </div>
    </>
  )
}

//TODO on page refresh in duel, automatically pause duel and instead of the ready button call start button so sounds are enabled + duel starts properly
//TODO on refresh add a black overlay or round overlay with brown background that is shown and animated untill the assets are loaded and duel can be started!
//TODO on duel end add rechallenge option!