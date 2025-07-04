import { BigNumberish } from 'starknet'
import { bigintToDecimal, bigintToHex } from 'src/utils/misc/types'
import { useMemo } from 'react'

// {
//   "reveal_a": {
//     "revealed": true,
//     "duelistId": 29,
//     "salt": "0x5eb8d1035c08381cee83cde0aae8fda54f106f918c1e7f842b770193442beb6",
//     "moves": [1, 2, 3, 4]
//   },
//   "reveal_b": {
//     "revealed": true,
//     "duelistId": 2989,
//     "salt": "0x71d6710ac0de551f70950a6605b9d98a17e9df4cca9927fb24d068747ca4a43",
//     "moves": [3, 2, 5, 2]
//   }
// }
export type AutoRevealResponse = {
  reveal_a?: any,
  reveal_b?: any,
  error?: string,
}

export const apiAutoReveal = async (
  serverUrl: string,
  duelId: BigNumberish,
  chainId: string,
): Promise<boolean> => {
  let result = false
  const url = `${serverUrl}/api/pistols/reveal/${bigintToDecimal(duelId)}?` + new URLSearchParams({ chain_id : chainId });
  try {
    console.log(`apiAutoReveal() URL:`, url)
    const resp = await fetch(url);
    const response: AutoRevealResponse = await resp.json();
    console.log(`apiAutoReveal() data:`, response)
    if (response.reveal_a || response.reveal_b) {
      result = true;
    } else if (response.error) {
      console.error("apiAutoReveal() ERROR:", response.error);
    } else {
      console.error("apiAutoReveal() Invalid response:", response);
    }
  } catch (error) {
    console.error("apiAutoReveal() EXCEPTION:", error);
  }

  return result;
}
