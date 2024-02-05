import {
  ec,
  shortString,
  Account,
  BigNumberish,
  TypedData, typedData,
  Signature,
} from 'starknet'

export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const stringToFelt = (v: string): string => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (hex: string): string => (BigInt(hex) > 0n ? shortString.decodeShortString(hex) : '')
export const pedersen = (a: BigNumberish, b: BigNumberish): bigint => (BigInt(ec.starkCurve.pedersen(BigInt(a), BigInt(b))))
export const poseidon = (values: BigNumberish[]): bigint => (BigInt(ec.starkCurve.poseidonHashMany(values.map(v => BigInt(v)))))

// https://github.com/starknet-io/starknet.js/blob/develop/www/docs/guides/signature.md
export const signMessages = async (account: Account, messages: BigNumberish[]): Promise<Signature> => {
  const typedMessage = createTypedMessage(messages)
  return account.signMessage(typedMessage)
}
export const verifyMessages = async (account: Account, messages: BigNumberish[], signature: Signature): Promise<boolean> => {
  const typedMessage = createTypedMessage(messages)
  return account.verifyMessage(typedMessage, signature)
}

export function createTypedMessage(messages: BigNumberish[]): TypedData {
  const message = poseidon(messages).toString()
  return {
    domain: {
      name: "Pistols",
      chainId: "funDAOmental",
      version: "0.1.0",
    },
    types: {
      StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "chainId", type: "felt" },
        { name: "version", type: "felt" },
      ],
      Message: [{ name: "message", type: "felt" }],
    },
    primaryType: "Message",
    message: {
      message,
    },
  }
}
