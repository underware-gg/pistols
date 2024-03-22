import {
  Account,
  BigNumberish,
  TypedData,
  WeierstrassSignatureType,
} from 'starknet'
import { poseidon } from './starknet'

export type Messages = { [key: string]: string }

// https://github.com/starknet-io/starknet.js/blob/develop/www/docs/guides/signature.md
export const signMessages = async (account: Account, messages: Messages): Promise<WeierstrassSignatureType> => {
  const typedMessage = createTypedMessage({ messages })
  return account.signMessage(typedMessage) as Promise<WeierstrassSignatureType>
}
export const verifyMessages = async (account: Account, messages: Messages, signature: WeierstrassSignatureType): Promise<boolean> => {
  const typedMessage = createTypedMessage({ messages })
  return account.verifyMessage(typedMessage, signature)
}

export interface TypedMessageOptions {
  primaryType?: string
  domainName?: string
  chainId?: string
  version?: string
  messages: Messages
}

export function createTypedMessage({
  primaryType = 'Message',
  domainName = "Pistols",
  chainId = "funDAOmental",
  version = "0.1.0",
  messages
}: TypedMessageOptions): TypedData {
  const types = Object.keys(messages).map(v => ({ name: v, type: "felt" }))
  return {
    primaryType,
    domain: {
      name: domainName,
      chainId,
      version,
    },
    types: {
      StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "chainId", type: "felt" },
        { name: "version", type: "felt" },
      ],
      Message: types,
    },
    message: messages,
  }
}

