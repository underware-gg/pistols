import { BigNumberish, StarknetDomain } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'
import { feltToString } from 'src/starknet/starknet'
import { ControllerVerifyParams } from './verify'

export type SaltGeneratorResponse = {
  salt?: BigNumberish,
  error?: string,
  message?: string,
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
    const resp = await fetch(`${serverUrl}/api/controller/salt`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const response: SaltGeneratorResponse = await resp.json();
    if (response.salt) {
      result = BigInt(response.salt)
    } else if (response.error) {
      console.warn("apiGenerateControllerSalt() ERROR:", response.error, response.message,
      );
    } else {
      console.error("apiGenerateControllerSalt() Invalid response:", response);
    }
  } catch (error) {
    console.error("apiGenerateControllerSalt() EXCEPTION:", error);
  }

  return result
}
