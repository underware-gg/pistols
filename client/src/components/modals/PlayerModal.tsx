import React, { useMemo } from 'react'
import { Grid, Modal } from 'semantic-ui-react'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ProfilePoster } from '/src/components/ui/ProfilePoster'

export default function PlayerModal() {
  const { selectedPlayerAddress } = usePistolsContext()
  const isOpen = useMemo(() => (selectedPlayerAddress > 0n), [selectedPlayerAddress])
  return <>{isOpen && <_PlayerModal isOpen={isOpen} />}</>
}

function _PlayerModal({
  isOpen,
}: {
  isOpen: boolean
}) {
  const { selectedPlayerAddress, dispatchSelectPlayerAddress } = usePistolsContext()

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
          instantVisible={true}
          isHighlightable={false}
        />
      </div>
    </Modal>
  )
}