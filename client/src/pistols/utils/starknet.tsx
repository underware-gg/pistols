import {
  ec,
  shortString,
  Account,
  BigNumberish,
  TypedData,
  WeierstrassSignatureType,
  AccountInterface,
  InvocationsDetails,
  InvokeFunctionResponse,
} from 'starknet'

export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const stringToFelt = (v: string): string => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (hex: string): string => (BigInt(hex) > 0n ? shortString.decodeShortString(hex) : '')
export const pedersen = (a: BigNumberish, b: BigNumberish): bigint => (BigInt(ec.starkCurve.pedersen(BigInt(a), BigInt(b))))
export const poseidon = (values: BigNumberish[]): bigint => (BigInt(ec.starkCurve.poseidonHashMany(values.map(v => BigInt(v)))))

// https://github.com/starknet-io/starknet.js/blob/develop/www/docs/guides/signature.md
export const signMessages = async (account: Account, messages: BigNumberish[]): Promise<WeierstrassSignatureType> => {
  const typedMessage = createTypedMessage(messages)
  return account.signMessage(typedMessage) as Promise<WeierstrassSignatureType>
}
export const verifyMessages = async (account: Account, messages: BigNumberish[], signature: WeierstrassSignatureType): Promise<boolean> => {
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



export async function execute(
  account: Account | AccountInterface,
  contractAddress: string,
  call: string,
  calldata: BigNumberish[],
  transactionDetails?: InvocationsDetails | undefined
): Promise<InvokeFunctionResponse> {
  try {
    const nonce = await account?.getNonce();
    return await account?.execute(
      [
        {
          contractAddress,
          entrypoint: call,
          calldata: calldata,
        },
      ],
      undefined,
      {
        maxFee: 0, // TODO: Update this value as needed.
        ...transactionDetails,
        nonce,
      }
    );
  } catch (error) {
    this.logger.error("Error occured: ", error);
    throw error;
  }
}
