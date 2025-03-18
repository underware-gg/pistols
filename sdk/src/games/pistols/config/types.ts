import { ParsedEntity, UnionOfModelData, ToriiQueryBuilder, ClauseBuilder } from '@dojoengine/sdk'
import * as models from 'src/games/pistols/generated/models.gen'

type PistolsSchemaType = models.SchemaType;
type PistolsSchemaModels = PistolsSchemaType['pistols'];
type PistolsSchemaModelNames = keyof PistolsSchemaModels;
type PistolsModelType = UnionOfModelData<PistolsSchemaType>;
type PistolsEntity = ParsedEntity<PistolsSchemaType>;

export type {
  PistolsSchemaType,
  PistolsSchemaModels,
  PistolsSchemaModelNames,
  PistolsModelType,
  PistolsEntity,
}

class PistolsQueryBuilder extends ToriiQueryBuilder<PistolsSchemaType> { }
class PistolsClauseBuilder extends ClauseBuilder<PistolsSchemaType> { }

export {
  PistolsQueryBuilder,
  PistolsClauseBuilder,
}
