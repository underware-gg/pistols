import React, { useEffect, useState, useRef } from 'react'
import { Image } from 'semantic-ui-react'
import * as TWEEN from '@tweenjs/tween.js'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { useTextureShift } from '/src/hooks/useTextureShift'

export interface ExclamationIndicatorProps {
  /** Image source for the notification indicator */
  src: string
  /** Whether the indicator should be visible */
  visible: boolean
  /** Texture shift index */
  textureShiftIndex?: number
  /** CSS class name */
  className?: string
  /** Custom styles */
  style?: React.CSSProperties
  /** Position configuration */
  position?: {
    top?: string | number
    left?: string | number
    right?: string | number
    bottom?: string | number
  }
  /** Size configuration */
  size?: {
    width?: string | number
    height?: string | number
  }
  /** Rotation in degrees */
  rotation?: number
  /** Animation configuration */
  animations?: {
    /** Enable opacity fade in/out animation */
    opacity?: boolean
    /** Enable pulsing glow effect */
    pulse?: boolean
    /** Enable floating animation */
    float?: boolean
    /** Enable hover scale effect */
    hoverScale?: boolean
  }
  /** Animation timing configuration */
  animationTiming?: {
    /** Duration for opacity animation in ms */
    opacityDuration?: number
    /** Duration for pulse animation cycle in ms */
    pulseDuration?: number
    /** Duration for float animation cycle in ms */
    floatDuration?: number
    /** Intensity of pulse effect (0-20) */
    pulseIntensity?: number
    /** Amount of vertical float movement in pixels */
    floatAmount?: number
    /** Scale factor on hover */
    hoverScaleFactor?: number
  }
  /** Event handlers */
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}

export const ExclamationIndicator: React.FC<ExclamationIndicatorProps> = ({
  src,
  visible,
  textureShiftIndex = null,
  className = '',
  style = {},
  position = { top: '30%', left: '46%' },
  size = { width: 10 },
  rotation = -20,
  animations = {
    opacity: true,
    pulse: true,
    float: true,
    hoverScale: true
  },
  animationTiming = {
    opacityDuration: 200,
    pulseDuration: 800,
    floatDuration: 800,
    pulseIntensity: 8,
    floatAmount: 8,
    hoverScaleFactor: 1.2
  },
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  const { aspectWidth } = useGameAspect()
  const { x: textureShiftX, y: textureShiftY } = useTextureShift(textureShiftIndex)

  const [opacity, setOpacity] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [pulseIntensity, setPulseIntensity] = useState(animationTiming.pulseIntensity || 8)
  const [verticalShift, setVerticalShift] = useState(0)

  const opacityTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const pulseTweenRef = useRef<TWEEN.Tween<any> | null>(null)
  const floatTweenRef = useRef<TWEEN.Tween<any> | null>(null)

  // Opacity animation
  useEffect(() => {
    if (!animations.opacity) {
      setOpacity(visible ? 1 : 0)
      return
    }

    if (opacityTweenRef.current) {
      opacityTweenRef.current.stop()
    }

    const targetOpacity = visible ? 1 : 0
    opacityTweenRef.current = new TWEEN.Tween({ opacity })
      .to({ opacity: targetOpacity }, animationTiming.opacityDuration || 200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(({ opacity }) => {
        setOpacity(opacity)
      })
      .start()
  }, [visible, animations.opacity, animationTiming.opacityDuration])

  // Pulse and float animations
  useEffect(() => {
    if (pulseTweenRef.current) {
      pulseTweenRef.current.stop()
    }
    if (floatTweenRef.current) {
      floatTweenRef.current.stop()
    }

    if (opacity > 0 && !isHovered && animations.pulse) {
      // Pulse animation
      pulseTweenRef.current = new TWEEN.Tween({ intensity: pulseIntensity })
        .to({ intensity: 16 }, animationTiming.pulseDuration || 800)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .onUpdate(({ intensity }) => {
          setPulseIntensity(intensity)
        })
        .start()
    } else {
      setPulseIntensity(isHovered ? 16 : animationTiming.pulseIntensity || 8)
    }

    if (opacity > 0 && !isHovered && animations.float) {
      // Float animation
      floatTweenRef.current = new TWEEN.Tween({ shift: verticalShift })
        .to({ shift: animationTiming.floatAmount || 8 }, animationTiming.floatDuration || 800)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .onUpdate(({ shift }) => {
          setVerticalShift(shift)
        })
        .start()
    } else {
      setVerticalShift(0)
    }
  }, [opacity, isHovered, animations.pulse, animations.float, animationTiming])

  const handleMouseEnter = () => {
    setIsHovered(true)
    onMouseEnter?.()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onMouseLeave?.()
  }

  // Calculate dimensions
  const width = typeof size.width === 'number' ? aspectWidth(size.width) : size.width
  const height = size.height || 'auto'

  // Calculate position
  const top = position.top
  const left = position.left
  const right = position.right
  const bottom = position.bottom

  // Calculate transform
  const scale = animations.hoverScale && isHovered ? (animationTiming.hoverScaleFactor || 1.2) : 1
  const translateX = textureShiftX
  const translateY = textureShiftY + verticalShift

  return (
    <Image
      src={src}
      className={`YeMouse NoDrag ${className}`}
      style={{
        position: 'absolute',
        display: opacity > 0 ? 'block' : 'none',
        top,
        left,
        right,
        bottom,
        rotate: `${rotation}deg`,
        width,
        height,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        cursor: onClick ? 'pointer' : 'default',
        opacity,
        filter: animations.pulse 
          ? `drop-shadow(0 0 ${pulseIntensity}px rgba(255, 255, 255, ${isHovered ? 1 : 0.8}))`
          : undefined,
        transition: animations.hoverScale ? 'transform 0.2s ease-out' : undefined,
        pointerEvents: 'auto',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    />
  )
}

export default ExclamationIndicator
