import React, { useMemo } from 'react'
import { Menu } from 'semantic-ui-react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { SPRITESHEETS } from '/src/data/assets'
import { AnimationState } from '/src/three/game'


//TODO redo to reflect new duel logic
export function MenuDebugAnimations() {
  return (
    <div>
      <MenuDebugTriggers />
      <MenuDebugActors actorId='A' />
      <MenuDebugActors actorId='B' />
    </div>
  )
}

function MenuDebugTriggers() {
  const { gameImpl } = useThreeJsContext()

  const _paces = (pacesCountA, paceCountB, healthA, healthB) => {
    gameImpl?.animateDuel(AnimationState.Round1)
  }

  const _blades = (bladeA, bladeB, healthA, healthB) => {
    gameImpl?.animateDuel(AnimationState.Round2)
  }

  const className = 'PaddedHalf Important ResetSize'

  return (
    <>
      <div className='MenuBottom AlignCenter' style={{ bottom: '120px' }}>
        <Menu secondary compact>
          <Menu.Item className={className} onClick={() => _paces(1, 1, 0, 0)}>
            1_1:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 5, 0, 0)}>
            5_5:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(10, 10, 0, 0)}>
            10_10:DD
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 4, 100, 100)}>
            44:AA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(4, 4, 50, 50)}>
            44:II
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 4, 50, 0)}>
            44:ID
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(4, 4, 0, 50)}>
            44:DI
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 50, 100)}>
            45:IA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 100, 50)}>
            54:AI
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 0, 100)}>
            45:DA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 100, 0)}>
            54:AD
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 100, 0)}>
            45:AD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 0, 100)}>
            54:DA
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 50, 50)}>
            45:II
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 50, 50)}>
            54:II
          </Menu.Item>

          <Menu.Item className={className} onClick={() => _paces(4, 5, 0, 50)}>
            45:DI
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _paces(5, 4, 50, 0)}>
            54:ID
          </Menu.Item>


        </Menu>
      </div>

      <div className='MenuBottom AlignCenter' style={{ bottom: '150px' }}>
        <Menu secondary compact>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 100)}>
            H_H:AA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 50)}>
            H_H:II
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 0)}>
            H_H:DD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 50)}>
            H_H:AI
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 100)}>
            H_H:IA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 100, 0)}>
            H_H:AD
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 100)}>
            H_H:DA
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 50, 0)}>
            H_H:ID
          </Menu.Item>
          <Menu.Item className={className} onClick={() => _blades(1, 1, 0, 50)}>
            H_H:DI
          </Menu.Item>
        </Menu>
      </div>
    </>
  )
}

function MenuDebugActors({
  actorId
}) {
  const { gameImpl } = useThreeJsContext()

  const _play = (key) => {
    // gameImpl?.playActorAnimation(actorId, key)
  }

  const className = 'PaddedHalf Important Smaller'

  const items = useMemo(() => {
    if (!gameImpl) return
    let result = []
    Object.keys(SPRITESHEETS.FEMALE).forEach(key => {
      result.push(
        <Menu.Item key={key} className={className} onClick={() => _play(key)}>
          {actorId}:{key}
        </Menu.Item>
      )
    })
    return result
  }, [gameImpl])

  return (
    <div className='MenuBottom AlignCenter' style={{ bottom: actorId == 'B' ? '50px' : '80px' }}>
      <Menu secondary compact size='small'>
        {items}
      </Menu>
    </div>
  )
}

