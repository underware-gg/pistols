import { useDojoComponents } from '@/dojo/DojoContext'
import { useComponentValue } from "@dojoengine/react"
import { bigintToEntity } from '@/pistols/utils/utils'
import { BigNumberish } from 'starknet'

export const useWager = (duelId: BigNumberish) => {
  const { Wager } = useDojoComponents()
  const wager: any = useComponentValue(Wager, bigintToEntity(duelId))

  return {
    coin: wager?.coin ?? null,
    value: wager?.value ?? null,
    fee: wager?.fee ?? null,
    formatted: wager?.coin ?? null,
    feeFormatted: wager?.fee ?? null,
  }
}
