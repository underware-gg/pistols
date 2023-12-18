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
  u32: { input: any; output: any; }
};

export type Challenge = {
  __typename?: 'Challenge';
  duel_id?: Maybe<Scalars['felt252']['output']>;
  duelist_a?: Maybe<Scalars['ContractAddress']['output']>;
  duelist_b?: Maybe<Scalars['ContractAddress']['output']>;
  entity?: Maybe<World__Entity>;
  message?: Maybe<Scalars['felt252']['output']>;
  pass_code?: Maybe<Scalars['felt252']['output']>;
  state?: Maybe<Scalars['Enum']['output']>;
  timestamp_challenge?: Maybe<Scalars['u32']['output']>;
  timestamp_deadline?: Maybe<Scalars['u32']['output']>;
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
  State = 'STATE',
  TimestampChallenge = 'TIMESTAMP_CHALLENGE',
  TimestampDeadline = 'TIMESTAMP_DEADLINE'
}

export type ChallengeWhereInput = {
  duel_id?: InputMaybe<Scalars['felt252']['input']>;
  duel_idEQ?: InputMaybe<Scalars['felt252']['input']>;
  duel_idGT?: InputMaybe<Scalars['felt252']['input']>;
  duel_idGTE?: InputMaybe<Scalars['felt252']['input']>;
  duel_idLT?: InputMaybe<Scalars['felt252']['input']>;
  duel_idLTE?: InputMaybe<Scalars['felt252']['input']>;
  duel_idNEQ?: InputMaybe<Scalars['felt252']['input']>;
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
  state?: InputMaybe<Scalars['Enum']['input']>;
  timestamp_challenge?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeGT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeGTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeLT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeLTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_challengeNEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadline?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineGT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineGTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineLT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineLTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_deadlineNEQ?: InputMaybe<Scalars['u32']['input']>;
};

export type Duel = {
  __typename?: 'Duel';
  duel_id?: Maybe<Scalars['felt252']['output']>;
  entity?: Maybe<World__Entity>;
  pace?: Maybe<Scalars['u8']['output']>;
  timestamp_end?: Maybe<Scalars['u32']['output']>;
  timestamp_start?: Maybe<Scalars['u32']['output']>;
  winner?: Maybe<Scalars['ContractAddress']['output']>;
};

export type DuelConnection = {
  __typename?: 'DuelConnection';
  edges?: Maybe<Array<Maybe<DuelEdge>>>;
  page_info: World__PageInfo;
  total_count: Scalars['Int']['output'];
};

export type DuelEdge = {
  __typename?: 'DuelEdge';
  cursor?: Maybe<Scalars['Cursor']['output']>;
  node?: Maybe<Duel>;
};

export type DuelOrder = {
  direction: OrderDirection;
  field: DuelOrderField;
};

export enum DuelOrderField {
  DuelId = 'DUEL_ID',
  Pace = 'PACE',
  TimestampEnd = 'TIMESTAMP_END',
  TimestampStart = 'TIMESTAMP_START',
  Winner = 'WINNER'
}

export type DuelWhereInput = {
  duel_id?: InputMaybe<Scalars['felt252']['input']>;
  duel_idEQ?: InputMaybe<Scalars['felt252']['input']>;
  duel_idGT?: InputMaybe<Scalars['felt252']['input']>;
  duel_idGTE?: InputMaybe<Scalars['felt252']['input']>;
  duel_idLT?: InputMaybe<Scalars['felt252']['input']>;
  duel_idLTE?: InputMaybe<Scalars['felt252']['input']>;
  duel_idNEQ?: InputMaybe<Scalars['felt252']['input']>;
  pace?: InputMaybe<Scalars['u8']['input']>;
  paceEQ?: InputMaybe<Scalars['u8']['input']>;
  paceGT?: InputMaybe<Scalars['u8']['input']>;
  paceGTE?: InputMaybe<Scalars['u8']['input']>;
  paceLT?: InputMaybe<Scalars['u8']['input']>;
  paceLTE?: InputMaybe<Scalars['u8']['input']>;
  paceNEQ?: InputMaybe<Scalars['u8']['input']>;
  timestamp_end?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endGT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endGTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endLT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endLTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_endNEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_start?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startEQ?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startGT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startGTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startLT?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startLTE?: InputMaybe<Scalars['u32']['input']>;
  timestamp_startNEQ?: InputMaybe<Scalars['u32']['input']>;
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
  Name = 'NAME'
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
};

export type ModelUnion = Challenge | Duel | Duelist;

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

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
  duelModels?: Maybe<DuelConnection>;
  duelistModels?: Maybe<DuelistConnection>;
  entities?: Maybe<World__EntityConnection>;
  entity: World__Entity;
  events?: Maybe<World__EventConnection>;
  metadatas?: Maybe<World__MetadataConnection>;
  model: World__Model;
  models?: Maybe<World__ModelConnection>;
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


export type World__QueryDuelModelsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<DuelOrder>;
  where?: InputMaybe<DuelWhereInput>;
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


export type GetDuelistQuery = { __typename?: 'World__Query', entities?: { __typename?: 'World__EntityConnection', edges?: Array<{ __typename?: 'World__EntityEdge', node?: { __typename?: 'World__Entity', keys?: Array<string | null> | null, id?: string | null, models?: Array<{ __typename: 'Challenge' } | { __typename: 'Duel' } | { __typename: 'Duelist', address?: any | null, name?: any | null } | null> | null } | null } | null> | null } | null };


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