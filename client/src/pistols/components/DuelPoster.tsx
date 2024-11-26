import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallengeDescription } from '@/pistols/hooks/useChallengeDescription'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { useDuel } from '@/pistols/hooks/useDuel'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { DUEL_CARD_WIDTH, DUEL_CARD_HEIGHT } from '@/pistols/data/cardConstants'
import { DuelistCard } from './cards/DuelistCard'
import { DuelIconsAsGrid } from '@/pistols/components/DuelIcons'
import { bigintEquals } from '@/lib/utils/types'
import * as TWEEN from '@tweenjs/tween.js'

interface DuelPosterProps {
  duelId?: bigint
  isVisible?: boolean
  isHighlightable?: boolean
  startPosition?: { x: number, y: number }
  startRotation?: number
  onHover?: (isHovered: boolean) => void
  onClick?: (e: React.MouseEvent) => void
}

export interface DuelPosterHandle {
  toggleVisibility: (isVisible: boolean) => void
  toggleHighlight: (isHighlighted: boolean, color?: string) => void
  setPosterScale: (scale: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setPosterRotation: (rotation: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
  setPosterPosition: (x: number[] | number, y: number[] | number, duration?: number, easing?: any, interpolation?: any) => void
}

export const DuelPoster = forwardRef<DuelPosterHandle, DuelPosterProps>((props: DuelPosterProps, ref: React.Ref<DuelPosterHandle>) => {
  const { aspectWidth } = useGameAspect()
  const {
    state,
    tableId,
    duelistIdA,
    duelistIdB,
    isLive,
    isFinished,
    premise,
    quote,
    winnerDuelistId,
    isDraw
  } = useChallenge(props.duelId)
  const { duelistId } = useSettings()
  const { turnA, turnB } = useDuel(props.duelId)
  const isMyDuelistA = useMemo(() => bigintEquals(duelistId, duelistIdA), [duelistId, duelistIdA])
  const isMyDuelistB = useMemo(() => bigintEquals(duelistId, duelistIdB), [duelistId, duelistIdB])

  const { challengeDescription } = useChallengeDescription(props.duelId)

  const posterRef = useRef<HTMLDivElement>(null)
  const posterBackgroundRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef({ scale: 1 })
  const rotationRef = useRef({ rotation: props.startRotation || 0 })
  const positionRef = useRef({ x: props.startPosition?.x || 0, y: props.startPosition?.y || 0 })
  const isHighlightedRef = useRef(false)
  const tweenScaleRef = useRef<TWEEN.Tween<{ scale: number }>>()
  const tweenRotationRef = useRef<TWEEN.Tween<{ rotation: number }>>()
  const tweenPositionRef = useRef<TWEEN.Tween<{ x: number, y: number }>>()
  const [scale, setScale] = useState<{dataField1: number[], duration: number, easing?: any, interpolation?: any}>({dataField1: [1], duration: 0})
  const [rotation, setRotation] = useState<{dataField1: number[], duration: number, easing?: any, interpolation?: any}>({dataField1: [props.startRotation || 0], duration: 0})
  const [position, setPosition] = useState<{dataField1: number[], dataField2: number[], duration: number, easing?: any, interpolation?: any}>({
    dataField1: [props.startPosition?.x || 0], 
    dataField2: [props.startPosition?.y || 0], 
    duration: 0
  })
  const highlightIntervalOnRef = useRef<NodeJS.Timeout>()
  const highlightIntervalOffRef = useRef<NodeJS.Timeout>()

  const cardTransforms = useMemo(() => ({
    leftCard: `translate(4%, ${Math.random() * 12 - 2}%)`,
    rightCard: `translate(-3%, ${Math.random() * 12 - 2}%)`
  }), [])

  useImperativeHandle(ref, () => ({
    toggleVisibility,
    toggleHighlight,
    setPosterScale,
    setPosterRotation,
    setPosterPosition
  }))

  const isDead = (duelistId: number) => {
    return duelistId !== Number(winnerDuelistId) && isFinished
  }

  const toggleHighlight = (isHighlighted: boolean, color?: string)  => {
    if (!posterRef.current || !posterBackgroundRef.current) return
    if (posterRef.current.style.opacity !== '1') return

    posterBackgroundRef.current.style.opacity = isHighlighted ? '1' : '0'
    if (isHighlighted) {
      posterBackgroundRef.current.style.setProperty('--background-color', color || 'white')
    }
  }

  const toggleVisibility = (isVisible: boolean)  => {
    if (!posterRef.current) return
    posterRef.current.style.opacity = isVisible ? '1' : '0'

    if (!posterBackgroundRef.current && !isVisible) return
    posterBackgroundRef.current.style.opacity = '0'
  }

  const setPosterScale = (scale: number[] | number, duration = 300, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setScale({ dataField1: Array.isArray(scale) ? scale : [scale], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setPosterRotation = (rotation: number[] | number, duration = 300, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setRotation({ dataField1: Array.isArray(rotation) ? rotation : [rotation], duration: duration, easing: easing, interpolation: interpolation })
  }

  const setPosterPosition = (x: number[] | number, y: number[] | number, duration = 300, easing = TWEEN.Easing.Quadratic.InOut, interpolation = TWEEN.Interpolation.Linear) => {
    setPosition({ 
      dataField1: Array.isArray(x) ? x : [x],
      dataField2: Array.isArray(y) ? y : [y],
      duration: duration,
      easing: easing,
      interpolation: interpolation
    })
  }

  useEffect(() => {
    if (posterRef.current) {
      if (tweenScaleRef.current) {
        tweenScaleRef.current.stop()
      }

      tweenScaleRef.current = new TWEEN.Tween(scaleRef.current)
        .to({ scale: scale.dataField1 }, scale.duration)
        .easing(scale.easing)
        .interpolation(scale.interpolation)
        .onUpdate((value) => {
          posterRef.current?.style.setProperty('--poster-scale', `${value.scale}`)
          if (posterBackgroundRef.current) {
            posterBackgroundRef.current.style.setProperty('--poster-scale', `${value.scale}`)
          }
        })
        .start()
    }
  }, [scale])

  useEffect(() => {
    if (posterRef.current) {
      if (tweenRotationRef.current) {
        tweenRotationRef.current.stop()
      }

      tweenRotationRef.current = new TWEEN.Tween(rotationRef.current)
        .to({ rotation: rotation.dataField1 }, rotation.duration)
        .easing(rotation.easing)
        .interpolation(rotation.interpolation)
        .onUpdate((value) => {
          posterRef.current?.style.setProperty('--poster-rotation', `${value.rotation}deg`)
          if (posterBackgroundRef.current) {
            posterBackgroundRef.current.style.setProperty('--poster-rotation', `${value.rotation}deg`)
          }
        })
        .start()
    }
  }, [rotation])

  useEffect(() => {
    if (posterRef.current) {
      if (tweenPositionRef.current) {
        tweenPositionRef.current.stop()
      }

      tweenPositionRef.current = new TWEEN.Tween(positionRef.current)
        .to({ x: position.dataField1[0], y: position.dataField2[0] }, position.duration)
        .easing(position.easing)
        .interpolation(position.interpolation)
        .onUpdate((value) => {
          posterRef.current?.style.setProperty('--poster-x', `${value.x}px`)
          posterRef.current?.style.setProperty('--poster-y', `${value.y}px`)
          if (posterBackgroundRef.current) {
            posterBackgroundRef.current.style.setProperty('--poster-x', `${value.x}px`)
            posterBackgroundRef.current.style.setProperty('--poster-y', `${value.y}px`)
          }
        })
        .start()
    }
  }, [position])

  useEffect(() => {
    if ((isMyDuelistA && turnA) || (isMyDuelistB && turnB)) {
      highlightIntervalOnRef.current = setInterval(() => {
        if (posterRef.current && !isHighlightedRef.current) {
          toggleHighlight(true, 'orange')
          highlightIntervalOffRef.current = setTimeout(() => {
            if (posterRef.current && !isHighlightedRef.current) {
              toggleHighlight(false)
            }
          }, 500)
        } else {
          if (highlightIntervalOffRef.current) {
            clearTimeout(highlightIntervalOffRef.current)
          }
        }
      }, 1000)
    } else {
      clearHighlightIntervals()
    }

    return () => {
      clearHighlightIntervals()
    }
  }, [isMyDuelistA, isMyDuelistB, turnA, turnB])

  const clearHighlightIntervals = () => {
    if (highlightIntervalOnRef.current) {
      clearInterval(highlightIntervalOnRef.current)
    }
    if (highlightIntervalOffRef.current) {
      clearTimeout(highlightIntervalOffRef.current)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    props.onClick && props.onClick(e)
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (props.isHighlightable) toggleHighlight(true)
    isHighlightedRef.current = true
    props.onHover && props.onHover(true)
  }

  const handleMouseLeave = () => {
    if (props.isHighlightable) toggleHighlight(false)
    isHighlightedRef.current = false
    props.onHover && props.onHover(false)
  }

  return (
    <div style={{ width: aspectWidth(13), height: aspectWidth(17), display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <div 
        ref={posterBackgroundRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--background-color)', 
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          boxShadow: `${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px ${aspectWidth(0.01)}px rgba(20, 20, 20, 0.6)`,
          filter: 'blur(4px)',
          transform: 'translate(var(--poster-x, 0), var(--poster-y, 0)) rotate(var(--poster-rotation, 0)) scale(var(--poster-scale, 1))'
        }}
      />
      <div
        className='YesMouse'
        ref={posterRef}
        style={{
          width: aspectWidth(12),
          height: aspectWidth(16),
          background: 'url(/images/ui/duel_paper.png)',
          backgroundSize: 'cover',
          padding: aspectWidth(0.3),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: props.isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          position: 'relative',
          transform: 'translate(var(--poster-x, 0), var(--poster-y, 0)) rotate(var(--poster-rotation, 0)) scale(var(--poster-scale, 1))'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
      >
        <div style={{ fontSize: aspectWidth(1.6), fontWeight: 'bold', marginBottom: aspectWidth(0.2), color: 'black' }}>
          VS
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: aspectWidth(0.6)
        }}>
          <div style={{ width: aspectWidth(DUEL_CARD_WIDTH), height: aspectWidth(DUEL_CARD_HEIGHT), transform: cardTransforms.leftCard }}>
            <DuelistCard
              duelistId={Number(duelistIdA)}
              isLeft={true}
              isDisabled={isDead(Number(duelistIdA))}
              width={DUEL_CARD_WIDTH}
              height={DUEL_CARD_HEIGHT}
              isVisible={true}
              isFlipped={true}
              instantFlip={true}
              isHanging={true}
              isHangingLeft={true}
              shouldSwing={false}
            />
          </div>
          <div style={{ width: aspectWidth(DUEL_CARD_WIDTH), height: aspectWidth(DUEL_CARD_HEIGHT), transform: cardTransforms.rightCard }}>
            <DuelistCard
              duelistId={Number(duelistIdB)}
              isLeft={false}
              isDisabled={isDead(Number(duelistIdB))}
              width={DUEL_CARD_WIDTH}
              height={DUEL_CARD_HEIGHT}
              isVisible={true}
              isFlipped={true}
              instantFlip={true}
              isHanging={true}
              isHangingLeft={false}
              shouldSwing={false}
            />
          </div>
        </div>

        <div 
          className='NoMouse NoDrag'
          style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: aspectWidth(4.4),
            fontSize: aspectWidth(0.5),
            marginBottom: aspectWidth(1),
            color: 'black',
          }}>
          <DuelIconsAsGrid duelId={props.duelId} duelistIdA={duelistIdA} duelistIdB={duelistIdB} size='big' />
        </div>
      </div>
    </div>
  )
})
