import { cleanObject } from '@/lib/utils/types'
import {
  AccountInterface,
  TypedData,
  Signature,
  ArraySignatureType,
  WeierstrassSignatureType,
  typedData,
  BigNumberish,
  TypedDataRevision,
} from 'starknet'

const DEFAULT_DOMAIN_NAME = "Underware";
const DEFAULT_CHAIN_ID = "UNDERWARE_GG";
const DEFAULT_VERSION = "0.1.0";

export type Messages = { [key: string]: string }
export type Revision = 0 | 1

export const splitSignature = (signature: Signature): bigint[] => {
  if (Array.isArray(signature)) {
    const sig = signature as ArraySignatureType
    if (signature.length == 2) {
      return [BigInt(sig[0]), BigInt(sig[1])]
    }
    if (signature.length == 3) { // Braavos
      return [BigInt(sig[1]), BigInt(sig[2])]
    }
    return []
  }
  if (signature?.r && signature?.s) {
    const sig = signature as WeierstrassSignatureType
    return [sig.r, sig.s]
  }
  return []
}

export const signMessages = async (account: AccountInterface, revision: Revision, messages: Messages): Promise<WeierstrassSignatureType> => {
  const typedMessage = createTypedMessage({ revision, messages })
  return account.signMessage(typedMessage) as Promise<WeierstrassSignatureType>
}
export const verifyMessages = async (account: AccountInterface, revision: Revision, messages: Messages, signature: WeierstrassSignatureType): Promise<boolean> => {
  const typedMessage = createTypedMessage({ revision, messages })
  return account.verifyMessage(typedMessage, signature)
}


//
// Revision 0:
// https://github.com/starknet-io/starknet.js/blob/develop/www/docs/guides/signature.md
//
// Revision 1:
// https://github.com/starknet-io/SNIPs/blob/main/SNIPS%2Fsnip-12.md
//
export interface TypedMessageOptions {
  revision: Revision
  domainName?: string
  chainId?: string
  version?: string
  messages: Messages
}

export function createTypedMessage({
  revision,
  domainName = DEFAULT_DOMAIN_NAME,
  chainId = DEFAULT_CHAIN_ID,
  version = DEFAULT_VERSION,
  messages,
}: TypedMessageOptions): TypedData {
  const _messages = cleanObject(messages)
  const result = revision == 0 ? {
    primaryType: "Message",
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
      Message: Object.keys(_messages).map((name) => ({ name, type: "felt" })),
    },
    message: _messages,
  } : {
      primaryType: "Message",
      domain: {
        revision: revision.toString(),
        name: domainName,
        chainId,
        version,
      },
      types: {
        StarknetDomain: [
          { name: "revision", type: "shortstring" },
          { name: "name", type: "shortstring" },
          { name: "chainId", type: "shortstring" },
          { name: "version", type: "shortstring" },
        ],
        Message: Object.keys(_messages).map((name) => ({ name, type: "string" })),
      },
      message: _messages,
  }
  return result
}

export function getMessageHash(messages: TypedData, address: BigNumberish): string {
  return (messages && address) ? typedData.getMessageHash(messages, address) : undefined
}

export function getTypeHash(messages: TypedData): string {
  return messages ? typedData.getTypeHash(messages.types, 'felt', !messages.domain?.revision ? TypedDataRevision.LEGACY : TypedDataRevision.ACTIVE) : undefined
}
