import React, { useEffect, useMemo, useState } from 'react'
import { Grid } from 'semantic-ui-react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useGetValidPackedActions } from '@/pistols/hooks/useContractCalls'
import { signAndRestoreActionFromHash } from '../utils/salt'

const Row = Grid.Row
const Col = Grid.Column

export default function RevealModal({
  isOpen,
  setIsOpen,
  duelId,
  roundNumber,
  hash,
}: {
  isOpen: boolean
  setIsOpen: Function
  duelId: bigint
  roundNumber: number
  hash: bigint
}) {
  const { reveal_action } = useDojoSystemCalls()
  const { account } = useAccount()
  const { duelistId } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { validPackedActions } = useGetValidPackedActions(roundNumber)

  const canReveal = useMemo(() => (isOpen && duelId && roundNumber && hash && validPackedActions.length > 0 && !isSubmitting), [isOpen, duelId, roundNumber, hash, validPackedActions, isSubmitting])

  const _reveal = async () => {
    setIsSubmitting(true)
    const { salt, packed, slot1, slot2 } = await signAndRestoreActionFromHash(account, duelistId, duelId, roundNumber, hash, validPackedActions)
    if (packed != null && slot1 != null && slot2 != null) {
      await reveal_action(account, duelistId, duelId, roundNumber, salt, slot1, slot2)
      setIsOpen(false)
    }
    setIsSubmitting(false)
  }

  //
  // auto-reveal (no modal)
  //
  useEffect(() => {
    if (canReveal) {
      _reveal()
    }
  }, [canReveal])

  return <></>
}
