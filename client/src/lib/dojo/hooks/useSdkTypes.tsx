import { ParsedEntity, SubscriptionQueryType, QueryType, UnionOfModelData } from '@dojoengine/sdk'
import { SchemaType } from '@/games/pistols/generated/typescript/models.gen'
import * as models from '@/games/pistols/generated/typescript/models.gen'

type PistolsSchemaType = SchemaType
type PistolsModelType = UnionOfModelData<PistolsSchemaType>
type PistolsGetQuery = QueryType<PistolsSchemaType>
type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>
type PistolsEntity = ParsedEntity<PistolsSchemaType>

export type {
  PistolsSchemaType,
  PistolsModelType,
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
  models,
}
