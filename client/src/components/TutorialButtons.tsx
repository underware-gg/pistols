import React, { useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useTutorialLevel, useTutorialPlayerId, useTutorialProgress } from '/src/hooks/useTutorial'
import { useGetChallenge } from '/src/stores/challengeStore'
import { ActionButton } from '/src/components/ui/Buttons'
import { usePistolsContext } from '/src/hooks/PistolsContext'

export function CreateTutorialChallengeButton({
  tutorial_id,
  label = 'Create Tutorial',
}: {
  tutorial_id: number,
  label?: string,
}) {
  const { account } = useAccount()
  const { tutorial } = useDojoSystemCalls()
  const { playerId } = useTutorialPlayerId()

  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false)
  const _createTutorialChallenge = () => {
    setIsCreatingChallenge(true)
    tutorial.create_tutorial(account, playerId, tutorial_id).finally(() => {
      setIsCreatingChallenge(false)
    })
  }

  return (
    <ActionButton large fill important
      label={label}
      disabled={isCreatingChallenge}
      onClick={() => _createTutorialChallenge()}
    />
  )
}

export function OpenTutorialChallengeButton({
  tutorial_id,
  label = 'Open Tutorial',
}: {
  tutorial_id: number,
  label?: string,
}) {
  const { duelId } = useTutorialLevel(tutorial_id)
  const { isInProgress } = useGetChallenge(duelId)

  const { dispatchSelectDuel } = usePistolsContext()
  const _open = () => {
    dispatchSelectDuel(duelId)
  }

  return (
    <ActionButton large fill important
      label={label}
      disabled={!isInProgress}
      onClick={() => _open()}
    />
  )
}
