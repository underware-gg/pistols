import { BigNumberish, StarknetDomain } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'
import { feltToString } from 'src/exports/starknet'
import { ControllerVerifyParams } from './verify'

export type SaltGeneratorResponse = {
  salt?: BigNumberish,
  error?: string,
}

export const apiGenerateControllerSalt = async (
  serverUrl: string,
  address: BigNumberish,
  starknetDomain: StarknetDomain,
  messageHash: BigNumberish,
  signature: BigNumberish[],
): Promise<bigint> => {
  let result = 0n
  
  let params: ControllerVerifyParams = {
    address: bigintToHex(address),
    chainId: (typeof starknetDomain.chainId == 'number' ? feltToString(starknetDomain.chainId) : starknetDomain.chainId),
    messageHash: bigintToHex(messageHash),
    signature: signature.map(s => bigintToHex(s)),
  }

  try {
    const response = await fetch(`${serverUrl}/api/controller/salt`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const data = await response.json();
    if (data.salt) {
      result = BigInt(data.salt)
    } else if (data.error) {
      console.warn("apiGenerateControllerSalt() ERROR:", data.error,
        // data.message,
      );
    } else {
      console.error("apiGenerateControllerSalt() Invalid response:", data);
    }
  } catch (error) {
    console.error("apiGenerateControllerSalt() EXCEPTION:", error);
  }

  return result
}
