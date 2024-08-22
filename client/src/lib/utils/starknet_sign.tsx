import { TYPED_DATA } from '@/games/pistols/generated/constants'
import { bigintToHex, cleanObject, isBigint } from '@/lib/utils/types'
import { poseidon } from '@/lib/utils/starknet'
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
  typeSelectorName: string
  messageHash: string
  // signature: WeierstrassSignatureType, //{r,s}
  signature: Signature,
  signatureArray: bigint[], // [r,s] or [...]
  signatureHash: bigint,
}
export const signMessages = async (account: AccountInterface, chainId: string, revision: Revision, messages: Messages): Promise<SignMessagesResult> => {
  const typedMessage = createTypedMessage({ chainId, revision, messages })
  const typeHash = getTypeHash(typedMessage, typedMessage.primaryType)
  const typeSelectorName = getTypeSelectorName(typedMessage, typedMessage.primaryType)
  const messageHash = getMessageHash(typedMessage, account.address)
  const signature = await account.signMessage(typedMessage)
  //@ts-ignore
  let signatureArray: bigint[] =
    Array.isArray(signature) ? signature.map(v => BigInt(v)) // [...]
      : splitSignature(signature) // {r,s}
  const signatureHash = signatureArray.length >= 2 ? poseidon(signatureArray.slice(-2)) : 0n
  console.log(`SIG:`, typedMessage, 'type:', typeSelectorName, typeHash, 'message:', messageHash, signature, signatureArray, 'sigHash:', bigintToHex(signatureHash))
  // throw new Error('STOP')
  return {
    typedMessage,
    typeHash,
    typeSelectorName,
    messageHash,
    signature,
    signatureArray,
    signatureHash,
  }
}
export const verifyMessages = async (account: AccountInterface, chainId: string, revision: Revision, messages: Messages, signature: WeierstrassSignatureType): Promise<boolean> => {
  const typedMessage = createTypedMessage({ chainId, revision, messages })
  return account.verifyMessage(typedMessage, signature)
}

// ref:
// https://github.com/starknet-io/starknet.js/blob/main/src/utils/typedData.ts
export function getMessageHash(td: TypedData, address: BigNumberish): string {
  return (td && address) ? typedData.getMessageHash(td, address) : undefined
}
export function getTypeHash(td: TypedData, type: string): string {
  return td ? typedData.getTypeHash(td.types, type, !td.domain?.revision ? TypedDataRevision.LEGACY : TypedDataRevision.ACTIVE) : undefined
}
export function getTypeSelectorName(td: TypedData, type: string): string {
  return td ? typedData.encodeType(td.types, type, !td.domain?.revision ? TypedDataRevision.LEGACY : TypedDataRevision.ACTIVE) : undefined
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
  chainId: string
  domainName?: string
  version?: string
  messages: Messages
}

export function createTypedMessage({
  revision,
  chainId,
  domainName = DEFAULT_DOMAIN_NAME,
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
      Message: Object.keys(_messages).map((name) => ({
        name,
        type: isBigint(_messages[name]) ? 'felt' : 'shortstring',
        // type: typeof _messages[name] == 'bigint' ? 'felt' : 'shortstring',
      })),
    },
    message: Object.keys(_messages).reduce((acc, name) => {
      acc[name] = (isBigint(_messages[name]) ? bigintToHex(_messages[name]) : _messages[name])
      return acc
    }, {} as { [key: string]: any }),
  }
  return result
}
