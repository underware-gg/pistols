import React, { useCallback, useEffect } from 'react'
import { Segment } from 'semantic-ui-react'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useGetChallenge } from '/src/stores/challengeStore'
import { AnimationState } from '/src/three/game'
import { useChallengeDescription } from '/src/hooks/useChallengeDescription'
import { useGameAspect } from '/src/hooks/useGameAspect'
import { ActionButton } from '../Buttons'
import { SceneName } from '/src/data/assets'
import { usePistolsContext, usePistolsScene } from '/src/hooks/PistolsContext'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { SettingsActions, useSettings } from '/src/hooks/SettingsContext'


export default function DuelStateDisplay({
  duelId
} : {
  duelId: bigint,
}) {
  const { animated } = useGameplayContext()

  const { dispatchSetting } = useSettings()
  const { dispatchSetScene } = usePistolsScene()
  const { dispatchSetTutorialLevel } = usePistolsContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { isFinished: isFinishedTutorial, isTutorial, tutorialLevel } = useGetChallenge(duelId)
  const { isFinished } = useGetChallenge(duelId)

  const { aspectWidth } = useGameAspect()

  const handleContinue = useCallback(() => {
    if (tutorialLevel === 1) {
      dispatchSetting(SettingsActions.TUTORIAL_LEVEL, 1)
      dispatchSetScene(SceneName.TutorialScene3)
      dispatchSetTutorialLevel(DuelTutorialLevel.NONE)
    } else {
      dispatchSetting(SettingsActions.TUTORIAL_LEVEL, 2)
      dispatchSetScene(SceneName.TutorialScene4)
      dispatchSetTutorialLevel(DuelTutorialLevel.NONE)
    }
  }, [tutorialLevel, dispatchSetTutorialLevel, dispatchSetScene])

  //TODO add screen for beginning of duel and for switching between pistols and blade rounds, replace the existing "ready" screen thats there on reload
  return (
    <>
      {(!isTutorial && isFinished && animated == AnimationState.Finished) &&  //TODO replace with the sheet of paper that represents the duel and modify to better show outcome, add maybe a winner glow animation around profile picture
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
        </Segment>
      }
      {(isTutorial && isFinishedTutorial && animated == AnimationState.Finished) &&  //TODO replace with the sheet of paper that represents the duel and modify to better show outcome, add maybe a winner glow animation around profile picture
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
          <ActionButton large fill label='Continue' onClick={() => handleContinue()} />
        </Segment>
      }
    </>
  )
}
