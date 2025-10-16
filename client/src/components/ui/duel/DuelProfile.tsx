import React, { useMemo } from 'react'
import { SemanticFLOATS, Image } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePlayer } from '/src/stores/playerStore'
import { usePlayerAvatar } from '/src/stores/playerStore'
import { StampImage } from '/src/components/ui/StampImage'

export default function DuelProfile({
  playerAddress,
  duelistId,
  floated,
  isTutorial
}: {
  playerAddress: BigNumberish,
  duelistId: BigNumberish,
  floated: SemanticFLOATS,
  isTutorial: boolean
}) {
  const { name, isBlocked, isTeamMember, activeSignetRing } = usePlayer(playerAddress)
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectPlayerAddress } = usePistolsContext()
  const { avatarUrl, apiAvatarUrl } = usePlayerAvatar(playerAddress)

  const { profilePic, profileType, nameAndId: duelistName } = useDuelist(duelistId)

  const contentLength = useMemo(() => Math.floor(name.length/10), [name])
  const duelistContentLength = useMemo(() => Math.floor(duelistName.length/10), [duelistName])

  const profileImage = useMemo(() => {
    if (isBlocked || isTeamMember || (activeSignetRing !== null &&  activeSignetRing !== constants.RingType.Unknown)) {
      return '/images/ui/duel/player_profile_stamp.png'
    }
    return '/images/ui/duel/player_profile.png'
  }, [isBlocked, isTeamMember, activeSignetRing])

  return (
    <>
      {floated == 'left' &&
        <>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectPlayerAddress(playerAddress)} >
          <ProfilePic 
            circle 
            profilePic={isTutorial ? profilePic : (avatarUrl ? undefined : 0)} 
            profilePicUrl={isTutorial ? undefined : avatarUrl} 
            fallbackPicUrl={isTutorial ? undefined : apiAvatarUrl}
            profileType={isTutorial ? profileType : constants.DuelistProfile.Character} 
            className='NoMouse NoDrag' 
          />
          </div>
          <Image className='NoMouse NoDrag' src={profileImage} style={{ position: 'absolute' }} />
          <StampImage playerAddress={playerAddress} size="DuelProfile" position="Left" />
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), left: aspectWidth(8.3) }}>
            {!isTutorial && <div className='NoMargin ProfileName' data-contentlength={contentLength}>{name}</div>}
            <div className="ProfileName DuelistName" data-contentlength={duelistContentLength} style={ isTutorial ? { marginTop: aspectWidth(0.4) } : undefined }>{duelistName}</div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), right: aspectWidth(8.3), display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            {!isTutorial && <div className='NoMargin ProfileName' data-contentlength={contentLength}>{name}</div>}
            <div className={`ProfileName DuelistName`} data-contentlength={duelistContentLength} style={ isTutorial ? { marginTop: aspectWidth(0.4) } : undefined }>{duelistName}</div>
          </div>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectPlayerAddress(playerAddress)}>
          <ProfilePic
            circle
            profilePic={isTutorial ? profilePic : (avatarUrl ? undefined : 0)}
            profilePicUrl={isTutorial ? undefined : avatarUrl} 
            profileType={isTutorial ? profileType : constants.DuelistProfile.Character}
            className='NoMouse NoDrag'
          />
          </div>
          <Image className='FlipHorizontal NoMouse NoDrag' src={profileImage} style={{ position: 'absolute' }} />
          <StampImage playerAddress={playerAddress} size="DuelProfile" position="Right" />
        </>
      }
    </>
  )
}