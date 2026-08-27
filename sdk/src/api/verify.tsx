import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'

export type ControllerVerifyParams = {
  address: string,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
}

export type VerifyResponse = {
  verified?: boolean,
  error?: string,
}

export const apiVerifyControllerSignature = async (
  serverUrl: string,
  address: BigNumberish,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
): Promise<boolean> => {
  const params: ControllerVerifyParams = {
    address: bigintToHex(address),
    chainId,
    messageHash: bigintToHex(messageHash),
    signature: signature.map(s => bigintToHex(s)),
  }

  const url = `${serverUrl}/api/controller/verify`;
  console.log(`apiVerifyControllerSignature() URL:`, url, params)
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    throw new Error(`apiVerifyControllerSignature() ${resp.status} from ${url}`)
  }
  const response: VerifyResponse = await resp.json();
  console.log(`apiVerifyControllerSignature() data:`, response)
  if (response.verified === true || response.verified === false) return response.verified
  if (response.error) throw new Error(`apiVerifyControllerSignature() ${response.error}`)
  throw new Error(`apiVerifyControllerSignature() invalid response from ${url}`)
}
