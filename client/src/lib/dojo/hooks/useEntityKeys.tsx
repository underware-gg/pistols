import { useMemo } from 'react'
import { Entity, Has, getComponentValue, Component, QueryFragment } from '@dojoengine/recs'
import { useEntityQuery } from '@dojoengine/react'

export const useEntityKeys = (component: Component, keyName: string) => {
  return useEntityKeysQuery(component, keyName, [Has(component)])
}

export const useEntityKeysQuery = (component: Component, keyName: string, query: QueryFragment[]) => {
  const entityIds: Entity[] = useEntityQuery(query) ?? []
  const keys: bigint[] = useMemo(() => entityIds.map((entityId) => BigInt(getComponentValue(component, entityId)[keyName])), [entityIds])
  return keys
}
