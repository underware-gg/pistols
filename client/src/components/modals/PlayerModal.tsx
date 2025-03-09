import React, { useMemo } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ProfilePoster } from '../ui/ProfilePoster'

export default function PlayerModal() {
  const { selectedPlayerAddress, dispatchSelectPlayerAddress } = usePistolsContext()

  const isOpen = useMemo(() => (selectedPlayerAddress > 0), [selectedPlayerAddress])

  const _close = () => {
    dispatchSelectPlayerAddress(0n)
  }

  return (
    <Modal
      basic
      size='fullscreen'
      onClose={() => _close()}
      open={isOpen}
      className=''
    >
      <div className='PosterModal'> 
        <ProfilePoster 
          playerAddress={selectedPlayerAddress} 
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