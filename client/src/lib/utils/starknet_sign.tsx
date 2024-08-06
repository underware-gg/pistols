import { TYPED_DATA } from '@/games/pistols/generated/constants';
import { cleanObject, isBigint } from '@/lib/utils/types'
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

const DEFAULT_DOMAIN_NAME = TYPED_DATA.NAME;
const DEFAULT_VERSION = TYPED_DATA.VERSION;
const DEFAULT_CHAIN_ID = "UNDERWARE_GG";

export type Messages = { [key: string]: string | BigInt }
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
type SignMessagesResult = {
  typedMessage: TypedData
  typeHash: string
  messageHash: string
  signature: WeierstrassSignatureType,
}
export const signMessages = async (account: AccountInterface, revision: Revision, messages: Messages): Promise<SignMessagesResult> => {
  const typedMessage = createTypedMessage({ revision, messages })
  const typeHash = getTypeHash(typedMessage, 'Message')
  const messageHash = getMessageHash(typedMessage, account.address)
  const signature = await account.signMessage(typedMessage) as WeierstrassSignatureType
  // console.log(`SIG:`, typedMessage, typeHash, messageHash, signature)
  // throw new Error('STOP')
  return { typedMessage, typeHash, messageHash, signature }
}
export const verifyMessages = async (account: AccountInterface, revision: Revision, messages: Messages, signature: WeierstrassSignatureType): Promise<boolean> => {
  const typedMessage = createTypedMessage({ revision, messages })
  return account.verifyMessage(typedMessage, signature)
}

export function getMessageHash(td: TypedData, address: BigNumberish): string {
  return (td && address) ? typedData.getMessageHash(td, address) : undefined
}

export function getTypeHash(td: TypedData, type: string): string {
  return td ? typedData.getTypeHash(td.types, type, !td.domain?.revision ? TypedDataRevision.LEGACY : TypedDataRevision.ACTIVE) : undefined
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
  messages,
  chainId = DEFAULT_CHAIN_ID,
  domainName = DEFAULT_DOMAIN_NAME,
  version = DEFAULT_VERSION,
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
        Message: Object.keys(_messages).map((name) => ({
          name,
          type: isBigint(_messages[name]) ? 'felt' : 'shortstring',
          // type: typeof _messages[name] == 'bigint' ? 'felt' : 'shortstring',
        })),
      },
      message: _messages,
  }
  return result
}
