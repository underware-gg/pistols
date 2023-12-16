import { useMemo } from "react"
import { Entity, HasValue, Has, getComponentValue } from '@dojoengine/recs'
import { useComponentValue, useEntityQuery } from "@dojoengine/react"
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity } from "../utils/utils"


//------------------
// All Duels
//

export const useAllDuelIds = () => {
  const { Duel } = useDojoComponents()
  const entityIds: Entity[] = useEntityQuery([Has(Duel)])
  const duelIds: bigint[] = useMemo(() => (entityIds ?? []).map((entityId) => BigInt(entityId)), [entityIds])
  return {
    duelIds,
  }
}


//------------------
// Single Duel
//

export const useDuel = (duelId: bigint | string) => {
  const { Duel } = useDojoComponents()
  const duel: any = useComponentValue(Duel, bigintToEntity(duelId))
  const challenger = useMemo(() => BigInt(duel?.challenger ?? 0), [duel])
  const challenged = useMemo(() => BigInt(duel?.challenged ?? 0), [duel])
  return {
    challenger,
    challenged,
  }
}

