//@ts-nocheck
import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import { GraphQLError, print } from 'graphql'
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  ContractAddress: { input: any; output: any; }
  Cursor: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  Enum: { input: any; output: any; }
  felt252: { input: any; output: any; }
  u8: { input: any; output: any; }
  u64: { input: any; output: any; }
  u128: { input: any; output: any; }
};

export type Challenge = {
  __typename?: 'Challenge';
  duel_id?: Maybe<Scalars['u128']['output']>;
  duelist_a?: Maybe<Scalars['ContractAddress']['output']>;
  duelist_b?: Maybe<Scalars['ContractAddress']['output']>;
  entity?: Maybe<World__Entity>;
  message?: Maybe<Scalars['felt252']['output']>;
  pass_code?: Maybe<Scalars['felt252']['output']>;
  round?: Maybe<Scalars['u8']['output']>;
  state?: Maybe<Scalars['Enum']['output']>;
  timestamp?: Maybe<Scalars['u64']['output']>;
  timestamp_end?: Maybe<Scalars['u64']['output']>;
  timestamp_expire?: Maybe<Scalars['u64']['output']>;
  timestamp_start?: Maybe<Scalars['u64']['output']>;
  winner?: Maybe<Scalars['ContractAddress']['output']>;
};

export type ChallengeConnection = {
  __typename?: 'ChallengeConnection';
  edges?: Maybe<Array<Maybe<ChallengeEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type ChallengeEdge = {
  __typename?: 'ChallengeEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<Challenge>;
};

export type ChallengeOrder = {
  direction: OrderDirection;
  field: ChallengeOrderField;
};

export enum ChallengeOrderField {
  DuelistA = 'DUELIST_A',
  DuelistB = 'DUELIST_B',
  DuelId = 'DUEL_ID',
  Message = 'MESSAGE',
  PassCode = 'PASS_CODE',
  Round = 'ROUND',
  State = 'STATE',
  Timestamp = 'TIMESTAMP',
  TimestampEnd = 'TIMESTAMP_END',
  TimestampExpire = 'TIMESTAMP_EXPIRE',
  TimestampStart = 'TIMESTAMP_START',
  Winner = 'WINNER'
}

export type ChallengeWhereInput = {
  duel_id?: InputMaybe<Scalars['u128']['input']>;
  duel_idEQ?: InputMaybe<Scalars['u128']['input']>;
  duel_idGT?: InputMaybe<Scalars['u128']['input']>;
  duel_idGTE?: InputMaybe<Scalars['u128']['input']>;
  duel_idLT?: InputMaybe<Scalars['u128']['input']>;
  duel_idLTE?: InputMaybe<Scalars['u128']['input']>;
  duel_idNEQ?: InputMaybe<Scalars['u128']['input']>;
  duelist_a?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aGT?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aGTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aLT?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aLTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_aNEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_b?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bGT?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bGTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bLT?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bLTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  duelist_bNEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  message?: InputMaybe<Scalars['felt252']['input']>;
  messageEQ?: InputMaybe<Scalars['felt252']['input']>;
  messageGT?: InputMaybe<Scalars['felt252']['input']>;
  messageGTE?: InputMaybe<Scalars['felt252']['input']>;
  messageLT?: InputMaybe<Scalars['felt252']['input']>;
  messageLTE?: InputMaybe<Scalars['felt252']['input']>;
  messageNEQ?: InputMaybe<Scalars['felt252']['input']>;
  pass_code?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeEQ?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeGT?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeGTE?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeLT?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeLTE?: InputMaybe<Scalars['felt252']['input']>;
  pass_codeNEQ?: InputMaybe<Scalars['felt252']['input']>;
  round?: InputMaybe<Scalars['u8']['input']>;
  roundEQ?: InputMaybe<Scalars['u8']['input']>;
  roundGT?: InputMaybe<Scalars['u8']['input']>;
  roundGTE?: InputMaybe<Scalars['u8']['input']>;
  roundLT?: InputMaybe<Scalars['u8']['input']>;
  roundLTE?: InputMaybe<Scalars['u8']['input']>;
  roundNEQ?: InputMaybe<Scalars['u8']['input']>;
  state?: InputMaybe<Scalars['Enum']['input']>;
  timestamp?: InputMaybe<Scalars['u64']['input']>;
  timestampEQ?: InputMaybe<Scalars['u64']['input']>;
  timestampGT?: InputMaybe<Scalars['u64']['input']>;
  timestampGTE?: InputMaybe<Scalars['u64']['input']>;
  timestampLT?: InputMaybe<Scalars['u64']['input']>;
  timestampLTE?: InputMaybe<Scalars['u64']['input']>;
  timestampNEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_end?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endGT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endGTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endLT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endLTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_endNEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expire?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireGT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireGTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireLT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireLTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_expireNEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_start?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startEQ?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startGT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startGTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startLT?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startLTE?: InputMaybe<Scalars['u64']['input']>;
  timestamp_startNEQ?: InputMaybe<Scalars['u64']['input']>;
  winner?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerGT?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerGTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerLT?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerLTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  winnerNEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
};

export type Duelist = {
  __typename?: 'Duelist';
  address?: Maybe<Scalars['ContractAddress']['output']>;
  entity?: Maybe<World__Entity>;
  name?: Maybe<Scalars['felt252']['output']>;
  profile_pic?: Maybe<Scalars['u8']['output']>;
};

export type DuelistConnection = {
  __typename?: 'DuelistConnection';
  edges?: Maybe<Array<Maybe<DuelistEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type DuelistEdge = {
  __typename?: 'DuelistEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<Duelist>;
};

export type DuelistOrder = {
  direction: OrderDirection;
  field: DuelistOrderField;
};

export enum DuelistOrderField {
  Address = 'ADDRESS',
  Name = 'NAME',
  ProfilePic = 'PROFILE_PIC'
}

export type DuelistWhereInput = {
  address?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressGT?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressGTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressLT?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressLTE?: InputMaybe<Scalars['ContractAddress']['input']>;
  addressNEQ?: InputMaybe<Scalars['ContractAddress']['input']>;
  name?: InputMaybe<Scalars['felt252']['input']>;
  nameEQ?: InputMaybe<Scalars['felt252']['input']>;
  nameGT?: InputMaybe<Scalars['felt252']['input']>;
  nameGTE?: InputMaybe<Scalars['felt252']['input']>;
  nameLT?: InputMaybe<Scalars['felt252']['input']>;
  nameLTE?: InputMaybe<Scalars['felt252']['input']>;
  nameNEQ?: InputMaybe<Scalars['felt252']['input']>;
  profile_pic?: InputMaybe<Scalars['u8']['input']>;
  profile_picEQ?: InputMaybe<Scalars['u8']['input']>;
  profile_picGT?: InputMaybe<Scalars['u8']['input']>;
  profile_picGTE?: InputMaybe<Scalars['u8']['input']>;
  profile_picLT?: InputMaybe<Scalars['u8']['input']>;
  profile_picLTE?: InputMaybe<Scalars['u8']['input']>;
  profile_picNEQ?: InputMaybe<Scalars['u8']['input']>;
};

export type ModelUnion = Challenge | Duelist | Round;

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Round = {
  __typename?: 'Round';
  duel_id?: Maybe<Scalars['u128']['output']>;
  entity?: Maybe<World__Entity>;
  health_a?: Maybe<Scalars['u8']['output']>;
  health_b?: Maybe<Scalars['u8']['output']>;
  move_a?: Maybe<Scalars['u8']['output']>;
  move_b?: Maybe<Scalars['u8']['output']>;
  round?: Maybe<Scalars['u8']['output']>;
};

export type RoundConnection = {
  __typename?: 'RoundConnection';
  edges?: Maybe<Array<Maybe<RoundEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type RoundEdge = {
  __typename?: 'RoundEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<Round>;
};

export type RoundOrder = {
  direction: OrderDirection;
  field: RoundOrderField;
};

export enum RoundOrderField {
  DuelId = 'DUEL_ID',
  HealthA = 'HEALTH_A',
  HealthB = 'HEALTH_B',
  MoveA = 'MOVE_A',
  MoveB = 'MOVE_B',
  Round = 'ROUND'
}

export type RoundWhereInput = {
  duel_id?: InputMaybe<Scalars['u128']['input']>;
  duel_idEQ?: InputMaybe<Scalars['u128']['input']>;
  duel_idGT?: InputMaybe<Scalars['u128']['input']>;
  duel_idGTE?: InputMaybe<Scalars['u128']['input']>;
  duel_idLT?: InputMaybe<Scalars['u128']['input']>;
  duel_idLTE?: InputMaybe<Scalars['u128']['input']>;
  duel_idNEQ?: InputMaybe<Scalars['u128']['input']>;
  health_a?: InputMaybe<Scalars['u8']['input']>;
  health_aEQ?: InputMaybe<Scalars['u8']['input']>;
  health_aGT?: InputMaybe<Scalars['u8']['input']>;
  health_aGTE?: InputMaybe<Scalars['u8']['input']>;
  health_aLT?: InputMaybe<Scalars['u8']['input']>;
  health_aLTE?: InputMaybe<Scalars['u8']['input']>;
  health_aNEQ?: InputMaybe<Scalars['u8']['input']>;
  health_b?: InputMaybe<Scalars['u8']['input']>;
  health_bEQ?: InputMaybe<Scalars['u8']['input']>;
  health_bGT?: InputMaybe<Scalars['u8']['input']>;
  health_bGTE?: InputMaybe<Scalars['u8']['input']>;
  health_bLT?: InputMaybe<Scalars['u8']['input']>;
  health_bLTE?: InputMaybe<Scalars['u8']['input']>;
  health_bNEQ?: InputMaybe<Scalars['u8']['input']>;
  move_a?: InputMaybe<Scalars['u8']['input']>;
  move_aEQ?: InputMaybe<Scalars['u8']['input']>;
  move_aGT?: InputMaybe<Scalars['u8']['input']>;
  move_aGTE?: InputMaybe<Scalars['u8']['input']>;
  move_aLT?: InputMaybe<Scalars['u8']['input']>;
  move_aLTE?: InputMaybe<Scalars['u8']['input']>;
  move_aNEQ?: InputMaybe<Scalars['u8']['input']>;
  move_b?: InputMaybe<Scalars['u8']['input']>;
  move_bEQ?: InputMaybe<Scalars['u8']['input']>;
  move_bGT?: InputMaybe<Scalars['u8']['input']>;
  move_bGTE?: InputMaybe<Scalars['u8']['input']>;
  move_bLT?: InputMaybe<Scalars['u8']['input']>;
  move_bLTE?: InputMaybe<Scalars['u8']['input']>;
  move_bNEQ?: InputMaybe<Scalars['u8']['input']>;
  round?: InputMaybe<Scalars['u8']['input']>;
  roundEQ?: InputMaybe<Scalars['u8']['input']>;
  roundGT?: InputMaybe<Scalars['u8']['input']>;
  roundGTE?: InputMaybe<Scalars['u8']['input']>;
  roundLT?: InputMaybe<Scalars['u8']['input']>;
  roundLTE?: InputMaybe<Scalars['u8']['input']>;
  roundNEQ?: InputMaybe<Scalars['u8']['input']>;
};

export type World__Content = {
  __typename?: 'World__Content';
  cover_uri?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  icon_uri?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  socials?: Maybe<Array<Maybe<World__Social>>>;
  website?: Maybe<Scalars['String']['output']>;
};

export type World__Entity = {
  __typename?: 'World__Entity';
  created_at?: Maybe<Scalars['DateTime']['output']>;
  event_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  keys?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  models?: Maybe<Array<Maybe<ModelUnion>>>;
  updated_at?: Maybe<Scalars['DateTime']['output']>;
};

export type World__EntityConnection = {
  __typename?: 'World__EntityConnection';
  edges?: Maybe<Array<Maybe<World__EntityEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type World__EntityEdge = {
  __typename?: 'World__EntityEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<World__Entity>;
};

export type World__Event = {
  __typename?: 'World__Event';
  created_at?: Maybe<Scalars['DateTime']['output']>;
  data?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id?: Maybe<Scalars['ID']['output']>;
  keys?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
};

export type World__EventConnection = {
  __typename?: 'World__EventConnection';
  edges?: Maybe<Array<Maybe<World__EventEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type World__EventEdge = {
  __typename?: 'World__EventEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<World__Event>;
};

export type World__Metadata = {
  __typename?: 'World__Metadata';
  content?: Maybe<World__Content>;
  cover_img?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['DateTime']['output']>;
  icon_img?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  updated_at?: Maybe<Scalars['DateTime']['output']>;
  uri?: Maybe<Scalars['String']['output']>;
};

export type World__MetadataConnection = {
  __typename?: 'World__MetadataConnection';
  edges?: Maybe<Array<Maybe<World__MetadataEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type World__MetadataEdge = {
  __typename?: 'World__MetadataEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<World__Metadata>;
};

export type World__Model = {
  __typename?: 'World__Model';
  class_hash?: Maybe<Scalars['felt252']['output']>;
  created_at?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  transaction_hash?: Maybe<Scalars['felt252']['output']>;
};

export type World__ModelConnection = {
  __typename?: 'World__ModelConnection';
  edges?: Maybe<Array<Maybe<World__ModelEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type World__ModelEdge = {
  __typename?: 'World__ModelEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<World__Model>;
};

export type World__PageInfo = {
  __typename?: 'World__PageInfo';
  end_cursor?: Maybe<Scalars['Cursor']['output']>;
  has_next_page?: Maybe<Scalars['Boolean']['output']>;
  has_previous_page?: Maybe<Scalars['Boolean']['output']>;
  start_cursor?: Maybe<Scalars['Cursor']['output']>;
};

export type World__Query = {
  __typename?: 'World__Query';
  challengeModels?: Maybe<ChallengeConnection>;
  duelistModels?: Maybe<DuelistConnection>;
  entities?: Maybe<World__EntityConnection>;
  entity: World__Entity;
  events?: Maybe<World__EventConnection>;
  metadatas?: Maybe<World__MetadataConnection>;
  model: World__Model;
  models?: Maybe<World__ModelConnection>;
  roundModels?: Maybe<RoundConnection>;
  transaction: World__Transaction;
  transactions?: Maybe<World__TransactionConnection>;
};


export type World__QueryChallengeModelsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ChallengeOrder>;
  where?: InputMaybe<ChallengeWhereInput>;
};


export type World__QueryDuelistModelsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<DuelistOrder>;
  where?: InputMaybe<DuelistWhereInput>;
};


export type World__QueryEntitiesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  keys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type World__QueryEntityArgs = {
  id: Scalars['ID']['input'];
};


export type World__QueryEventsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  keys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type World__QueryMetadatasArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type World__QueryModelArgs = {
  id: Scalars['ID']['input'];
};


export type World__QueryModelsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type World__QueryRoundModelsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RoundOrder>;
  where?: InputMaybe<RoundWhereInput>;
};


export type World__QueryTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type World__QueryTransactionsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type World__Social = {
  __typename?: 'World__Social';
  name?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type World__Subscription = {
  __typename?: 'World__Subscription';
  entityUpdated: World__Entity;
  eventEmitted: World__Event;
  modelRegistered: World__Model;
};


export type World__SubscriptionEntityUpdatedArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type World__SubscriptionEventEmittedArgs = {
  keys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type World__SubscriptionModelRegisteredArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type World__Transaction = {
  __typename?: 'World__Transaction';
  calldata?: Maybe<Array<Maybe<Scalars['felt252']['output']>>>;
  created_at?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  max_fee?: Maybe<Scalars['felt252']['output']>;
  nonce?: Maybe<Scalars['felt252']['output']>;
  sender_address?: Maybe<Scalars['felt252']['output']>;
  signature?: Maybe<Array<Maybe<Scalars['felt252']['output']>>>;
  transaction_hash?: Maybe<Scalars['felt252']['output']>;
};

export type World__TransactionConnection = {
  __typename?: 'World__TransactionConnection';
  edges?: Maybe<Array<Maybe<World__TransactionEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type World__TransactionEdge = {
  __typename?: 'World__TransactionEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<World__Transaction>;
};

export type GetDuelistQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GetDuelistQuery = { __typename?: 'World__Query', entities?: { __typename?: 'World__EntityConnection', edges?: Array<{ __typename?: 'World__EntityEdge', node?: { __typename?: 'World__Entity', keys?: Array<string | null> | null, id?: string | null, models?: Array<{ __typename: 'Challenge' } | { __typename: 'Duelist', address?: any | null, name?: any | null } | { __typename: 'Round' } | null> | null } | null } | null> | null } | null };


export const GetDuelistDocument = gql`
    query getDuelist($address: String!) {
  entities(keys: [$address], first: 100) {
    edges {
      node {
        keys
        id
        models {
          __typename
          ... on Duelist {
            address
            name
          }
        }
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();
const GetDuelistDocumentString = print(GetDuelistDocument);
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getDuelist(variables: GetDuelistQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetDuelistQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetDuelistQuery>(GetDuelistDocumentString, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getDuelist', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;