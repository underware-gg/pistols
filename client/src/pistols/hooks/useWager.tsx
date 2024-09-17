import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from "@dojoengine/react"
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useChallengesByOwner } from '@/pistols/hooks/useChallenge'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { bigintEquals, bigintToEntity } from '@/lib/utils/types'
import { ChallengeState } from '@/games/pistols/generated/constants'

export const useWager = (duelId: BigNumberish) => {
  const { Wager } = useDojoComponents()
  const wager: any = useComponentValue(Wager, bigintToEntity(duelId))

  return {
    value: wager ? BigInt(wager.value) : null,
    fee: wager ? BigInt(wager.fee) : null,
    feeFormatted: wager?.fee ?? null,
  }
}

export const useLockedLordsBalance = (address: bigint) => {
  const { contractAddress } = useLordsContract()
  const { Wager, TableConfig } = useDojoComponents()
  const { raw_challenges } = useChallengesByOwner(address)
  const { wagers, fees, total } = useMemo(() => {
    let wagers = 0n
    let fees = 0n
    raw_challenges.forEach((raw_challenge) => {
      const table = getComponentValue(TableConfig, bigintToEntity(raw_challenge.table_id))
      // if (feltToString(raw_challenge.table_id) == tableId) {
      const state = raw_challenge.state as ChallengeState
      if (bigintEquals(table.fee_contract_address, contractAddress)) {
        if (state == ChallengeState.InProgress ||
          (state == ChallengeState.Awaiting && bigintEquals(address, raw_challenge.address_a))
        ) {
          const wager = getComponentValue(Wager, bigintToEntity(raw_challenge.duel_id))
          if (wager) {
            wagers += wager.value
            fees += wager.fee
          }
        }
      }
    })
    return {
      wagers,
      fees,
      total: (wagers + fees)
    }

  }, [address, raw_challenges, contractAddress])
  return {
    wagers,
    fees,
    total,
  }
}
