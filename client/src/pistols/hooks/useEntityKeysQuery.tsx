import { useMemo } from 'react'
import { Entity, HasValue, Has, getComponentValue, Component, QueryFragment } from '@dojoengine/recs'
import { useEntityQuery, useComponentValue } from '@dojoengine/react'

export const useEntityKeys = (component: Component, keyName: string) => {
  return useEntityKeysQuery(component, [Has(component)], keyName)
}

export const useEntityKeysQuery = (component: Component, query: QueryFragment[], keyName: string) => {
  const entityIds: Entity[] = useEntityQuery(query) ?? []
  const keys: bigint[] = useMemo(() => entityIds.map((entityId) => BigInt(getComponentValue(component, entityId)[keyName])), [entityIds])
  return keys
}
