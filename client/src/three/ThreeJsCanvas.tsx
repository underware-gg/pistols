import { useEffect, useRef } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useSettings } from '/src/hooks/SettingsContext'

export const ThreeJsCanvas = ({
  width = 960,
  height = 540,
  guiEnabled = false,
}) => {
  const {
    game,     // raw game module (game.tsx)
    dispatchGameImpl,
  } = useThreeJsContext()
  const { framerate, debugScene } = useSettings()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initializationRef = useRef<Promise<void> | null>(null)
  const activeRef = useRef(false)
  const initializedRef = useRef(false)
  const initializationOptionsRef = useRef({
    framerate,
    statsEnabled: guiEnabled || debugScene,
  })

  useEffect(() => {
    activeRef.current = true
    const canvas = canvasRef.current

    if (canvas && !initializationRef.current) {
      const { framerate: initialFramerate, statsEnabled } = initializationOptionsRef.current
      initializationRef.current = game.init(canvas, initialFramerate, statsEnabled)
        .then(() => {
          initializedRef.current = true
          if (!activeRef.current) {
            game.dispose()
            initializedRef.current = false
            return
          }

          game.animate()
          dispatchGameImpl(game)
          canvas.focus()
        })
        .catch((error) => {
          console.error('Three.js renderer initialization failed:', error)
        })
    }

    return () => {
      console.warn(`🧹 UNMOUNTING ThreeJsCanvas - cleaning up game resources`)
      activeRef.current = false
      if (initializedRef.current) {
        initializedRef.current = false
        game.dispose()
        dispatchGameImpl(null)
      }
    }
  }, [dispatchGameImpl, game])

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
