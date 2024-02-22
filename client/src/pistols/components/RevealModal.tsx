import React, { useEffect, useMemo, useState } from 'react'
import { Grid } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { Blades } from '@/pistols/utils/pistols'
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
  const { account } = useDojoAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const _reveal = async () => {
    const possibleActions = roundNumber == 1 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : roundNumber == 2 ? [Blades.Light, Blades.Heavy, Blades.Block] : []
    setIsSubmitting(true)
    const { salt, action } = await signAndRestoreActionFromHash(account, duelId, roundNumber, hash, possibleActions)
    if (action) {
      await reveal_action(account, duelId, roundNumber, salt, action, 0)
      setIsOpen(false)
    }
    setIsSubmitting(false)
  }

  const canReveal = useMemo(() => (isOpen && duelId && roundNumber && hash && !isSubmitting), [isOpen, duelId,roundNumber, hash, isSubmitting])

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
