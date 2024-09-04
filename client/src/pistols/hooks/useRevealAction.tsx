import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreActionFromHash } from '../utils/salt'
import { feltToString } from '@/lib/utils/starknet'

export function useRevealAction(duelId: bigint, roundNumber: number, hash: bigint, enabled: boolean) {
  const { reveal_moves } = useDojoSystemCalls()
  const { account, chainId } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { validPackedActions } = useGetValidPackedActions(roundNumber)

  const canReveal = useMemo(() =>
    (enabled && duelId && roundNumber && hash && validPackedActions.length > 0 && !isSubmitting),
  [enabled, duelId, roundNumber, hash, validPackedActions, isSubmitting])
  // console.log(`canReveal:`, canReveal, enabled, duelId, roundNumber, hash, validPackedActions, isSubmitting)

  const reveal = useCallback(async () => {
    if (canReveal) {
      const { salt, packed, slot1, slot2 } = await signAndRestoreActionFromHash(account, feltToString(chainId), duelistId, duelId, roundNumber, hash, validPackedActions)
      if (packed != null && slot1 != null && slot2 != null && !isSubmitting) {
        setIsSubmitting(true)
        await reveal_moves(account, duelistId, duelId, roundNumber, salt, slot1, slot2)
        setIsSubmitting(false)
      }
    }
  }, [account, chainId, duelistId, duelId, roundNumber, hash, validPackedActions, canReveal, isSubmitting])

  return {
    canReveal,
    reveal,
  }
}
