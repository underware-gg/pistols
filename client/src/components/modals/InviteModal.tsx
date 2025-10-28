import React, { useEffect, useMemo } from 'react'
import { Modal } from 'semantic-ui-react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { ProfilePoster } from '/src/components/ui/ProfilePoster'
import { usePlayerAddressFromUsername } from '/src/stores/playerStore'
import { useRouteSlugs } from '/src/hooks/useRoute'
import { SceneName } from '/src/data/assetsTypes'
import { useCookies } from 'react-cookie'
import { BigNumberish } from 'starknet'

export const REFERER_USERNAME_COOKIE_NAME = 'referrer_username'
export const REFERER_ADDRESS_COOKIE_NAME = 'referrer_address'

export default function InviteModal() {
  const { atInvite } = usePistolsScene()

  // convert referrer username to address
  const [cookies, setCookie] = useCookies([]);
  const { referrer_username } = useRouteSlugs();
  const referrerAddress = usePlayerAddressFromUsername(referrer_username);
  useEffect(() => {
    if (referrer_username) {
      setCookie(REFERER_USERNAME_COOKIE_NAME, referrer_username, { path: '/' });
    }
  }, [referrer_username])
  
  useEffect(() => {
    if (referrerAddress) {
      setCookie(REFERER_ADDRESS_COOKIE_NAME, referrerAddress, { path: '/' });
    }
  }, [referrerAddress])

  const isOpen = atInvite;
  return <>{isOpen && <_InviteModal isOpen={isOpen} referrerAddress={referrerAddress} />}</>
}

function _InviteModal({
  isOpen,
  referrerAddress,
}: {
  isOpen: boolean
  referrerAddress: BigNumberish
}) {
  const { dispatchSetScene } = usePistolsScene()

  const _close = () => {
    dispatchSetScene(SceneName.Profile);
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
          playerAddress={referrerAddress} 
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