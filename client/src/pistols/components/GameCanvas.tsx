import ThreeJsCanvas from '@/pistols/three/ThreeJsCanvas'
import * as game from '@/pistols/three/game'

const GameCanvas = ({
  width = 960,
  height = 540,
  guiEnabled = false,
}) => {
  return <ThreeJsCanvas width={width} height={height} guiEnabled={guiEnabled} gameImpl={game} />
}

export default GameCanvas
