import React from 'react'
import { Segment } from 'semantic-ui-react'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useChallenge } from '/src/stores/challengeStore'
import { AnimationState } from '/src/three/game'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useGameAspect } from '/src/hooks/useGameApect'


export default function DuelStateDisplay({
  duelId,
} : {
  duelId: bigint,
}) {
  const { animated } = useGameplayContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { isFinished } = useChallenge(duelId)

  const { aspectWidth } = useGameAspect()

  //TODO add screen for beginning of duel and for switching between pistols and blade rounds, replace the existing "ready" screen thats there on reload
  return (
    <>
      {(isFinished && animated == AnimationState.Finished) &&  //TODO replace with the sheet of paper that represents the duel and modify to better show outcome, add maybe a winner glow animation around profile picture
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
        </Segment>
      }
    </>
  )
}
