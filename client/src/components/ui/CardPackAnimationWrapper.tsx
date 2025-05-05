import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as TWEEN from '@tweenjs/tween.js'
import { CardPack, CardPackHandle } from './CardPack'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import * as Constants from '/src/data/cardConstants'
import { AnimationData } from '../InteractibleComponent'

// Animation wrapper constants
const CARD_PACK_WIDTH_RATIO = 0.75
const CARD_PACK_HEIGHT_RATIO = 1
const FULLSCREEN_WIDTH = 100
const FULLSCREEN_HEIGHT = 100
const DEFAULT_ANIMATION_DURATION = 500
const DEFAULT_POSITION_DURATION = Constants.CARD_BASE_POSITION_DURATION
const DEFAULT_ROTATION_DURATION = Constants.CARD_BASE_ROTATION_DURATION
const DEFAULT_SCALE_DURATION = Constants.CARD_BASE_SCALE_DURATION

// Simplified interface for CardPackAnimationWrapper
export interface CardPackAnimationWrapperProps {
  startPosition?: { x: number, y: number }
  startRotation?: number
  startScale?: number
  startZIndex?: number

  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent, fromPack?: boolean) => void
  onComplete?: () => void
  // CardPack specific props
  packId?: number
  packType?: constants.PackType
  isOpen?: boolean
  clickable?: boolean
  cardPackSize: number
  maxTilt: number
  optionalTitle?: string
  customButtonLabel?: string
  atTutorialEnding?: boolean
  
  // Animation wrapper specific props
  initialFullscreen?: boolean
}

// Simplified handle
export interface CardPackAnimationWrapperHandle {
  setPosition: (x: number[] | number, y: number[] | number, duration?: number, easing?: any) => void
  setScale: (scale: number[] | number, duration?: number, easing?: any) => void
  setRotation: (rotation: number[] | number, duration?: number, easing?: any) => void
  setZIndex: (index: number) => void
  getStyle: () => {
    translateX: number
    translateY: number
    rotation: number
    scale: number
  }
  toggleFullscreen: (isFullscreen: boolean, duration?: number, easing?: any) => void
  isFullscreen: () => boolean
  isInProcessOfClaiming: () => boolean
}

export const CardPackAnimationWrapper = forwardRef<CardPackAnimationWrapperHandle, CardPackAnimationWrapperProps>((props: CardPackAnimationWrapperProps, ref: React.Ref<CardPackAnimationWrapperHandle>) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  
  const [wrapperWidth, setWrapperWidth] = useState(aspectWidth(props.cardPackSize * CARD_PACK_WIDTH_RATIO))
  const [wrapperHeight, setWrapperHeight] = useState(aspectWidth(props.cardPackSize * CARD_PACK_HEIGHT_RATIO))
  
  const [isFullscreen, setIsFullscreen] = useState(props.initialFullscreen || false)
  const [isAnimating, setIsAnimating] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fullscreenTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const sizeTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const tweenZIndexRef = useRef<TWEEN.Tween<any> | null>(null)

  // Animation state
  const [spring, setSpring] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [rotation, setRotation] = useState<AnimationData>({ dataField1: [], dataField2: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear })
  const [scale, setScale] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  const [zIndex, setZIndex] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  const [animatedCardPackSize, setAnimatedCardPackSize] = useState<AnimationData>({dataField1: [], duration: 0, easing: TWEEN.Easing.Quadratic.InOut, interpolation: TWEEN.Interpolation.Linear})
  
  // Current value refs
  const springRef = useRef({ x: props.startPosition?.x || 0, y: props.startPosition?.y || 0 })
  const rotationRef = useRef({ rotation: props.startRotation || 0 })
  const zIndexRef = useRef({ zIndex: props.startZIndex || 1 })
  const scaleRef = useRef({ scale: props.startScale || 1 })
  const cardPackSizeRef = useRef({ size: props.cardPackSize })
  const isHoveringRef = useRef(false)
  const sizeRef = useRef({ 
    width: aspectWidth(props.cardPackSize * CARD_PACK_WIDTH_RATIO), 
    height: aspectWidth(props.cardPackSize * CARD_PACK_HEIGHT_RATIO)
  })
  
  // Animation tweens
  const tweenSpringRef = useRef<TWEEN.Tween<any> | null>(null)
  const tweenRotationRef = useRef<TWEEN.Tween<any> | null>(null)
  const tweenCardPackSizeRef = useRef<TWEEN.Tween<any> | null>(null)
  const tweenScaleRef = useRef<TWEEN.Tween<any> | null>(null)
  const tweenBackgroundOpacityRef = useRef<TWEEN.Tween<any> | null>(null)
  
  const cardPackRef = useRef<CardPackHandle>(null)
  
  // Add a ref to track if position changed while in fullscreen
  const positionChangedWhileFullscreenRef = useRef(false);
  
  // Update useEffect to mark when position changes while in fullscreen
  useEffect(() => {
    if (isFullscreen && props.startPosition) {
      positionChangedWhileFullscreenRef.current = true;
    }
  }, [props.startPosition, isFullscreen]);
  
  // Add reset for the flag when exiting fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      positionChangedWhileFullscreenRef.current = false;
    }
  }, [isFullscreen]);
  
  useEffect(() => {
    setWrapperWidth(aspectWidth(props.cardPackSize * CARD_PACK_WIDTH_RATIO))
    setWrapperHeight(aspectWidth(props.cardPackSize * CARD_PACK_HEIGHT_RATIO))
    sizeRef.current = {
      width: aspectWidth(props.cardPackSize * CARD_PACK_WIDTH_RATIO),
      height: aspectWidth(props.cardPackSize * CARD_PACK_HEIGHT_RATIO)
    }
  }, [props.cardPackSize, aspectWidth])
  
  useEffect(() => {
    if (!isFullscreen && !isAnimating && props.startPosition) {
      setComponentPosition(
        aspectWidth(props.startPosition.x), 
        aspectWidth(props.startPosition.y), 
        300
      );
    }
    
    if (props.startPosition) {
      startPositionRef.current = props.startPosition;
    }
    
    if (!isFullscreen && !isAnimating) {
      if (props.startRotation) {
        setComponentRotation(props.startRotation, 300);
      }
      
      if (props.startScale) {
        setComponentScale(props.startScale, 300);
      }
      
      if (props.startZIndex) {
        setComponentZIndex(props.startZIndex, 300);
      }
    }
  }, [props.startPosition, props.startRotation, props.startScale, props.startZIndex, aspectWidth, isFullscreen, isAnimating]);
  
  const startPositionRef = useRef(props.startPosition);
  
  useEffect(() => {
    if (spring.dataField1.length === 0 || spring.dataField2?.length === 0) return
    
    if (tweenSpringRef.current) {
      tweenSpringRef.current.stop()
    }
    
    tweenSpringRef.current = new TWEEN.Tween(springRef.current)
      .to({ x: spring.dataField1, y: spring.dataField2 }, spring.duration)
      .easing(spring.easing)
      .interpolation(spring.interpolation)
      .onUpdate((obj) => {
        if (wrapperRef.current) {
          springRef.current.x = obj.x
          springRef.current.y = obj.y
          
          wrapperRef.current.style.setProperty('--translate-x', `${obj.x}px`)
          wrapperRef.current.style.setProperty('--translate-y', `${obj.y}px`)
        }
      })
      .start()
  }, [spring])

  useEffect(() => {
    if (animatedCardPackSize.dataField1.length === 0) return
    
    if (tweenCardPackSizeRef.current) {
      tweenCardPackSizeRef.current.stop()
    }

    const startObj = { size: cardPackSizeRef.current.size }
    const targetSize = Array.isArray(animatedCardPackSize.dataField1) ? animatedCardPackSize.dataField1[animatedCardPackSize.dataField1.length - 1] : animatedCardPackSize.dataField1
    
    tweenCardPackSizeRef.current = new TWEEN.Tween(startObj)
      .to({ size: targetSize }, animatedCardPackSize.duration)
      .easing(animatedCardPackSize.easing)
      .onUpdate((obj) => {
        if (wrapperRef.current) {
          cardPackSizeRef.current.size = obj.size
        }
      })
      .start()
  }, [animatedCardPackSize])
  
  useEffect(() => {
    if (scale.dataField1.length === 0) return
    
    if (tweenScaleRef.current) {
      tweenScaleRef.current.stop()
    }
    
    // Create a starting object with current value
    const startObj = { scale: scaleRef.current.scale }
    
    // Calculate target value once
    const targetScale = Array.isArray(scale.dataField1) ? scale.dataField1[scale.dataField1.length - 1] : scale.dataField1
    
    tweenScaleRef.current = new TWEEN.Tween(startObj)
      .to({ scale: targetScale }, scale.duration)
      .easing(scale.easing)
      .onUpdate((obj) => {
        if (wrapperRef.current) {
          // Update ref to keep track of current scale
          scaleRef.current.scale = obj.scale
          // Apply to DOM
          wrapperRef.current.style.setProperty('--scale', `${obj.scale}`)
        }
      })
      .start()
  }, [scale])
  
  useEffect(() => {
    if (rotation.dataField1.length === 0) return
    
    if (tweenRotationRef.current) {
      tweenRotationRef.current.stop()
    }
    
    // Create a starting object with current value
    const startObj = { rotation: rotationRef.current.rotation }
    
    // Calculate target value once
    const targetRotation = Array.isArray(rotation.dataField1) ? rotation.dataField1[rotation.dataField1.length - 1] : rotation.dataField1
    
    tweenRotationRef.current = new TWEEN.Tween(startObj)
      .to({ rotation: targetRotation }, rotation.duration)
      .easing(rotation.easing)
      .onUpdate((obj) => {
        if (wrapperRef.current) {
          // Update ref to keep track of current rotation
          rotationRef.current.rotation = obj.rotation
          // Apply to DOM
          wrapperRef.current.style.setProperty('--rotation', `${obj.rotation}deg`)
        }
      })
      .start()
  }, [rotation])

  useEffect(() => {
    if (zIndex.dataField1.length === 0) return
    
    if (tweenZIndexRef.current) {
      tweenZIndexRef.current.stop()
    }

    const startObj = { zIndex: zIndexRef.current.zIndex }
    const targetZIndex = Array.isArray(zIndex.dataField1) ? zIndex.dataField1[zIndex.dataField1.length - 1] : zIndex.dataField1

    tweenZIndexRef.current = new TWEEN.Tween(startObj)
      .to({ zIndex: targetZIndex }, zIndex.duration)
      .easing(zIndex.easing)
      .onUpdate((obj) => {
        if (wrapperRef.current) {
          zIndexRef.current.zIndex = obj.zIndex
          wrapperRef.current.style.setProperty('--z-index', obj.zIndex.toString())
        }
      })
      .start()
  }, [zIndex])
  
  const toggleFullscreen = (toFullscreen: boolean, duration = DEFAULT_ANIMATION_DURATION, easing = TWEEN.Easing.Cubic.Out) => {
    if (isFullscreen === toFullscreen) return
    setIsFullscreen(toFullscreen)
    setIsAnimating(true)
    if (fullscreenTweenRef.current) {
      fullscreenTweenRef.current.stop()
    }
    
    if (sizeTweenRef.current) {
      sizeTweenRef.current.stop()
    }

    if (tweenCardPackSizeRef.current) {
      tweenCardPackSizeRef.current.stop()
    }
    
    const normalWidth = aspectWidth(props.cardPackSize * CARD_PACK_WIDTH_RATIO)
    const normalHeight = aspectWidth(props.cardPackSize * CARD_PACK_HEIGHT_RATIO)
    
    const fullWidth = aspectWidth(FULLSCREEN_WIDTH)
    const fullHeight = aspectHeight(FULLSCREEN_HEIGHT)
    
    // When going to fullscreen
    if (toFullscreen) {
      // Direct array approach with bezier interpolation
      setComponentPosition(0, 0, duration, easing)
      setComponentZIndex(1000, 0, easing)
      setComponentScale(1, duration, easing)
      setNewCardPackSize(24, duration, easing)
    
      sizeTweenRef.current = new TWEEN.Tween(sizeRef.current)
        .to({
          width: fullWidth,
          height: fullHeight,
        }, duration)
        .easing(easing)
        .onUpdate((obj) => {
          if (wrapperRef.current) {
            setWrapperWidth(obj.width)
            setWrapperHeight(obj.height)
          }
        })
        .start()
        
      if (wrapperRef.current) {
        tweenBackgroundOpacityRef.current = new TWEEN.Tween({ opacity: 0, blur: 0 })
          .to({ opacity: 0.45, blur: 5, zIndex: 1000 }, duration * 0.5)
          .easing(easing)
          .onUpdate(({ opacity, blur }) => {
            if (wrapperRef.current) {
              wrapperRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`
              wrapperRef.current.style.backdropFilter = `blur(${blur}px)`
            }
          })
          .delay(duration)
          .start()
      }
    } else {
      const targetPosition = startPositionRef.current || { x: 0, y: 0 };
      const posX = aspectWidth(targetPosition.x);
      const posY = aspectWidth(targetPosition.y);
      
      if (wrapperRef.current) {
        tweenBackgroundOpacityRef.current = new TWEEN.Tween({ opacity: 0.45, blur: 5 })
          .to({ opacity: 0, blur: 0 }, duration * 0.5)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(({ opacity, blur }) => {
            if (wrapperRef.current) {
              wrapperRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`
              wrapperRef.current.style.backdropFilter = `blur(${blur}px)`
            }
          })
          .start()
      }
      
      setTimeout(() => {
        sizeTweenRef.current = new TWEEN.Tween(sizeRef.current)
          .to({
            width: normalWidth,
            height: normalHeight,
          }, duration * 0.66)
          .easing(easing)
          .onUpdate((obj) => {
            if (wrapperRef.current) {
              setWrapperWidth(obj.width)
              setWrapperHeight(obj.height)
            }
          })
          .start()

        setNewCardPackSize(props.cardPackSize, duration * 0.66, easing);
        
        setComponentPosition(posX, posY, duration * 0.66, easing);
      }, duration * 0.5);
      
      setTimeout(() => {
        setComponentZIndex(props.startZIndex || 1, 0);
      }, duration * 1.5);
    }
    
    setTimeout(() => {
      setIsAnimating(false)
    }, duration * 1.5)
  }
  
  useEffect(() => {
    if (props.initialFullscreen) {
      toggleFullscreen(true, 0)
    }
  }, [toggleFullscreen, props.initialFullscreen])

  const handleHover = (isHovered: boolean) => {
    isHoveringRef.current = isHovered
    props.onHover && props.onHover(isHovered)
  }
  
  const handleClick = (e: React.MouseEvent, fromPack?: boolean) => {
    props.onClick && props.onClick(e, fromPack)
  }
  
  const setComponentPosition = (x: number[] | number, y: number[] | number, duration = DEFAULT_POSITION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setSpring({ dataField1: Array.isArray(x) ? x : [x], dataField2: Array.isArray(y) ? y : [y], duration: duration, easing: easing, interpolation: interpolation })
  }
  
  const setComponentRotation = (rotation: number[] | number, duration = DEFAULT_ROTATION_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setRotation({ dataField1: Array.isArray(rotation) ? rotation : [rotation], duration: duration, easing: easing, interpolation: interpolation })
  }
  
  const setComponentScale = (scale: number[] | number, duration = DEFAULT_SCALE_DURATION, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setScale({ dataField1: Array.isArray(scale) ? scale : [scale], duration: duration, easing: easing, interpolation: interpolation })
  }
  
  const setComponentZIndex = (index: number, duration = 300, easing = TWEEN.Easing.Quadratic.Out) => {
    setZIndex({ dataField1: [index], duration: duration, easing: easing })
  }

  const setNewCardPackSize = (size: number, duration = DEFAULT_ANIMATION_DURATION, easing = TWEEN.Easing.Quadratic.InOut) => {
    setAnimatedCardPackSize({ dataField1: [size], duration: duration, easing: easing })
  }
  
  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    setPosition: (x: number[] | number, y: number[] | number, duration = DEFAULT_POSITION_DURATION, easing = TWEEN.Easing.Quadratic.InOut) => {
      // Only apply aspectWidth once at the beginning of animation, not during tweening
      const aspectX = Array.isArray(x) ? x.map(val => aspectWidth(val)) : aspectWidth(x)
      const aspectY = Array.isArray(y) ? y.map(val => aspectWidth(val)) : aspectWidth(y)
      setComponentPosition(aspectX, aspectY, duration, easing)
    },
    setScale: setComponentScale,
    setRotation: setComponentRotation,
    setZIndex: setComponentZIndex,
    getStyle: () => ({
      translateX: springRef.current.x,
      translateY: springRef.current.y,
      rotation: rotationRef.current.rotation,
      scale: scaleRef.current.scale
    }),
    toggleFullscreen,
    isFullscreen: () => isFullscreen,
    isInProcessOfClaiming: () => cardPackRef.current?.isInProcessOfClaiming() || false
  }))
  
  return (
    <div 
      ref={wrapperRef} 
      className={`card-pack-animation-wrapper YesMouse NoDrag`}
      style={{
        width: `${wrapperWidth}px`,
        height: `${wrapperHeight}px`,
        transform: `
          translateX(var(--translate-x, 0px)) 
          translateY(var(--translate-y, 0px)) 
          rotateZ(var(--rotation, 0deg)) 
          scale(var(--scale, 1))
        `,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
        zIndex: 'var(--z-index, 1)',
        overflow: 'visible',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CardPack
        ref={cardPackRef}
        onClick={handleClick}
        onHover={handleHover}
        onComplete={props.onComplete}
        packId={props.packId}
        isOpen={props.isOpen}
        packType={props.packType}
        clickable={isFullscreen}
        cardPackSize={cardPackSizeRef.current.size}
        cardPackOnly={!isFullscreen}
        maxTilt={isFullscreen && !isAnimating ? props.maxTilt : 0}
        optionalTitle={props.optionalTitle}
        customButtonLabel={props.customButtonLabel}
        atTutorialEnding={props.atTutorialEnding}
      />
    </div>
  )
})
