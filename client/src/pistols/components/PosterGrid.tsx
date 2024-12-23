import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useGameAspect } from '@/pistols/hooks/useGameApect'
import { _currentScene } from '@/pistols/three/game'

export interface PosterGridHandle {
  setPostersData: (posters: JSX.Element[]) => void
  setTransformX: (x: number) => void
}

export const PosterGrid = forwardRef<PosterGridHandle, { small?: boolean }>(({ small }, ref) => {
  const { aspectWidth, aspectHeight } = useGameAspect()

  const [duelPosters, setDuelPosters] = useState<JSX.Element[]>([])
  const [translateX, setTranslateX] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const setTransformX = (x: number) => {
    setTranslateX(x)
  }

  const setPostersData = (posters: JSX.Element[]) => {
    setDuelPosters(prev => posters)
  }

  useImperativeHandle(ref, () => ({
    setPostersData: setPostersData,
    setTransformX
  }))

  return (
    <div className='NoMouse NoDrag' ref={gridRef} style={{ 
      width: aspectWidth(small ? 74 : 100), 
      height: aspectHeight(small ? 56 : 100), 
      position: 'absolute',
      transform: `translateX(${aspectWidth(translateX)}px)`,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateRows: small ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
        gridTemplateColumns: small ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', 
        width: small ? aspectWidth(70) : aspectWidth(86),
        height: small ? aspectHeight(56) : aspectHeight(74),
        position: 'absolute',
        bottom: small ? aspectHeight(10) : aspectHeight(8),
        left: '50%',
        transform: 'translateX(-50%)',
        columnGap: small ? 0 : aspectWidth(6),
        paddingLeft: small ? 0 : aspectWidth(0.6),
      }}>
        {duelPosters.map((duel) => (
          duel
        ))}
      </div>
    </div>
  )
})