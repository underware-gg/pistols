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
  let result = false

  let params: ControllerVerifyParams = {
    address: bigintToHex(address),
    chainId,
    messageHash: bigintToHex(messageHash),
    signature: signature.map(s => bigintToHex(s)),
  }

  try {
    const resp = await fetch(`${serverUrl}/api/controller/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const response: VerifyResponse = await resp.json();
    // console.log(`apiVerifyControllerSignature() data:`, response)
    if (response.verified === true || response.verified === false) {
      result = response.verified;
      if (response.error) {
        console.warn("apiVerifyControllerSignature() INVALID:", response.error);
      }
    } else if (response.error) {
      console.error("apiVerifyControllerSignature() ERROR:", response.error);
    } else {
      console.error("apiVerifyControllerSignature() Invalid response:", response);
    }
  } catch (error) {
    console.error("apiVerifyControllerSignature() EXCEPTION:", error);
  }

  return result;
}
