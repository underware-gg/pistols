import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreActionFromHash } from '../utils/salt'

export function useRevealAction(duelId: bigint, roundNumber: number, hash: bigint, enabled: boolean) {
  const { reveal_action } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { validPackedActions } = useGetValidPackedActions(roundNumber)

  const canReveal = useMemo(() =>
    (enabled && duelId && roundNumber && hash && validPackedActions.length > 0 && !isSubmitting),
  [enabled, duelId, roundNumber, hash, validPackedActions, isSubmitting])

  const reveal = useCallback(async () => {
    if (isSubmitting) return
    const { salt, packed, slot1, slot2 } = await signAndRestoreActionFromHash(account, duelistId, duelId, roundNumber, hash, validPackedActions)
    if (packed != null && slot1 != null && slot2 != null && !isSubmitting) {
      setIsSubmitting(true)
      await reveal_action(account, duelistId, duelId, roundNumber, salt, slot1, slot2)
      setIsSubmitting(false)
    }
  }, [account, duelistId, duelId, roundNumber, hash, validPackedActions])

  //
  // auto-reveal 
  useEffect(() => {
    if (canReveal) {
      reveal()
    }
  }, [canReveal])

  return {
    reveal,
  }
}
