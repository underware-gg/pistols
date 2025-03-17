import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, SemanticFLOATS } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useGetSeasonScoreboard } from '/src/hooks/useScore'
import { ArchetypeNames } from '/src/utils/pistols'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { ProfilePic } from '/src/components/account/ProfilePic'
import * as Constants from '/src/data/cardConstants'
import * as TWEEN from '@tweenjs/tween.js'
import { useDuelist } from '/src/stores/duelistStore'
import { usePistolsContext } from '/src/hooks/PistolsContext'

export default function DuelistProfile({
  duelistId,
  floated,
  damage,
  hitChance,
  speedFactor,
  tutorialLevel
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  damage: number
  hitChance: number
  speedFactor: number
  tutorialLevel: DuelTutorialLevel
}) {
  const score = useGetSeasonScoreboard(duelistId)
  const { aspectWidth } = useGameAspect()

  const { dispatchSelectDuelistId } = usePistolsContext()

  const [archetypeImage, setArchetypeImage] = useState<string>()
  const [lastDamage, setLastDamage] = useState(0)
  const [lastHitChance, setLastHitChance] = useState(0)

  const { profilePic, profileType, name, nameAndId } = useDuelist(duelistId)

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
    if (tutorialLevel === DuelTutorialLevel.SIMPLE) return
    
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

  if (tutorialLevel === DuelTutorialLevel.SIMPLE) return null

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
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)}>
            <ProfilePic className='NoMouse NoDrag ProfilePicDuel' duel circle profilePic={profilePic} profileType={profileType} />
          </div>
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
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)}>
            <ProfilePic className='FlipHorizontal NoMouse NoDrag ProfilePicDuel' duel circle profilePic={profilePic} profileType={profileType} />
          </div>
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