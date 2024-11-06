import React, { useEffect, useMemo } from 'react'
import { QueryProvider, useQueryContext } from '@/pistols/hooks/QueryContext'
import { usePistolsScene } from '@/pistols/hooks/PistolsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import { TavernAudios } from '@/pistols/components/GameContainer'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import NewChallengeModal from '@/pistols/components/modals/NewChallengeModal'
import ChallengeModal from '@/pistols/components/modals/ChallengeModal'
import DuelistModal from '@/pistols/components/modals/DuelistModal'
import TableModal from '@/pistols/components/modals/TableModal'
import { DuelistCard } from '../cards/DuelistCard'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { DUELIST_CARD_HEIGHT, DUELIST_CARD_WIDTH } from '@/pistols/data/cardConstants'

export default function ScDuelists() {
  const { queryDuelists } = useQueryContext()

  const { aspectWidth, aspectHeight } = useGameAspect()

  const { dispatchSetScene } = usePistolsScene()
  const { value: newScene, timestamp } = useGameEvent('change_scene', null)

  useEffect(() => {
    if (newScene) {
      dispatchSetScene(newScene)
    }
  }, [newScene, timestamp])

  useEffect(() => {
    console.log('Number of duelists:', queryDuelists.length)
  }, [queryDuelists])

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateRows: 'repeat(2, 1fr)',
        gridTemplateColumns: 'repeat(3, 1fr)',
        width: aspectWidth(70),
        height: aspectHeight(80),
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        gap: '10px'
      }}>
        {queryDuelists.map((duelist) => (
          <div>
            <DuelistCard
              key={duelist.duelist_id}
              duelistId={Number(duelist.duelist_id)}
              isHighlightable={true}
              isHanging={false}
              isFlipped={true}
              isVisible={true}
              instantFlip={true}
              width={DUELIST_CARD_WIDTH}
              height={DUELIST_CARD_HEIGHT}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
