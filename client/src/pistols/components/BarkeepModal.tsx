import React from 'react'
import { Grid, Image } from 'semantic-ui-react'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { SceneName, usePistolsScene } from '../hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column

export default function BarkeepModal() {
  const { currentScene, atBarkeep, dispatchSetScene } = usePistolsScene()
  // console.log('> BARKEEP', currentScene, atBarkeep)

  const _close = () => {
    dispatchSetScene(SceneName.Tavern)
  }

  if (!atBarkeep) {
    return <></>
  }

  return (
    <div className='TempBarkeepOverlay' onClick={() => _close()}>
      <div className='TempBarkeepTalkBalloon Relative'>
        <Image src={'/images/ui/bubble_speech.png'} className='FillParent' />
        <div className='TempBarkeepTalkBalloonText'>
          Looking for trouble?
          <br/>Or just a drink?
        </div>
      </div>
    </div>
  )
}