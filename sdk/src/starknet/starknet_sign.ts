import {
  AccountInterface,
  TypedData,
  Signature,
  ArraySignatureType,
  WeierstrassSignatureType,
  typedData,
  BigNumberish,
  StarknetDomain,
  RpcProvider,
} from 'starknet'
import { bigintToHex, cleanObject, isBigint } from 'src/utils/misc/types'
import { poseidon } from 'src/starknet/starknet'

export type Messages = { [key: string]: string | BigInt }

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
  signatureRaw: Signature,
  signatureHash: bigint,
  signature: bigint[], // [r,s] or [...]
}
export const signMessages = async (account: AccountInterface, starknetDomain: StarknetDomain, messages: Messages): Promise<SignMessagesResult> => {
  const typedMessage = createTypedMessage({ starknetDomain, messages })
  const typeHash = getTypeHash(typedMessage, typedMessage.primaryType)
  const typeSelectorName = getTypeSelectorName(typedMessage, typedMessage.primaryType)
  const messageHash = getMessageHash(typedMessage, account.address)
  // sign
  const signatureRaw = await account.signMessage(typedMessage)
  // convert to array
  let signature: bigint[] =
    Array.isArray(signatureRaw) ? signatureRaw.map(v => BigInt(v)) // [...]
      : splitSignature(signatureRaw) // {r,s}
  // if array has only 2 elements, produce the hash
  const signatureHash = signature.length == 2 ? poseidon(signature) : 0n
  // console.log(`SIG:`, typedMessage, 'type:', typeSelectorName, typeHash, 'message:', messageHash, signature, signatureRaw, 'sigHash:', bigintToHex(signatureHash))
  // throw new Error('STOP')
  return {
    typedMessage,
    typeHash,
    typeSelectorName,
    messageHash,
    signatureRaw,
    signatureHash,
    signature,
  }
}

// ref:
// https://github.com/starknet-io/starknet.js/blob/main/src/utils/typedData.ts
export function getMessageHash(td: TypedData, address: BigNumberish): string {
  return (td && address) ? typedData.getMessageHash(td, address) : undefined
}
export function getTypeHash(td: TypedData, type: string): string {
  return td ? typedData.getTypeHash(td.types, type, '1') : undefined
}
export function getTypeSelectorName(td: TypedData, type: string): string {
  return td ? typedData.encodeType(td.types, type, '1') : undefined
}


//
// Revision 0:
// https://github.com/starknet-io/starknet.js/blob/develop/www/docs/guides/signature.md
//
// Revision 1:
// https://github.com/starknet-io/SNIPs/blob/main/SNIPS%2Fsnip-12.md
//
export interface TypedMessageOptions {
  starknetDomain: StarknetDomain
  messages: Messages
}

export function createTypedMessage({
  starknetDomain,
  messages,
}: TypedMessageOptions): TypedData {
  const _messages = cleanObject(messages)
  if (starknetDomain?.revision !== '1') {
    throw new Error(`createTypedMessage() Unsupported revision: ${starknetDomain?.revision}`)
  }
  // aligned with:
  // https://github.com/cartridge-gg/controller/blob/main/examples/next/src/components/SignMessage.tsx
  const result = {
    types: {
      StarknetDomain: [
        { name: 'name', type: 'shortstring' },
        { name: 'version', type: 'shortstring' },
        { name: 'chainId', type: 'shortstring' },
        { name: 'revision', type: 'shortstring' },
      ],
      Message: Object.keys(_messages).map((name) => ({
        name,
        type: isBigint(_messages[name]) ? 'felt' : 'string',
        // type: typeof _messages[name] == 'bigint' ? 'felt' : 'string',
      })),
    },
    primaryType: 'Message',
    domain: starknetDomain,
    message: Object.keys(_messages).reduce((acc, name) => {
      acc[name] = (isBigint(_messages[name])
        ? bigintToHex(_messages[name] as string)
        : _messages[name])
      return acc
    }, {} as { [key: string]: any }),
  }
  return result
}
