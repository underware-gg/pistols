import { useState, useRef } from 'react'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'

export const ThreeJsCanvas = ({
  width = 960,
  height = 540,
  guiEnabled = false,
}) => {
  const {
    game,     // raw game module (game.tsx)
    gameImpl, // initialized module (playable)
    dispatchGameImpl,
  } = useThreeJsContext()
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef()

  useEffectOnce(() => {
    let _mounted = true
    const _initialize = async () => {
      await game.init(canvasRef.current, width, height, guiEnabled)
      if (_mounted) {
        game.animate()
        // game.resetGameParams(gameParams)
        setIsLoading(false)
        dispatchGameImpl(game)
        //@ts-ignore
        canvasRef.current?.focus()
      }
    }

    // runs once on mount
    if (canvasRef.current && !isLoading && !gameImpl) {
      if (gameImpl) { // should never happen, but lets keep it for now
        gameImpl.dispose()
        dispatchGameImpl(null)
      }
      setIsLoading(true)
      _initialize()
    }

    return () => {
      console.warn(`UNMOUNTED ThreeJsCanvas! this should not be happening`)
      _mounted = false
    }
  }, [canvasRef.current])

  return (
    <canvas
      id='gameCanvas'
      className='GameCanvas'
      ref={canvasRef}
      width={width * 2}
      height={height * 2}
    >
      Canvas not supported by your browser! 😱
    </canvas>
  )
}

export default ThreeJsCanvas
