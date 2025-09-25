import {
  GetParams,
  ToriiResponse,
  ParsedEntity,
  ClauseBuilder,
  ToriiQueryBuilder,
  HistoricalToriiQueryBuilder,
  UnionOfModelData,
} from '@dojoengine/sdk'
import * as torii from '@dojoengine/torii-client'
import * as models from 'src/games/pistols/generated/models.gen'

type PistolsSchemaType = models.SchemaType;
type PistolsSchemaModels = PistolsSchemaType['pistols'];
type PistolsSchemaModelNames = keyof PistolsSchemaModels;

// export type ToriiResponse<T extends SchemaType> = Pagination<T, StandardizedQueryResult<T>>;
type PistolsGetParams = GetParams<PistolsSchemaType>;
type PistolsToriiResponse = ToriiResponse<PistolsSchemaType>;
type PistolsModelType = UnionOfModelData<PistolsSchemaType>;
type PistolsEntity = ParsedEntity<PistolsSchemaType>;

type SdkSubscribeResponse = [
  PistolsToriiResponse,
  torii.Subscription
];

type SdkSubscriptionCallbackResponse = {
  data?: PistolsEntity[]
  error?: Error
};

export type {
  PistolsSchemaType,
  PistolsSchemaModels,
  PistolsSchemaModelNames,
  PistolsGetParams,
  PistolsToriiResponse,
  PistolsModelType,
  PistolsEntity,
  SdkSubscribeResponse,
  SdkSubscriptionCallbackResponse,
}

class PistolsQueryBuilder extends ToriiQueryBuilder<PistolsSchemaType> { }
class PistolsHistoricalQueryBuilder extends HistoricalToriiQueryBuilder<PistolsSchemaType> { }
class PistolsClauseBuilder extends ClauseBuilder<PistolsSchemaType> { }

export {
  PistolsQueryBuilder,
  PistolsHistoricalQueryBuilder,
  PistolsClauseBuilder,
}
