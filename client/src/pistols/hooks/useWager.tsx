import { useMemo } from 'react'
import { getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from "@dojoengine/react"
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useChallengesByDuelist } from '@/pistols/hooks/useChallenge'
import { useLordsContract } from '@/lib/dojo/hooks/useLords'
import { ChallengeState } from '@/pistols/utils/pistols'
import { feltToString } from '@/lib/utils/starknet'
import { bigintEquals, bigintToEntity, bigintToHex } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

export const useWager = (duelId: BigNumberish) => {
  const { Wager } = useDojoComponents()
  const wager: any = useComponentValue(Wager, bigintToEntity(duelId))

  return {
    value: wager?.value ?? null,
    fee: wager?.fee ?? null,
    feeFormatted: wager?.fee ?? null,
  }
}

export const useLockedLordsBalance = (address: bigint) => {
  const { contractAddress } = useLordsContract()
  const { Wager, TTable } = useDojoComponents()
  const { raw_challenges } = useChallengesByDuelist(address)
  const { wagers, fees, total } = useMemo(() => {
    let wagers = 0n
    let fees = 0n
    raw_challenges.forEach((raw_challenge) => {
      const table = getComponentValue(TTable, bigintToEntity(raw_challenge.table_id))
      // if (feltToString(raw_challenge.table_id) == tableId) {
      if (bigintEquals(table.contract_address, contractAddress)) {
        if (raw_challenge.state == ChallengeState.InProgress ||
          (raw_challenge.state == ChallengeState.Awaiting && bigintEquals(address, raw_challenge.duelist_a))
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
