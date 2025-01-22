import { useMemo } from 'react'
import { usePlayerId } from '@underware_gg/pistols-sdk/utils'
import { useSettings } from '/src/hooks/SettingsContext'
import { useTutorialDuelId } from '/src/hooks/usePistolsContractCalls'
import { constants } from '@underware_gg/pistols-sdk/pistols'

export const useTutorialPlayerId = () => {
  const { playerId } = usePlayerId()
  const player_id = useMemo(() => (BigInt(playerId ?? 0) & constants.BITWISE.MAX_U128), [playerId])
  return {
    playerId: player_id,
  }
}

export const useTutorialProgress = () => {
  const { tutorialProgress } = useSettings()
  const currentTutorialId = useMemo(() => (
    tutorialProgress == constants.TutorialProgress.None ? 1
      : tutorialProgress == constants.TutorialProgress.FinishedFirst ? 2
        : 0
  ), [tutorialProgress])
  const isFinished = useMemo(() => (
    tutorialProgress == constants.TutorialProgress.FinishedSecond
  ), [tutorialProgress])
  return {
    tutorialProgress,
    currentTutorialId,
    isFinished,
  }
}

export const useTutorialLevel = (tutorial_id: number) => {
  const { playerId } = useTutorialPlayerId()
  const { duelId } = useTutorialDuelId(playerId, tutorial_id)
  return {
    duelId,
  }
}

