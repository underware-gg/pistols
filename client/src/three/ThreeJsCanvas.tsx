import { useState, useRef } from 'react'
import { useEffectOnce } from '@underware_gg/pistols-sdk/utils/hooks'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useSettings } from '/src/hooks/SettingsContext'

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
  const { framerate, debugScene } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef()

  useEffectOnce(() => {
    let _mounted = true
    const _initialize = async () => {
      await game.init(canvasRef.current, framerate, guiEnabled || debugScene)
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
    <div>
      <canvas
        id='gameCanvas'
        className='GameCanvas'
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
      >
        Canvas not supported by your browser! 😱
      </canvas>
    </div>
  )
}

export default ThreeJsCanvas
