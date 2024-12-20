import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import useGameAspect from '@/pistols/hooks/useGameApect'
import * as TWEEN from '@tweenjs/tween.js'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { CardData, FireCardsTextures } from '../../data/assets'
import * as Constants from '../../data/cardConstants'

interface CardProps {
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
  isMiniature?: boolean
  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
}

export interface CardHandle {
  flipCard: (flipped: boolean, degree: number, duration?: number, easing?: any, interpolation?: any) => void
  setPosition: (x: number[] | number, y: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setCardScale: (scale: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setCardRotation: (rotation: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setCardZIndex: (index: number, backgroundIndex?: number) => void
  setCardData: (data: CardData) => void
  toggleVisibility: (isVisible: boolean) => void
  toggleHighlight: (isHighlighted: boolean, shouldBeWhite?: boolean, color?: string) => void
  toggleIdle: (isPlaying) => void
  getStyle: () => {
    translateX: number
    translateY: number
    rotation: number
    scale: number
  }
}

export enum DuelistCardType {
  TACTICS,
  FIRE,
  DODGE,
  BLADE,
}

export interface AnimationData {
  dataField1: number[],
  dataField2?: number[],
  duration?: number,
  easing?: any,
  interpolation?: any,
}

export const Card = forwardRef<CardHandle, CardProps>((props: CardProps, ref: React.Ref<CardHandle>) => {
  const [spring, setSpring] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [rotation, setRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [flipRotation, setFlipRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [scale, setScale] = useState<AnimationData>({dataField1: [], duration: 0})
  const [cardData, setCardData] = useState<CardData>(FireCardsTextures.None)
  const [isDragging, setIsDragging] = useState(false)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const cardBackgroundRef = useRef<HTMLDivElement>(null)
  const springRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ rotation: 0 })
  const flipRotationRef = useRef({ rotation: 0 })
  const scaleRef = useRef({ scale: 1 })

  const tweenMovementRef = useRef<TWEEN.Tween<{ x: number; y: number }>>()
  const tweenRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenFlipRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenScaleRef = useRef<TWEEN.Tween<{ scale: number }>>()
  const idleTweenRef = useRef<TWEEN.Tween<{ x: number; y: number }> | null>(null)

  const { boxW, boxH, aspectWidth, aspectW, aspectH } = useGameAspect()


  useImperativeHandle(ref, () => ({
    flipCard,
    setPosition,
    setCardScale,
    setCardRotation,
    setCardZIndex,
    setCardData,
    toggleVisibility,
    toggleHighlight,
    toggleIdle,
    getStyle: () => ({
      translateX: springRef.current.x,
      translateY: springRef.current.y,
      rotation: rotationRef.current.rotation,
      scale: scaleRef.current.scale
    }),
  }))

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current?.style.setProperty('--card-width', `${aspectWidth(props.width)}px`)
      cardRef.current?.style.setProperty('--card-height', `${aspectWidth(props.height)}px`)

      if (cardBackgroundRef.current) {
        cardBackgroundRef.current.style.setProperty('--card-width', `${aspectWidth(props.width)}px`)
        cardBackgroundRef.current.style.setProperty('--card-height', `${aspectWidth(props.height)}px`)
      }
    }
  }, [props.width, props.height, boxW, boxH])

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
    flipCard(props.isFlipped, props.isLeft ? Constants.CARD_FLIP_ROTATION : -Constants.CARD_FLIP_ROTATION)
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

  const flipCard = (flipped = false, degree = 0, duration = Constants.CARD_BASE_FLIP_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setFlipRotation({ dataField1: [flipped ? degree : 0], duration: duration, easing: easing, interpolation: interpolation })
  }

  const toggleHighlight = (isHighlighted: boolean, shouldBeWhite?: boolean)  => {
    if (cardRef.current?.style.opacity != '1') return
    if (isHighlighted) {
      cardBackgroundRef.current.style.opacity = '1'
      cardBackgroundRef.current.style.setProperty('--background-color', cardData.color ? (shouldBeWhite ? 'white' : cardData.color) : 'white')
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

  const handleMouseEnter = () => {
    if (isDragging) return
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

  const titleClass = useMemo(() => (cardData.titleShort?.length < 4 ? 'title-small' : ''), [cardData])

  return (
    <>
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
            <div id='card-filter-overlay' className={props.isDisabled ? 'visible disabled' : 'disabled'} />
            <div id='card-filter-overlay' className={props.isSelected ? 'visible selected' : 'selected'} />
            <img className='card-image-drawing NoMouse NoDrag' src={cardData.path} alt="Card Background" />
            <img className='card-image-front NoMouse NoDrag' src={cardData.cardFrontPath} alt="Card Front" />
            {props.isMiniature ? (
              <div className="card-details-mini">
                <div className={`card-title-mini ${titleClass}`}>{cardData.titleShort ? cardData.titleShort : cardData.title}</div>
              </div>
            ) : (
              <div className="card-details">
                <div className="card-title">{cardData.title}</div>
                <div className="card-rarity">{cardData.rarity == constants.Rarity.None ? '   ' : cardData.rarity}</div>
                <div className="card-description" dangerouslySetInnerHTML={{ __html: cardData.description }} />
              </div>
            )}
          </div>
          <div className="card-back NoMouse NoDrag"></div>
        </div>
      </div>
    </>
  )
})
