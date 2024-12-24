import React from 'react'
import { ButtonGroup, Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useTutorialProgressSignedMessage } from '/src/hooks/useSignedMessages'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { usePlayer } from '/src/stores/playerStore'


export function TutorialProgressDebug() {
  return (
    <ButtonGroup className='AbsoluteBottom' style={{left: '200px'}}>
      <TutorialProgressButton progress={constants.TutorialProgress.None} label='Tutorial: None' />
      <TutorialProgressButton progress={constants.TutorialProgress.FinishedFirst} label='First Level' />
      <TutorialProgressButton progress={constants.TutorialProgress.FinishedSecond} label='Second Level' />
      <TutorialProgressButton progress={constants.TutorialProgress.FinishedFirstDuel} label='First Duel' />
    </ButtonGroup>
  )
}

function TutorialProgressButton({
  progress,
  label,
}: {
  progress: constants.TutorialProgress
  label: string
}) {
  const { address } = useAccount()
  const { tutorialProgress } = usePlayer(address)
  const { publish, isPublishing } = useTutorialProgressSignedMessage(progress)
  return (
    <Button toggle
      active={progress == tutorialProgress}
      disabled={isPublishing}
      onClick={publish}
    >
      {label}
    </Button>
  )
}

