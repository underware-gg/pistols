import React from 'react'
import { Grid, Image } from 'semantic-ui-react'
import { SceneName, usePistolsScene } from '../../hooks/PistolsContext'

const Row = Grid.Row
const Col = Grid.Column

export default function BarkeepModal({ open }) {
  const { currentScene, dispatchSetScene } = usePistolsScene()
  // console.log('> BARKEEP', currentScene, atBarkeep)

  const _close = () => {
    dispatchSetScene(SceneName.Tavern)
  }

  if (!open) {
    return <></>
  }

  return (
    <div className='TempBarkeepOverlay NoMouse NoDrag' onClick={() => _close()}>
      <div className='TempBarkeepTalkBalloon Relative'>
        <Image src={'/images/ui/duel/bubble_speech.png'} className='FillParent' />
        <div className='TempBarkeepTalkBalloonText'>
          Looking for trouble?
          <br/>Or just a drink?
        </div>
      </div>
    </div>
  )
}
