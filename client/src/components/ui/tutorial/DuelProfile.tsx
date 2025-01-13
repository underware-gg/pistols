import React, { useMemo } from 'react'
import { SemanticFLOATS, Image } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { useOwnerOfDuelist } from '/src/hooks/useDuelistToken'
import { useGameAspect } from '/src/hooks/useGameApect'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { ProfilePic } from '/src/components/account/ProfilePic'
import { FameBalanceDuelist } from '/src/components/account/LordsBalance'

export default function DuelProfile({
  duelistId,
  floated
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
}) {
  const { profilePic, name, nameDisplay } = useDuelist(duelistId)
  const { owner } = useOwnerOfDuelist(duelistId)
  const { aspectWidth } = useGameAspect()
  const { dispatchSelectDuelistId } = usePistolsContext()

  const contentLength = useMemo(() => Math.floor(nameDisplay.length/10), [nameDisplay])

  return (
    <>
      {floated == 'left' &&
        <>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)} >
            <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag' />
          </div>
          <Image className='NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), left: aspectWidth(8.3) }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><FameBalanceDuelist duelistId={duelistId}/></div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), right: aspectWidth(8.3), display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><FameBalanceDuelist duelistId={duelistId}/></div>
          </div>
          <div className='YesMouse NoDrag' onClick={() => dispatchSelectDuelistId(duelistId)}>
            <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag' />
          </div>
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/duel/player_profile.png' style={{ position: 'absolute' }} />
        </>
      }
    </>
  )
}