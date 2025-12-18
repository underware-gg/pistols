import React, { useEffect } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { SceneName } from '/src/data/assetsTypes'
import { useGameEvent } from '/src/hooks/useGameEvent'

export default function ScBackrooms() {
  const { dispatchSetScene } = usePistolsScene()
  const { value: itemClicked, timestamp } = useGameEvent('scene_click', null)

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case 'crypt':
          dispatchSetScene(SceneName.Graveyard)
          break
        case 'quiz_door':
          dispatchSetScene(SceneName.QuizRoomList)
          break
      }
    }
  }, [itemClicked, timestamp, dispatchSetScene])

  return (
    <div>
      {/* Backrooms scene - just handles navigation via click events */}
    </div>
  )
}

