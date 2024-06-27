import { cleanObject } from '@/lib/utils/types'
import {
  Account,
  TypedData,
  Signature,
  ArraySignatureType,
  WeierstrassSignatureType,
  typedData,
  BigNumberish,
} from 'starknet'

export type Messages = { [key: string]: string }

export const splitSignature = (signature: Signature): bigint[] => {
  if (Array.isArray(signature)) {
    const sig = signature as ArraySignatureType
    return [BigInt(sig[0]), BigInt(sig[1])]
  }
  if (signature?.r && signature?.s) {
    const sig = signature as WeierstrassSignatureType
    return [sig.r, sig.s]
  }
  return []
}

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
  domainName = "Underware",
  chainId = "UNDERWARE_GG",
  version = "0.1.0",
  messages
}: TypedMessageOptions): TypedData {
  const _messages = cleanObject(messages)
  const _types = Object.keys(_messages).map(v => ({ name: v, type: "felt" }))
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
      Message: _types,
    },
    message: _messages,
  }
}

export function getMessageHash(messages: TypedData, address: BigNumberish): string {
  return (messages && address) ? typedData.getMessageHash(messages, address) : undefined
}
