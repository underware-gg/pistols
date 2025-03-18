import React, { useMemo } from 'react'
import { SemanticFLOATS, Image } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { usePlayer } from '/src/stores/playerStore'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

export default function DuelProfile({
  playerAddress,
  duelistId,
  floated,
  tutorialLevel
}: {
  playerAddress: BigNumberish,
  duelistId: BigNumberish,
  floated: SemanticFLOATS,
  tutorialLevel: DuelTutorialLevel
}) {
  const { name } = usePlayer(playerAddress)
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectPlayerAddress } = usePistolsContext()

  const { profilePic, profileType, name: duelistName } = useDuelist(duelistId)

  const contentLength = useMemo(() => Math.floor(name.length/10), [name])
  const duelistContentLength = useMemo(() => Math.floor(duelistName.length/10), [duelistName])

  return (
    <>
      {floated == 'left' &&
        <>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectPlayerAddress(playerAddress)} >
            <ProfilePic circle profilePic={tutorialLevel === DuelTutorialLevel.FULL ? profilePic : 0} profileType={tutorialLevel === DuelTutorialLevel.FULL ? profileType : constants.ProfileType.Character} className='NoMouse NoDrag' />
          </div>
          <Image className='NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), left: aspectWidth(8.3) }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{name}</div>
            <div className='NoMargin ProfileName' data-contentlength={duelistContentLength}>{duelistName}</div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), right: aspectWidth(8.3), display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{name}</div>
            <div className='NoMargin ProfileName' data-contentlength={duelistContentLength}>{duelistName}</div>
          </div>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectPlayerAddress(playerAddress)}>
            <ProfilePic circle profilePic={tutorialLevel === DuelTutorialLevel.FULL ? profilePic : 0} profileType={tutorialLevel === DuelTutorialLevel.FULL ? profileType : constants.ProfileType.Character} className='NoMouse NoDrag' />
          </div>
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
        </>
      }
    </>
  )
}