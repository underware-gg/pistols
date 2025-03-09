import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { CardColor} from '/src/data/cardAssets'
import * as TWEEN from '@tweenjs/tween.js'
import * as Constants from '/src/data/cardConstants'

export interface InteractibleComponentProps {
  width?: number //make sure it sends aspectWidth or aspectHeight for both width and height always!
  height?: number
  isLeft: boolean
  isFlipped?: boolean
  isVisible?: boolean
  isSelected?: boolean
  isDisabled?: boolean
  isDraggable?: boolean
  isHighlightable?: boolean
  isHanging?: boolean,
  isHangingLeft?: boolean
  shouldSwing?: boolean
  instantFlip?: boolean
  instantVisible?: boolean
  
  hasBorder?: boolean
  hasCenteredOrigin?: boolean
  mouseDisabled?: boolean

  frontImagePath?: string,
  backgroundImagePath?: string,
  defaultHighlightColor?: CardColor,

  childrenBehindFront?: React.ReactNode
  childrenInFront?: React.ReactNode
  childrenInBack?: React.ReactNode

  startPosition?: { x: number, y: number }
  startRotation?: number
  startScale?: number
  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
}

export interface InteractibleComponentHandle {
  flip: (flipped: boolean, isLeft?: boolean, duration?: number, degrees?: number, easing?: any, interpolation?: any) => void
  setPosition: (x: number[] | number, y: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setScale: (scale: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setRotation: (rotation: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setZIndex: (index: number, backgroundIndex?: number) => void
  toggleVisibility: (isVisible: boolean) => void
  toggleHighlight: (isHighlighted: boolean, shouldBeWhite?: boolean, color?: string) => void
  toggleDefeated: (isDefeated: boolean) => void //TODO remove and add to where needed only?
  playHanging: () => void
  toggleIdle: (isPlaying: boolean) => void
  toggleBlink: (isBlinking: boolean, duration?: number) => void
  getStyle: () => {
    translateX: number
    translateY: number
    rotation: number
    scale: number
  }
}

export interface AnimationData {
  dataField1: number[],
  dataField2?: number[],
  duration?: number,
  easing?: any,
  interpolation?: any,
}

export const InteractibleComponent = forwardRef<InteractibleComponentHandle, InteractibleComponentProps>((props: InteractibleComponentProps, ref: React.Ref<InteractibleComponentHandle>) => {
  const { boxW, boxH, aspectWidth } = useGameAspect()

  //TransformData
  const [spring, setSpring] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [rotation, setRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [flipRotation, setFlipRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [scale, setScale] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  const [highlight, setHighlight] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  const [visibility, setVisibility] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  
  //State data
  const [isDragging, setIsDragging] = useState(false)
  const [isDefeated, setIsDefeated] = useState(false)
  
  //Component data
  const offsetRandomnessRef = useRef(Math.random())
  
  const randomOffset = useMemo(() => {
    if (props.isHangingLeft == true) {
      return props.width * (offsetRandomnessRef.current * -0.35)
    } else if (props.isHangingLeft == false) {
      return props.width * (offsetRandomnessRef.current * 0.35)
    } else {
      return props.width * (offsetRandomnessRef.current * 0.4 - 0.2)
    }
  }, [props.isHangingLeft, props.width])
  
  const targetRestAngle = useMemo(() => {
    const percentage = Math.abs(randomOffset) / (props.width * 0.35)
    return randomOffset < 0 ? percentage * 35 : percentage * -35
  }, [randomOffset, props.width])

  const frontRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const hangingRef = useRef<HTMLDivElement>(null)
  const hangingNailRef = useRef<HTMLDivElement>(null)
  const hangRotationRef = useRef({ rotation: randomOffset < 0 ? 
        targetRestAngle + Math.random() * 20 :
        targetRestAngle - Math.random() * 20
  })
  const nailRotationRef = useRef({ rotation: Math.random() * 30 - 15 })
  const lastHangingRotationInteractionTimeRef = useRef(0)
  const initialLoad = useRef<boolean>(true)
  
  const springRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ rotation: 0 })
  const flipRotationRef = useRef({ rotation: 0 })
  const scaleRef = useRef({ scale: 1 })
  const highlightRef = useRef({ opacity: 0 })
  const visibilityRef = useRef({ opacity: 0 })
  const isBlinkingRef = useRef(false)
  const isHoveringRef = useRef(false)

  const tweenMovementRef = useRef<TWEEN.Tween<{ x: number; y: number }>>()
  const tweenRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenFlipRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenScaleRef = useRef<TWEEN.Tween<{ scale: number }>>()
  const tweenHighlightRef = useRef<TWEEN.Tween<{ opacity: number }>>()
  const tweenVisibilityRef = useRef<TWEEN.Tween<{ opacity: number }>>()
  const tweenHangRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const idleTweenRef = useRef<TWEEN.Tween<{ x: number; y: number }> | null>(null)
  const blinkTweenRef = useRef<TWEEN.Tween<{ opacity: number }> | null>(null)

  useImperativeHandle(ref, () => ({
    flip: flipComponent,
    setPosition: setComponentPosition,
    setScale: setComponentScale,
    setRotation: setComponentRotation,
    setZIndex: setComponentZIndex,
    toggleVisibility,
    toggleHighlight,
    toggleDefeated,
    toggleIdle,
    toggleBlink,
    playHanging: playHanging,
    getStyle: () => ({
      translateX: springRef.current.x,
      translateY: springRef.current.y,
      rotation: rotationRef.current.rotation,
      scale: scaleRef.current.scale
    }),
  }))

  useEffect(() => {
    if (hangingRef.current) {
      hangingRef.current.style.setProperty('--component-width', `${props.width}px`)
      hangingRef.current.style.setProperty('--component-height', `${props.height}px`)
      hangingRef.current.style.setProperty('--random-offset', `${randomOffset}px`)
    }

    if (frontRef.current) {
      frontRef.current?.style.setProperty('--component-width', `${props.width}px`)
      frontRef.current?.style.setProperty('--component-height', `${props.height}px`)
    }

    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--component-width', `${props.width}px`)
      backgroundRef.current.style.setProperty('--component-height', `${props.height}px`)
    }
  }, [props.width, props.height, boxW, boxH])

  useEffect(() => {
    if (frontRef.current) {
      frontRef.current.style.setProperty('--component-border-radius', props.hasBorder ? `${props.width * 0.065}px` : '0px')
      frontRef.current.style.setProperty('--component-border-shadow', props.hasBorder ? `${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px rgba(20, 20, 20, 0.6)` : 'none')
    }
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--component-border-radius', props.hasBorder ? `${props.width * 0.065}px` : '0px')
      backgroundRef.current.style.setProperty('--component-border-shadow', props.hasBorder ? `${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px rgba(20, 20, 20, 0.6)` : 'none')
    }
  }, [props.hasBorder])

  useEffect(() => {
    if (hangingNailRef.current) {
      hangingNailRef.current.style.setProperty('--random-offset', `${-randomOffset}px`)
    }
  }, [randomOffset])

  useEffect(() => {
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--background-color', props.defaultHighlightColor ? props.defaultHighlightColor : 'white')
    }
  }, [props.defaultHighlightColor])

  useEffect(() => {
    if (frontRef.current) {
      frontRef.current.style.setProperty('--component-origin', props.hasCenteredOrigin ? 'center' : 'center bottom')
    }
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--component-origin', props.hasCenteredOrigin ? 'center' : 'center bottom')
    }
  }, [props.hasCenteredOrigin])

  useEffect(() => {
    if (frontRef.current) {
      frontRef.current.style.setProperty('--component-cursor', props.mouseDisabled ? 'default' : 'pointer')
    }
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--component-cursor', props.mouseDisabled ? 'default' : 'pointer')
    }
  }, [props.mouseDisabled])

  useEffect(() => {
    if (frontRef.current) {
      if (tweenMovementRef.current) {
        tweenMovementRef.current.stop()
      }

      tweenMovementRef.current = new TWEEN.Tween(springRef.current)
        .to({ x: spring.dataField1, y: spring.dataField2 }, spring.duration)
        .easing(spring.easing)
        .interpolation(spring.interpolation)
        .onUpdate((value) => {
          frontRef.current?.style.setProperty('--translate-x', `${value.x}px`)
          frontRef.current?.style.setProperty('--translate-y', `${value.y}px`)
          if (backgroundRef.current) {
            backgroundRef.current.style.setProperty('--translate-x', `${value.x}px`)
            backgroundRef.current.style.setProperty('--translate-y', `${value.y}px`)
          }
        })
        .start()
    }
  }, [spring])

  useEffect(() => {
    if (frontRef.current) {
      if (tweenRotationRef.current) {
        tweenRotationRef.current.stop()
      }

      tweenRotationRef.current = new TWEEN.Tween(rotationRef.current)
        .to({ rotation: rotation.dataField1 }, rotation.duration)
        .easing(rotation.easing)
        .interpolation(rotation.interpolation)
        .onUpdate((value) => {
          frontRef.current?.style.setProperty('--rotation', `${value.rotation}deg`)
          if (backgroundRef.current) {
            backgroundRef.current.style.setProperty('--rotation', `${value.rotation}deg`)
          }
        })
        .start()
    }
  }, [rotation])

  useEffect(() => {
    if (frontRef.current) {
      if (tweenFlipRotationRef.current) {
        tweenFlipRotationRef.current.stop()
      }

      tweenFlipRotationRef.current = new TWEEN.Tween(flipRotationRef.current)
        .to({ rotation: flipRotation.dataField1 }, flipRotation.duration)
        .easing(flipRotation.easing)
        .interpolation(flipRotation.interpolation)
        .onUpdate((value) => {
          const innerElement = frontRef.current?.querySelector('.component-inner') as HTMLElement
          innerElement?.style.setProperty('--flip-rotation', `${value.rotation}deg`);

          const componentOutline = backgroundRef.current?.querySelector('.component-outline') as HTMLElement
          componentOutline?.style.setProperty('--flip-rotation', `${value.rotation}deg`);
        })
        .start()
    }
  }, [flipRotation])

  useEffect(() => {
    if (frontRef.current) {
      if (tweenScaleRef.current) {
        tweenScaleRef.current.stop()
      }

      tweenScaleRef.current = new TWEEN.Tween(scaleRef.current)
        .to({ scale: scale.dataField1 }, scale.duration)
        .easing(scale.easing)
        .interpolation(scale.interpolation)
        .onUpdate((value) => {
          frontRef.current?.style.setProperty('--scale', `${value.scale}`)
          if (backgroundRef.current) {
            backgroundRef.current.style.setProperty('--scale', `${value.scale}`)
          }
        })
        .start()
    }
  }, [scale])

  useEffect(() => {
    if (backgroundRef.current) {
      if (tweenHighlightRef.current) {
        tweenHighlightRef.current.stop()
      }
      if (isBlinkingRef.current) {
        blinkTweenRef.current.stop()
      }

      tweenHighlightRef.current = new TWEEN.Tween(highlightRef.current)
        .to({ opacity: highlight.dataField1 }, highlight.duration)
        .easing(highlight.easing)
        .interpolation(highlight.interpolation)
        .onUpdate((value) => {
          backgroundRef.current?.style.setProperty('--visibility', `${value.opacity}`)
        })
        .start()
    }
  }, [highlight])

  useEffect(() => {
    if (frontRef.current) {
      if (tweenVisibilityRef.current) {
        tweenVisibilityRef.current.stop()
      }

      tweenVisibilityRef.current = new TWEEN.Tween(visibilityRef.current)
        .to({ opacity: visibility.dataField1 }, visibility.duration)
        .easing(visibility.easing)
        .interpolation(visibility.interpolation)
        .onUpdate((value) => {
          frontRef.current?.style.setProperty('--visibility', `${value.opacity}`)
        })
        .start()
    }
  }, [visibility])

  useEffect(() => {
    toggleVisibility(props.isVisible, props.instantVisible)
  }, [props.isVisible, props.instantVisible])

  useEffect(() => {
    playHanging()
  }, [props.isHanging])

  useEffect(() => {
    flipComponent(props.isFlipped, props.isLeft, props.instantFlip ? 0 : Constants.CARD_BASE_FLIP_DURATION)
  }, [props.isFlipped, props.instantFlip])

  useEffect(() => {
    if (props.startPosition) {
      setComponentPosition(props.startPosition?.x, props.startPosition?.y, 0)
    }
  }, [props.startPosition])

  useEffect(() => {
    if (props.startRotation) {
      setComponentRotation(props.startRotation, 0)
    }
  }, [props.startRotation])

  useEffect(() => {
    if (props.startScale) {
      setComponentScale(props.startScale, 0)
    }
  }, [props.startScale])

  useEffect(() => {
    if (!hangingRef.current) return
    if (props.isHanging) {
      hangingRef.current.style.setProperty('--hang-rotation', `${hangRotationRef.current.rotation}deg`)
    } else if (!props.isHanging) {
      hangRotationRef.current.rotation = 0
      hangingRef.current.style.setProperty('--hang-rotation', '0deg')
    }
  }, [props.isHanging])

  const toggleDefeated = (isDefeated: boolean) => {
    setIsDefeated(isDefeated)
  }

  const playHanging = () => {
    if (!props.isHanging) return

    const animateHanging = (startAngle: number) => {
      if (!hangingRef.current) return
      
      if (tweenHangRotationRef.current) {
        tweenHangRotationRef.current.stop()
      }

      let targetAngle;
      if (Math.abs(startAngle - targetRestAngle) < 2) {
        const distanceToTarget = Math.abs(startAngle - targetRestAngle)
        targetAngle = startAngle + ((startAngle < targetRestAngle ? 1 : -1) * (Math.random() + 0.2 + distanceToTarget))
      } else {
        const distanceToTarget = targetRestAngle - startAngle
        targetAngle = targetRestAngle + (distanceToTarget * 0.7)
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
    const innerElement = frontRef.current?.querySelector('.component-inner') as HTMLElement
    const backgroundElement = backgroundRef?.current

    if (idleTweenRef.current) {
      idleTweenRef.current.stop()
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

  const toggleBlink = (isBlinking: boolean, duration = 750) => {
    if (blinkTweenRef.current) {
      blinkTweenRef.current.stop()
    }

    isBlinkingRef.current = isBlinking

    if (isBlinking && !isHoveringRef.current) {
      const animateBlink = () => {
        if (!isBlinkingRef.current || isHoveringRef.current) return

        blinkTweenRef.current = new TWEEN.Tween(highlightRef.current)
          .to({ opacity: highlightRef.current.opacity < 0.5 ? 1 : 0.2 }, duration)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate((value) => {
            if (backgroundRef.current) {
              backgroundRef.current.style.setProperty('--visibility', `${value.opacity}`)
              highlightRef.current.opacity = value.opacity
            }
          })
          .onComplete(() => {
            if (isBlinkingRef.current && !isHoveringRef.current) {
              animateBlink()
            }
          })
          .start()
      }

      animateBlink()
    }
  }

  const setComponentPosition = (x: number[] | number, y: number[] | number, duration = Constants.CARD_BASE_POSITION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setSpring({ dataField1: Array.isArray(x) ? x : [x], dataField2: Array.isArray(y) ? y : [y], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setComponentRotation = (rotation: number[] | number, duration = Constants.CARD_BASE_ROTATION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setRotation({ dataField1: Array.isArray(rotation) ? rotation : [rotation], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setComponentScale = (scale: number[] | number, duration = Constants.CARD_BASE_SCALE_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setScale({ dataField1: Array.isArray(scale) ? scale : [scale], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setComponentZIndex = (index: number, backgroundIndex?: number) => {
    frontRef.current?.style.setProperty('--z-index', index.toString())
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--z-index', backgroundIndex ? backgroundIndex.toString() : index.toString())
    }
  }

  const flipComponent = (flipped = false, isLeft = false, duration = Constants.CARD_BASE_FLIP_DURATION, degrees = Constants.CARD_FLIP_ROTATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setFlipRotation({ dataField1: [flipped ? (isLeft ? degrees : -degrees) : 0], duration: duration, easing: easing, interpolation: interpolation })
  }

  const toggleHighlight = (isHighlighted: boolean, shouldBeWhite?: boolean, color?: string)  => {
    if (!backgroundRef.current) return
    if (visibilityRef.current.opacity == 0) return
    if (isHighlighted && (shouldBeWhite || color)) {
      backgroundRef.current.style.setProperty('--background-color', color ? color : (shouldBeWhite ? 'white' : props.defaultHighlightColor))
    }
    setHighlight({ dataField1: [isHighlighted ? 1 : 0], duration: Constants.CARD_BASE_HIGHLIGHT_DURATION, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  }

  const toggleVisibility = (isVisible: boolean, instant?: boolean)  => {
    setVisibility({ dataField1: [isVisible ? 1 : 0], duration: instant ? 0 : Constants.CARD_BASE_VISIBILITY_DURATION, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isDragging) return
    isHoveringRef.current = true

     if (props.isHanging && Date.now() - lastHangingRotationInteractionTimeRef.current > 2000) {
      const componentRect = frontRef.current?.getBoundingClientRect()
      if (!componentRect) return
      const componentCenterX = componentRect.left + componentRect.width / 2
      const isFromLeft = e.clientX < componentCenterX
      if (tweenHangRotationRef.current) {
        tweenHangRotationRef.current.stop()
      }

      const targetRotation = isFromLeft 
        ? hangRotationRef.current.rotation - (Math.random() * 8 + 8)
        : hangRotationRef.current.rotation + (Math.random() * 8 + 8)

      tweenHangRotationRef.current = new TWEEN.Tween(hangRotationRef.current)
        .to({ rotation: targetRotation }, 600)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate((value) => {
          hangingRef.current?.style.setProperty('--hang-rotation', `${value.rotation}deg`)
        })
        .onComplete(() => {
          playHanging()
        })
        .start()
      lastHangingRotationInteractionTimeRef.current = Date.now()
    }

    if (props.isHighlightable) toggleHighlight(true)
    props.onHover && props.onHover(true)
  }

  const handleMouseLeave = () => {
    if (isDragging) return
    isHoveringRef.current = false
    if (props.isHighlightable && !props.isSelected) {
      if (isBlinkingRef.current) {
        toggleBlink(true)
      } else {
        toggleHighlight(false)
      }
    }
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

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY

      const deltaX = Math.abs(startClientX - e.clientX)
      const deltaY = Math.abs(startClientY - e.clientY)

      if ((deltaX > 10 || deltaY > 10) && !mouseMove && props.isDraggable) {
        mouseMove = true
        setIsDragging(true)
        setComponentRotation(0)
        setComponentScale(1.8)
      }

      if (mouseMove) {
        const limitedX = Math.max((-window.innerWidth / 2) + boxW + (props.width / 2), Math.min(newX, (window.innerWidth / 2) - boxW - (props.width / 2)))
        const limitedY = Math.max((-window.innerHeight / 2) + boxH + (props.height / 2), Math.min(newY, (window.innerHeight / 2) - boxH - (props.height / 2)))

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
        setComponentPosition(oldPositionX, oldPositionY, Constants.CARD_POSITION_RESET_DURATION)
        setRotation(startRotation)
        setScale(startScale)

        handleMouseLeave()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [props.isDraggable, spring, boxW, boxH, props.width, props.height, scale, rotation, props.onClick])

  
  const component = useMemo(() => {
    return (
      <>
        <div className='component-container' ref={backgroundRef}>
          <div className='component-outline'/>
        </div>
        <div 
          ref={frontRef}
          className={`component-container ${props.mouseDisabled ? 'NoMouse' : 'YesMouse'} NoDrag`}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="component-inner">
            <div className="component-front-face NoMouse NoDrag">
              <div id='component-filter-overlay' className={props.isDisabled ? 'visible disabled' : 'disabled'} />
              <div id='component-filter-overlay' className={props.isSelected ? 'visible selected' : 'selected'} />
              <div id='component-filter-overlay' className={isDefeated ? 'visible defeated' : 'defeated'} />
              {/* <img id='component-filter-overlay' className={isDefeated ? 'visible' : ''} src='/textures/cards/card_disabled.png' /> */}
              <div className='component-content' >
                {props.childrenBehindFront}
              </div>
              {props.frontImagePath && <img className='component-image NoMouse NoDrag' src={props.frontImagePath} alt="Component Front" />}
              <div className='component-content' >
                {props.childrenInFront}
              </div>
            </div>
            <div className="component-back-face NoMouse NoDrag">
              {props.backgroundImagePath && <img className='component-image NoMouse NoDrag' src={props.backgroundImagePath} alt="Component Background" />}
              <div className='component-content' >
                {props.childrenInBack}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }, [props.isDisabled, props.isSelected, isDefeated, props.frontImagePath, props.backgroundImagePath, props.childrenBehindFront, props.childrenInFront, props.childrenInBack])

  const hangingNail = useMemo(() => {
    return (
      <div ref={hangingNailRef} className='hanging-nail-container'>
        <div className="nail-container" style={{ 
          width: aspectWidth(0.6),
          height: aspectWidth(1.2),
          // left: props.width / 2 - aspectWidth(0.3) + randomOffset,
          left: props.width / 2 + randomOffset,
          top: props.height * 0.03 - aspectWidth(1.2),
          transform: `rotate(${nailRotationRef.current.rotation}deg)` 
        }}>
          <div className="nail-point" style={{
            width: aspectWidth(0.2),
            height: aspectWidth(1),
            left: aspectWidth(0.2),
            top: aspectWidth(0.2),
            }}/>
          <div className="nail-point" style={{
            width: aspectWidth(0.6),
            height: aspectWidth(0.4),
            left: 0,
            top: 0,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}/>
        </div>
        <div ref={hangingRef} className='hanging-container'>
          {component}
        </div>
      </div>
    )
  }, [aspectWidth, props.width, props.height, randomOffset, component])

  return props.isHanging ? hangingNail : component
})


