import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { useGameAspect } from '/src/hooks/useGameApect'
import { useOwnerOfDuelist } from '/src/hooks/useDuelistToken'
import { usePlayer } from '/src/stores/playerStore'
import { isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { AnimationData } from '/src/components/cards/Cards'
import { ArchetypeNames } from '/src/utils/pistols'
import { FameBalanceDuelist } from '/src/components/account/LordsBalance'
import { makeProfilePicUrl } from '/src/components/account/ProfilePic'
import * as TWEEN from '@tweenjs/tween.js'
import * as Constants from '/src/data/cardConstants'

interface DuelistCardProps {
  duelistId: number
  address?: BigNumberish
  width?: number
  height?: number
  classes?: string
  isLeft: boolean
  isFlipped?: boolean
  isVisible?: boolean
  isSelected?: boolean
  isDisabled?: boolean
  isDraggable?: boolean
  isHighlightable?: boolean
  isBig?: boolean
  isHanging?: boolean,
  isHangingLeft?: boolean
  shouldSwing?: boolean
  instantFlip?: boolean
  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
}

export interface DuelistCardHandle {
  flipCard: (flipped: boolean, degree: number, duration?: number, easing?: any, interpolation?: any) => void
  setPosition: (x: number[] | number, y: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setCardScale: (scale: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setCardRotation: (rotation: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  playHangingCard: () => void
  setCardZIndex: (index: number, backgroundIndex?: number) => void
  toggleVisibility: (isVisible: boolean) => void
  toggleHighlight: (isHighlighted: boolean, color?: string) => void
  toggleIdle: (isPlaying) => void
  getStyle: () => {
    translateX: number
    translateY: number
    rotation: number
    scale: number
  }
}

export const DuelistCard = forwardRef<DuelistCardHandle, DuelistCardProps>((props: DuelistCardProps, ref: React.Ref<DuelistCardHandle>) => {
  const { name, nameDisplay, profilePic, score } = useDuelist(props.duelistId)
  const { owner } = useOwnerOfDuelist(props.duelistId)
  const { name: playerName } = usePlayer(isPositiveBigint(props.address) ? props.address : owner)

  const [spring, setSpring] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [rotation, setRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [flipRotation, setFlipRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [scale, setScale] = useState<AnimationData>({dataField1: [], duration: 0})
  const [isDragging, setIsDragging] = useState(false)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const hangingRef = useRef<HTMLDivElement>(null)
  const cardBackgroundRef = useRef<HTMLDivElement>(null)
  const springRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ rotation: 0 })
  const hangRotationRef = useRef({ rotation: Math.random() < 0.5 ? 
        Math.random() * 20 - 30 : // Random between -30 and -10
        Math.random() * 20 + 10   // Random between 10 and 30 
  })
  const nailRotationRef = useRef({ rotation: Math.random() * 30 - 15 })
  const lastHangingRotationInteractionTimeRef = useRef(0)
  const flipRotationRef = useRef({ rotation: 0 })
  const scaleRef = useRef({ scale: 1 })

  const tweenMovementRef = useRef<TWEEN.Tween<{ x: number; y: number }>>()
  const tweenRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenHangRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenFlipRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenScaleRef = useRef<TWEEN.Tween<{ scale: number }>>()
  const idleTweenRef = useRef<TWEEN.Tween<{ x: number; y: number }> | null>(null)
  const initialLoad = useRef<boolean>(true)

  const { boxW, boxH, aspectWidth } = useGameAspect()

  const [randomOffset] = useState(() => {
    if (props.isHangingLeft == true) {
      return aspectWidth(props.width) * (Math.random() * -0.4)
    } else if (props.isHangingLeft == false) {
      return aspectWidth(props.width) * (Math.random() * 0.4)
    } else {
      return aspectWidth(props.width) * (Math.random() * 0.4 - 0.20)
    }
  })
  
  const archetypeImage = useMemo(() => {
    let imageName = 'card_circular_' + (ArchetypeNames[score.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[score.archetype].toLowerCase())
    return '/textures/cards/' + imageName + '.png'
  }, [score])


  useImperativeHandle(ref, () => ({
    flipCard,
    setPosition,
    setCardScale,
    setCardRotation,
    setCardZIndex,
    toggleVisibility,
    toggleHighlight,
    playHangingCard,
    toggleIdle,
    getStyle: () => ({
      translateX: springRef.current.x,
      translateY: springRef.current.y,
      rotation: rotationRef.current.rotation,
      scale: scaleRef.current.scale
    }),
  }))

  useEffect(() => {
    if (props.isHanging && hangingRef.current) {
      hangingRef.current.style.setProperty('--hang-rotation', `${hangRotationRef.current.rotation}deg`)
    } else if (!props.isHanging) {
      hangRotationRef.current.rotation = 0
      hangingRef.current.style.setProperty('--hang-rotation', '0deg')
    }
  }, [hangingRef, props.isHanging])

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current?.style.setProperty('--card-width', `${aspectWidth(props.width)}px`)
      cardRef.current?.style.setProperty('--card-height', `${aspectWidth(props.height)}px`)
      
      cardBackgroundRef.current.style.setProperty('--card-width', `${aspectWidth(props.width)}px`)
      cardBackgroundRef.current.style.setProperty('--card-height', `${aspectWidth(props.height)}px`)

      hangingRef.current.style.setProperty('--card-width', `${aspectWidth(props.width)}px`)
      hangingRef.current.style.setProperty('--card-height', `${aspectWidth(props.height)}px`)
      hangingRef.current.style.setProperty('--random-offset', `${randomOffset}px`)
    }
  }, [props.width, props.height, aspectWidth, randomOffset])

  useEffect(() => {
    if (cardRef.current) {
      if (tweenMovementRef.current) {
        tweenMovementRef.current.stop()
      }

      tweenMovementRef.current = new TWEEN.Tween(springRef.current)
        .to({ x: spring.dataField1, y: spring.dataField2 }, spring.duration)
        .easing(spring.easing)
        .interpolation(spring.interpolation)
        .onUpdate((value) => {
          cardRef.current?.style.setProperty('--card-translate-x', `${value.x}px`)
          cardRef.current?.style.setProperty('--card-translate-y', `${value.y}px`)
          if (cardBackgroundRef.current) {
            cardBackgroundRef.current.style.setProperty('--card-translate-x', `${value.x}px`)
            cardBackgroundRef.current.style.setProperty('--card-translate-y', `${value.y}px`)
          }
        })
        .start()
    }
  }, [spring])

  useEffect(() => {
    if (cardRef.current) {
      if (tweenRotationRef.current) {
        tweenRotationRef.current.stop()
      }

      tweenRotationRef.current = new TWEEN.Tween(rotationRef.current)
        .to({ rotation: rotation.dataField1 }, rotation.duration)
        .easing(rotation.easing)
        .interpolation(rotation.interpolation)
        .onUpdate((value) => {
          cardRef.current?.style.setProperty('--card-rotation', `${value.rotation}deg`)
          if (cardBackgroundRef.current) {
            cardBackgroundRef.current.style.setProperty('--card-rotation', `${value.rotation}deg`)
          }
        })
        .start()
    }
  }, [rotation])

  useEffect(() => {
    if (cardRef.current) {
      if (tweenFlipRotationRef.current) {
        tweenFlipRotationRef.current.stop()
      }

      tweenFlipRotationRef.current = new TWEEN.Tween(flipRotationRef.current)
        .to({ rotation: flipRotation.dataField1 }, flipRotation.duration)
        .easing(flipRotation.easing)
        .interpolation(flipRotation.interpolation)
        .onUpdate((value) => {
          const innerElement = cardRef.current?.querySelector('.card-inner') as HTMLElement
          innerElement?.style.setProperty('--card-flip-rotation', `${value.rotation}deg`);
        })
        .start()
    }
  }, [flipRotation])

  useEffect(() => {
    flipCard(props.isFlipped, props.isLeft ? Constants.CARD_FLIP_ROTATION : -Constants.CARD_FLIP_ROTATION, props.instantFlip ? 0 : Constants.CARD_BASE_FLIP_DURATION)
  }, [props.isFlipped])

  useEffect(() => {
    if (cardRef.current) {
      if (tweenScaleRef.current) {
        tweenScaleRef.current.stop()
      }

      tweenScaleRef.current = new TWEEN.Tween(scaleRef.current)
        .to({ scale: scale.dataField1 }, scale.duration)
        .easing(scale.easing)
        .interpolation(scale.interpolation)
        .onUpdate((value) => {
          cardRef.current?.style.setProperty('--card-scale', `${value.scale}`)
          if (cardBackgroundRef.current) {
            cardBackgroundRef.current.style.setProperty('--card-scale', `${value.scale}`)
          }
        })
        .start()
    }
  }, [scale])

  useEffect(() => {
    toggleVisibility(props.isVisible)
  }, [props.isVisible])

  useEffect(() => {
    playHangingCard()
  }, [props.isHanging])

  const flipCard = (flipped = false, degree = 0, duration = Constants.CARD_BASE_FLIP_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setFlipRotation({ dataField1: [flipped ? degree : 0], duration: duration, easing: easing, interpolation: interpolation })
  }

  const toggleHighlight = (isHighlighted: boolean, color?: string)  => {
    if (cardRef.current?.style.opacity != '1') return
    if (isHighlighted) {
      cardBackgroundRef.current.style.opacity = '1'
      cardBackgroundRef.current.style.setProperty('--background-color', 'white')
    } else {
      cardBackgroundRef.current.style.opacity = '0'
    }
  }

  const toggleVisibility = (isVisible)  => {
    if (!cardRef.current) return

    if (isVisible) {
      cardRef.current.style.opacity = '1'
    } else {
      cardRef.current.style.opacity = '0'
    }
  }

  const playHangingCard = () => {
    if (!props.isHanging) return
    const animateHanging = (startAngle: number) => {
      if (!hangingRef.current) return
      
      if (tweenHangRotationRef.current) {
        tweenHangRotationRef.current.stop()
      }

       const percentage = Math.abs(randomOffset) / (aspectWidth(props.width) * 0.15)
      const targetRestAngle = randomOffset < 0 ? percentage * 3 : percentage * -3

      let targetAngle;
      if (Math.abs(startAngle - targetRestAngle) < 2) {
        targetAngle = startAngle + (startAngle < targetRestAngle ? Math.random() : - Math.random())
      } else {
        targetAngle = (startAngle / 3) * -2
      }

      if (props.shouldSwing == false && initialLoad.current) {
        hangRotationRef.current.rotation = targetRestAngle
        initialLoad.current = false
        hangingRef.current?.style.setProperty('--hang-rotation', `${targetRestAngle}deg`) 
        animateHanging(targetRestAngle)
      } else {
        tweenHangRotationRef.current = new TWEEN.Tween(hangRotationRef.current)
          .to({ rotation: targetAngle }, 1000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate((value) => {
            hangingRef.current?.style.setProperty('--hang-rotation', `${value.rotation}deg`)
          })
          .onComplete(() => {
            animateHanging(targetAngle)
          })
          .start()
      }
    }

    animateHanging(hangRotationRef.current.rotation)
  }

  const toggleIdle = (isPlayingIdle: boolean) => {
    const innerElement = cardRef.current?.querySelector('.card-inner') as HTMLElement
    const backgroundElement = cardBackgroundRef?.current

    if (idleTweenRef.current) {
      idleTweenRef.current.stop()
      idleTweenRef.current = null
    }

    if (isPlayingIdle) {
      const animateIdle = () => {
        const range = aspectWidth(Constants.IDLE_RANGE)
        const startRange = -range / 2
        const duration = (1 + Math.random()) * Constants.IDLE_DURATION

        const newTarget = {
          x: Array.from({ length: Constants.IDLE_LENGTH }, () => startRange + Math.random() * range),
          y: Array.from({ length: Constants.IDLE_LENGTH }, () => startRange + Math.random() * range)
        }

        idleTweenRef.current = new TWEEN.Tween({ x: 0, y: 0 })
          .to(newTarget, duration)
          .interpolation(TWEEN.Interpolation.CatmullRom)
          .easing(TWEEN.Easing.Sinusoidal.InOut)
          .onUpdate((value) => {
            if (innerElement) {
              innerElement?.style.setProperty('--idle-translate-x', `${value.x}px`)
              innerElement?.style.setProperty('--idle-translate-y', `${value.y}px`)
            }
            if (backgroundElement) {
              backgroundElement.style.setProperty('--idle-translate-x', `${value.x}px`)
              backgroundElement.style.setProperty('--idle-translate-y', `${value.y}px`)
            }
          })
          .onComplete(animateIdle)
          .start()
      }

      animateIdle()
    } else {
      if (innerElement) {
        innerElement?.style.setProperty('--idle-translate-x', '0px')
        innerElement?.style.setProperty('--idle-translate-y', '0px')
      }
      if (backgroundElement) {
        backgroundElement.style.setProperty('--idle-translate-x', '0px')
        backgroundElement.style.setProperty('--idle-translate-y', '0px')
      }
    }
  }

  const setPosition = (x: number[] | number, y: number[] | number, duration = Constants.CARD_BASE_POSITION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setSpring({ dataField1: Array.isArray(x) ? x : [x], dataField2: Array.isArray(y) ? y : [y], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setCardRotation = (rotation: number[] | number, duration = Constants.CARD_BASE_ROTATION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setRotation({ dataField1: Array.isArray(rotation) ? rotation : [rotation], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setCardScale = (scale: number[] | number, duration = Constants.CARD_BASE_SCALE_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setScale({ dataField1: Array.isArray(scale) ? scale : [scale], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setCardZIndex = (index: number, backgroundIndex?: number) => {
    cardRef.current?.style.setProperty('--card-z-index', index.toString())
    if (cardBackgroundRef.current) {
      cardBackgroundRef.current.style.setProperty('--card-z-index', backgroundIndex ? backgroundIndex.toString() : index.toString())
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isDragging) return
    
    if (props.isHanging && Date.now() - lastHangingRotationInteractionTimeRef.current > 2000) {
      const cardRect = cardRef.current?.getBoundingClientRect()
      if (!cardRect) return

      const cardCenterX = cardRect.left + cardRect.width / 2
      const isFromLeft = e.clientX < cardCenterX

      if (tweenHangRotationRef.current) {
        tweenHangRotationRef.current.stop()
      }

      tweenHangRotationRef.current = new TWEEN.Tween(hangRotationRef.current)
        .to({ rotation: isFromLeft ? Math.max(hangRotationRef.current.rotation - (Math.random() * 8 + 8), -40) : Math.min(hangRotationRef.current.rotation + (Math.random() * 8 + 8), 40) }, 600)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate((value) => {
          hangingRef.current?.style.setProperty('--hang-rotation', `${value.rotation}deg`)
        })
        .onComplete(() => {
          playHangingCard()
        })
        .start()

      lastHangingRotationInteractionTimeRef.current = Date.now()
    }

    if (props.isHighlightable) toggleHighlight(true)
    props.onHover && props.onHover(true)
  }

  const handleMouseLeave = () => {
    if (isDragging) return
    if (props.isHighlightable && !props.isSelected) toggleHighlight(false)
    props.onHover && props.onHover(false)
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX - springRef.current.x
    const startY = e.clientY - springRef.current.y
    
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startTime = Date.now()
    let mouseMove = false
    
    const oldPositionX = springRef.current.x
    const oldPositionY = springRef.current.y
    const startRotation = rotation
    const startScale = scale

    const width = aspectWidth(props.width)
    const height = aspectWidth(props.height)

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY

      const deltaX = Math.abs(startClientX - e.clientX)
      const deltaY = Math.abs(startClientY - e.clientY)

      if ((deltaX > 10 || deltaY > 10) && !mouseMove && props.isDraggable) {
        mouseMove = true
        setIsDragging(true)
        setCardRotation(0)
        setCardScale(1.8)
      }

      if (mouseMove) {
        const limitedX = Math.max((-window.innerWidth / 2) + boxW + (width / 2), Math.min(newX, (window.innerWidth / 2) - boxW - (width / 2)))
        const limitedY = Math.max((-window.innerHeight / 2) + boxH + (height / 2), Math.min(newY, (window.innerHeight / 2) - boxH - (height / 2)))

        setSpring({ dataField1: [limitedX], dataField2: [limitedY], duration: 0, easing: TWEEN.Easing.Quadratic.InOut })
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      const endTime = Date.now()
      setIsDragging(false)

      if (endTime - startTime < 150 && !mouseMove) {
        props.onClick && props.onClick(e)
      } else if (mouseMove) {
        setPosition(oldPositionX, oldPositionY, Constants.CARD_POSITION_RESET_DURATION)
        setRotation(startRotation)
        setScale(startScale)

        handleMouseLeave()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [props.isDraggable, spring, boxW, boxH, props.width, props.height, scale, rotation, props.onClick])

  const _nameLength = (name: string) => {
    return name ? Math.floor(name.length / 10) : 31
  }

  const testName = '1234567890123456789012345678901'

  return (
    <div className='duelist-card-container'>
      {props.isHanging && <div className="duelist-nail" style={{ 
        width: aspectWidth(0.6),
        height: aspectWidth(1.2),
        left: aspectWidth(props.width) / 2 - aspectWidth(0.3) + randomOffset,
        top: aspectWidth(props.height) * 0.03 - aspectWidth(1.2),
        transform: `rotate(${nailRotationRef.current.rotation}deg)` 
      }}>
        <div className="duelist-nail-point" style={{
          width: aspectWidth(0.2),
          height: aspectWidth(1),
          left: aspectWidth(0.2),
          top: aspectWidth(0.2),
          }}/>
        <div className="duelist-nail-point" style={{
          width: aspectWidth(0.6),
          height: aspectWidth(0.4),
          left: 0,
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}/>
      </div>}
      <div 
        ref={hangingRef} 
        className='card-hanging-container'
      >
        <div className='card' ref={cardBackgroundRef}>
          <div className='card-outline'/>
        </div>
        <div 
          ref={cardRef}
          className='card'
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-inner">
            <div className="card-front NoMouse NoDrag">
              <div id='card-filter-overlay' className={props.isSelected ? 'visible selected' : 'selected'} />
              <img id='card-filter-overlay' className={props.isDisabled ? 'visible' : ''} src='/textures/cards/card_disabled.png' />
              {/* <div id='card-filter-overlay' className={props.isDisabled ? 'visible disabled' : 'disabled'} /> */}
              <img className='duelist-card-image-drawing NoMouse NoDrag' src={makeProfilePicUrl(profilePic, true)} alt="Profile Picture" />
              <img className='card-image-front NoMouse NoDrag' src={archetypeImage} alt="Card Front" />
              <div className="duelist-card-details">
                {
                  props.duelistId ?
                    <>
                      <div className="duelist-name" data-contentlength={_nameLength(name)}>{name}</div>
                      <div className="duelist-name Smaller" data-contentlength={_nameLength(playerName)}>({playerName})</div>
                    </>
                    : <div className="duelist-name" data-contentlength={_nameLength(playerName)}>{playerName}</div>
                }
                <div className="duelist-fame">
                  <FameBalanceDuelist duelistId={props.duelistId} />
                </div>
              </div>
            </div>
            <div className="card-back NoMouse NoDrag"></div>
          </div>
        </div>
      </div>
    </div>
  )
})