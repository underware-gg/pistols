import { useMemo } from 'react'
import { usePlayerId } from '@underware_gg/pistols-sdk/utils/hooks'
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
  const { completedTutorialLevel, hasFinishedTutorial } = useSettings()
  const currentTutorialId = useMemo(() => (
    !hasFinishedTutorial ? (completedTutorialLevel + 1) : 0
  ), [completedTutorialLevel, hasFinishedTutorial])
  return {
    completedTutorialLevel,
    currentTutorialId,
    hasFinishedTutorial,
  }
}

export const useTutorialLevel = (tutorial_id: number) => {
  const { playerId } = useTutorialPlayerId()
  const { duelId } = useTutorialDuelId(playerId, tutorial_id)
  return {
    duelId,
  }
}

