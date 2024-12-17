import React from 'react'
import { ButtonGroup, Button } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useTutorialProgressSignedMessage } from '@/pistols/hooks/useSignedMessages'
import { TutorialProgress } from '@/games/pistols/generated/constants'
import { usePlayer } from '../stores/playerStore'


export function TutorialProgressDebug() {
  return (
    <ButtonGroup className='AbsoluteBottom' style={{left: '200px'}}>
      <TutorialProgressButton progress={TutorialProgress.None} label='Tutorial: None' />
      <TutorialProgressButton progress={TutorialProgress.FinishedFirst} label='First Level' />
      <TutorialProgressButton progress={TutorialProgress.FinishedSecond} label='Second Level' />
      <TutorialProgressButton progress={TutorialProgress.FinishedFirstDuel} label='First Duel' />
    </ButtonGroup>
  )
}

function TutorialProgressButton({
  progress,
  label,
}: {
  progress: TutorialProgress
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

