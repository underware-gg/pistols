import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'

export type ControllerVerifyParams = {
  address: string,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
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
    const response = await fetch(`${serverUrl}/api/controller/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const data = await response.json();
    // console.log(`apiVerifyControllerSignature() data:`, data)
    if (data.verified === true || data.verified === false) {
      result = data.verified;
      if (data.error) {
        console.warn("apiVerifyControllerSignature() INVALID:", data.error);
      }
    } else if (data.error) {
      console.error("apiVerifyControllerSignature() ERROR:", data.error);
    } else {
      console.error("apiVerifyControllerSignature() Invalid response:", data);
    }
  } catch (error) {
    console.error("apiVerifyControllerSignature() EXCEPTION:", error);
  }

  return result;
}
