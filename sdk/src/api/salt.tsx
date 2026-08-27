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
  const params: ControllerVerifyParams = {
    address: bigintToHex(address),
    chainId: (typeof starknetDomain.chainId == 'number' ? feltToString(starknetDomain.chainId) : starknetDomain.chainId),
    messageHash: bigintToHex(messageHash),
    signature: signature.map(s => bigintToHex(s)),
  }

  const url = `${serverUrl}/api/controller/salt`;
  console.log(`apiGenerateControllerSalt() URL:`, url, params)
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    throw new Error(`apiGenerateControllerSalt() ${resp.status} from ${url}`)
  }
  const response: SaltGeneratorResponse = await resp.json();
  console.log(`apiGenerateControllerSalt() data:`, response)
  if (response.salt) return BigInt(response.salt)
  if (response.error) {
    throw new Error(`apiGenerateControllerSalt() ${response.error}${response.message ? `: ${response.message}` : ''}`)
  }
  throw new Error(`apiGenerateControllerSalt() invalid response from ${url}`)
}
