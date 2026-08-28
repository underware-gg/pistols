import {
  StarknetWalletApi,
  type WalletWithStarknetFeatures,
} from '@starknet-io/get-starknet-core'

export type Connector = WalletWithStarknetFeatures

export const getConnectorId = (connector?: Connector): string | undefined => (
  connector?.features[StarknetWalletApi].id
)
