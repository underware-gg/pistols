import { useGameEvent } from './useGameEvent'
import { useGameAspect } from './useGameAspect'
import { useState, useEffect } from 'react'

export const useTextureShift = (layerIndex: number) => {
  const { aspectWidth, aspectHeight } = useGameAspect()
  const { value: shift, timestamp } = useGameEvent(`texture_shift_${layerIndex}`, null)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)

  useEffect(() => {
    if (shift) {
      setX(-shift.x * aspectWidth(100))
      setY(shift.y * aspectHeight(100))
    }
  }, [shift, timestamp, aspectWidth, aspectHeight])

  return { x, y }
} 