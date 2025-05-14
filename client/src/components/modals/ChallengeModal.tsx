import React, { useMemo } from 'react'
import { Modal } from 'semantic-ui-react'

import { usePistolsContext } from '/src/hooks/PistolsContext'
import { DuelPoster } from '/src/components/DuelPoster'

export default function ChallengeModal() {
  const { selectedDuelId } = usePistolsContext()
  const isOpen = useMemo(() => (selectedDuelId > 0n), [selectedDuelId])
  return <>{isOpen && <_ChallengeModal isOpen={isOpen} />}</>
}

function _ChallengeModal({
  isOpen,
}: {
  isOpen: boolean
}) {
  const { selectedDuelId, dispatchSelectDuel } = usePistolsContext()

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
