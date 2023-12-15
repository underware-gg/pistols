import { getEvents, setComponentsFromEvents, decodeComponent } from '@dojoengine/utils'
import { Account } from 'starknet'
import { SetupNetworkResult } from './setupNetwork'
import { shortString } from 'starknet'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { execute, call, provider, contractComponents }: SetupNetworkResult,
  // { Duelist, Duel }: ClientComponents,
) {

  const register_duelist = async (signer: Account, name: string): Promise<boolean> => {
    let success = false
    try {
      const args = [shortString.encodeShortString(name)]

      const tx = await execute(signer, 'actions', 'register_duelist', args)
      console.log(`register_duelist tx:`, tx)

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      console.log(`register_duelist receipt:`, success, receipt)
      success = getReceiptStatus(receipt)

      setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`register_duelist(${name}) exception:`, e)
    } finally {
    }
    return success
  }
  return {
    register_duelist,
 }
}

export function getReceiptStatus(receipt: any): boolean {
  if (receipt.execution_status == 'REVERTED') {
    console.error(`Transaction reverted:`, receipt.revert_reason)
    return false
  } else if (receipt.execution_status != 'SUCCEEDED') {
    console.error(`Transaction error [${receipt.execution_status}]:`, receipt)
    return false
  }
  return true
}
