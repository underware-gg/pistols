import { useState, useRef } from 'react'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'

export const ThreeJsCanvas = ({
  width = 960,
  height = 540,
  guiEnabled = false,
}) => {
  const { game, dispatchGameImpl } = useThreeJsContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const canvasRef = useRef()

  useEffectOnce(() => {
    let _mounted = true
    const _initialize = async () => {
      await game.init(canvasRef.current, width, height, guiEnabled)
      if (_mounted) {
        game.animate()
        // game.resetGameParams(gameParams)
        setIsLoading(false)
        setIsRunning(true)
        dispatchGameImpl(game)
        //@ts-ignore
        canvasRef.current?.focus()
      }
    }

    if (canvasRef.current && !isLoading && !isRunning) {
      setIsLoading(true)
      _initialize()
    }

    return () => {
      _mounted = false
      if (isRunning && game) {
        game.dispose()
        dispatchGameImpl(null)
      }
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
