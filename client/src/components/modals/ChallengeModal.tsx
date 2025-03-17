import React, { useMemo } from 'react'
import { Modal } from 'semantic-ui-react'

import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelPoster } from '../DuelPoster'


export default function ChallengeModal() {
  const { selectedDuelId, dispatchSelectDuel } = usePistolsContext()
  const isOpen = useMemo(() => (selectedDuelId > 0), [selectedDuelId])

  const _close = () => { dispatchSelectDuel(0n) }

  
  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={isOpen}
      className=''
    >
      <div className='PosterModal'> 
        <DuelPoster 
          duelId={selectedDuelId} 
          _close={_close} 
          isSmall={false}
          isVisible={true}
          isFlipped={true}
          instantVisible={true}
          isHighlightable={false}
        />
      </div>
    </Modal>
  )
}
