import { ParsedEntity, SubscriptionQueryType, QueryType, UnionOfModelData } from '@dojoengine/sdk'
import { models } from '../../../games/pistols'

type PistolsSchemaType = models.SchemaType
type PistolsSchemaModels = PistolsSchemaType['pistols']
type PistolsSchemaModelNames = keyof PistolsSchemaModels
type PistolsModelType = UnionOfModelData<PistolsSchemaType>
type PistolsGetQuery = QueryType<PistolsSchemaType>
type PistolsSubQuery = SubscriptionQueryType<PistolsSchemaType>
type PistolsEntity = ParsedEntity<PistolsSchemaType>

export type {
  PistolsSchemaType,
  PistolsSchemaModels,
  PistolsSchemaModelNames,
  PistolsModelType,
  PistolsGetQuery,
  PistolsSubQuery,
  PistolsEntity,
}
