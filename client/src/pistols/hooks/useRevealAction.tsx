import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreActionFromHash } from '../utils/salt'

export function useRevealAction(duelId: bigint, roundNumber: number, hash: bigint) {
  const { reveal_action } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { validPackedActions } = useGetValidPackedActions(roundNumber)

  const canReveal = useMemo(() => (duelId && roundNumber && hash && validPackedActions.length > 0 && !isSubmitting), [duelId, roundNumber, hash, validPackedActions, isSubmitting])
  console.log(`CAN_REVEAL:`, canReveal, duelId, roundNumber, hash, validPackedActions, isSubmitting)

  const reveal = useCallback(async () => {
    if (isSubmitting) return
    console.log(`REVEALING....`)
    const { salt, packed, slot1, slot2 } = await signAndRestoreActionFromHash(account, duelistId, duelId, roundNumber, hash, validPackedActions)
    if (packed != null && slot1 != null && slot2 != null && !isSubmitting) {
      console.log(`REVEALING.... reveal_action()...`)
      setIsSubmitting(true)
      await reveal_action(account, duelistId, duelId, roundNumber, salt, slot1, slot2)
      setIsSubmitting(false)
    }
    console.log(`REVEALED!`)
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
