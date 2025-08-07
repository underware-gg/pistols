import {
  SchemaType,
  // GetParams,
  // ToriiResponse,
  ParsedEntity,
  ClauseBuilder,
  ToriiQueryBuilder,
  HistoricalToriiQueryBuilder,
  // UnionOfModelData,
  StandardizedQueryResult,
} from '@dojoengine/sdk'
import * as torii from '@dojoengine/torii-client'
import * as models from 'src/games/pistols/generated/models.gen'

//----------------------------------------
// SDK FIX
interface GetParams<T extends SchemaType> {
  query: ToriiQueryBuilder<T>;
  historical?: boolean;
}
interface Pagination<T extends SchemaType, Inner extends any[]> {
  cursor?: string;
  getItems(): Inner;
  getNextQuery(query: ToriiQueryBuilder<T>): ToriiQueryBuilder<T>;
  getPreviousQuery(query: ToriiQueryBuilder<T>): ToriiQueryBuilder<T>;
};
type ToriiResponse<T extends SchemaType> = Pagination<T,StandardizedQueryResult<T>>;
export type UnionOfModelData<T extends SchemaType> = {
  [K in keyof T]: {
    [L in keyof T[K]]: T[K][L];
  }[keyof T[K]];
}[keyof T];
//----------------------------------------


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
