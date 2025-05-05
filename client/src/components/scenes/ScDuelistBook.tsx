import React, { useEffect, useState } from 'react'
import { usePistolsScene, usePistolsContext } from '/src/hooks/PistolsContext'
import { _currentScene } from '/src/three/game'
import { DuelistsBook } from '../ui/DuelistsBook'
import { DuelistsBookAlwaysOpen } from '../ui/DuelistsBookAlwaysOpen'
import { ActionButton } from '../ui/Buttons'
import { SceneName } from '/src/data/assets'
import { useGameAspect } from '/src/hooks/useGameAspect'

export default function ScDuelistBook() {
  const { bookOpener } = usePistolsContext()
  const { dispatchSetScene } = usePistolsScene()
  const { aspectWidth, aspectHeight } = useGameAspect()

  useEffect(() => {
    bookOpener.open()
  }, [])

  const handleGetMoreDuelists = () => {
    // Navigate to card packs screen
    dispatchSetScene(SceneName.CardPacks)
  }

  return (
    <div>
      {/* <DuelistsConnect /> */}
      <DuelistsBookAlwaysOpen
        width={30} 
        height={40}
        bookTranslateX={21}
        bookTranslateY={4}
        bookRotateX={20}
        bookScale={1.2}
      />
      
      <div style={{
        position: 'absolute',
        bottom: aspectHeight(6),
        left: '50%',
        transform: 'translateX(-50%)',
        width: aspectWidth(40),
        zIndex: 990, // Higher than book but lower than overlays
        display: 'flex',
        justifyContent: 'center'
      }}>
        <ActionButton 
          large 
          fill 
          important 
          label="Get More Duelists" 
          onClick={handleGetMoreDuelists}
        />
      </div>
    </div>
  )
}
