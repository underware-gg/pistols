import { useMemo } from 'react'
import { Entity, Has, Component, QueryFragment } from '@dojoengine/recs'
import { useEntityQuery } from '@dojoengine/react'
import { entityIdToKey } from '@/lib/utils/types'

export const useEntityKeys = (component: Component, keyName: string) => {
  return useEntityKeysQuery(component, keyName, [Has(component)])
}

export const useEntityKeysQuery = (component: Component, keyName: string, query: QueryFragment[]) => {
  const entityIds: Entity[] = useEntityQuery(query) ?? []
  const keys: bigint[] = useMemo(() => entityIds.map((entityId) => entityIdToKey(component, keyName, entityId)), [entityIds])
  return keys
}
