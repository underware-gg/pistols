import React, { useMemo, useCallback } from 'react'
import { Menu } from 'semantic-ui-react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { AnimName, SPRITESHEETS } from '/src/data/assets'
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

  // Play a sequence of animations for an actor with delay between each animation
  const playAnimationSequence = useCallback((actorId, animations, delay = 500) => {
    if (!gameImpl) return
    let index = 0
    
    const playNext = () => {
      if (index < animations.length) {
        gameImpl.animateDuelistTest(actorId, animations[index])
        index++
        setTimeout(playNext, delay)
      }
    }
    
    playNext()
  }, [gameImpl])

  const _paces = (pacesCountA, paceCountB, healthA, healthB) => {
    // Simulate a pacing sequence based on the inputs
    const stepsA = []
    const stepsB = []
    
    // Add appropriate number of steps based on pace count
    for (let i = 0; i < Math.min(pacesCountA, 10); i++) {
      stepsA.push(i % 2 === 0 ? AnimName.STEP_1 : AnimName.STEP_2)
    }
    
    for (let i = 0; i < Math.min(paceCountB, 10); i++) {
      stepsB.push(i % 2 === 0 ? AnimName.STEP_1 : AnimName.STEP_2)
    }
    
    // Add health-based animations at the end
    if (healthA === 0) {
      stepsA.push(AnimName.SHOT_DEAD_BACK)
    } else if (healthA === 50) {
      stepsA.push(AnimName.SHOT_INJURED_BACK)
    }
    
    if (healthB === 0) {
      stepsB.push(AnimName.SHOT_DEAD_BACK)
    } else if (healthB === 50) {
      stepsB.push(AnimName.SHOT_INJURED_BACK)
    }
    
    // Play the sequences
    playAnimationSequence('A', stepsA)
    setTimeout(() => {
      playAnimationSequence('B', stepsB)
    }, 250) // Slight delay for B to make it look more natural
  }

  const _blades = (bladeA, bladeB, healthA, healthB) => {
    // First animate the duel with state
    gameImpl?.animateDuel(AnimationState.Round2)
    
    // Then setup blade sequences based on inputs
    const sequenceA = []
    const sequenceB = []
    
    if (bladeA === 1) {
      sequenceA.push(AnimName.STRIKE_LIGHT)
    } else if (bladeA === 2) {
      sequenceA.push(AnimName.STRIKE_HEAVY)
    } else if (bladeA === 3) {
      sequenceA.push(AnimName.STRIKE_BLOCK)
    }
    
    if (bladeB === 1) {
      sequenceB.push(AnimName.STRIKE_LIGHT)
    } else if (bladeB === 2) {
      sequenceB.push(AnimName.STRIKE_HEAVY)
    } else if (bladeB === 3) {
      sequenceB.push(AnimName.STRIKE_BLOCK)
    }
    
    // Add health outcome animations
    if (healthA === 0) {
      sequenceA.push(AnimName.STRUCK_DEAD)
    } else if (healthA === 50) {
      sequenceA.push(AnimName.STRUCK_INJURED)
    }
    
    if (healthB === 0) {
      sequenceB.push(AnimName.STRUCK_DEAD)
    } else if (healthB === 50) {
      sequenceB.push(AnimName.STRUCK_INJURED)
    }
    
    // Play the sequences with a delay
    setTimeout(() => {
      playAnimationSequence('A', sequenceA)
      setTimeout(() => {
        playAnimationSequence('B', sequenceB)
      }, 500)
    }, 1000)
  }

  const className = 'PaddedHalf Important ResetSize'

  return (
    <>
      <div className='MenuTop AlignCenter' style={{ top: '120px' }}>
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

      <div className='MenuTop AlignCenter' style={{ top: '150px' }}>
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
    gameImpl?.animateDuelistTest(actorId, key)
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
    <div className='MenuTop AlignCenter' style={{ top: actorId == 'B' ? '50px' : '80px', height: 'auto' }}>
      <Menu secondary compact size='small' style={{ flexWrap: 'wrap', maxWidth: '90vw' }}>
        {items}
      </Menu>
    </div>
  )
}

