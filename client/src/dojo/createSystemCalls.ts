import { getEvents, setComponentsFromEvents, decodeComponent } from '@dojoengine/utils'
import { SetupNetworkResult } from './setupNetwork'
import { stringToFelt } from '@/pistols/utils/utils';
import { Account } from 'starknet'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { execute, call, provider, contractComponents }: SetupNetworkResult,
  // { Duelist, Duel }: ClientComponents,
) {

  const _executeTransaction = async (signer: Account, system: string, args: any[]): Promise<boolean> => {
    let success = false
    try {
      // console.log(`${system} args:`, args)
      const tx = await execute(signer, 'actions', system, args)
      console.log(`execute ${system}(${args.length}) tx:`, tx)

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt)
      console.log(`execute ${system}(${args.length}) success:`, success, 'receipt:', receipt)

      setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`execute ${system}(${args.length}) exception:`, e)
    } finally {
    }
    return success
  }

  const _executeCall = async (system: string, args: any[]): Promise<bigint | null> => {
    let result = null
    try {
      const eventData = await call('actions', system, args)
      // console.log(eventData)
      // result = decodeComponent(contractComponents['Component'], eventData.result)
      result = BigInt(eventData.result[0])
      console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${system}(${args.length}) exception:`, e)
    } finally {
    }
    return result
  }

  const register_duelist = async (signer: Account, name: string, profile_pic: number): Promise<boolean> => {
    const args = [stringToFelt(name), profile_pic]
    return await _executeTransaction(signer, 'register_duelist', args)
  }

  const create_challenge = async (signer: Account, challenged: bigint, pass_code: string, message: string, expire_seconds: number): Promise<boolean> => {
    const args = [challenged, stringToFelt(pass_code), stringToFelt(message), expire_seconds]
    return await _executeTransaction(signer, 'create_challenge', args)
  }

  const reply_challenge = async (signer: Account, duel_id: bigint, accepted: boolean): Promise<boolean> => {
    const args = [duel_id, accepted]
    return await _executeTransaction(signer, 'reply_challenge', args)
  }

  const get_timestamp = async (): Promise<number | null> => {
    const args = []
    const result = await _executeCall('get_timestamp', args)
    return result ? Number(result) : null
  }

  return {
    register_duelist,
    create_challenge,
    reply_challenge,
    // read-only calls
    get_timestamp,
  }
}

function getReceiptStatus(receipt: any): boolean {
  if (receipt.execution_status == 'REVERTED') {
    console.error(`Transaction reverted:`, receipt.revert_reason)
    return false
  } else if (receipt.execution_status != 'SUCCEEDED') {
    console.error(`Transaction error [${receipt.execution_status}]:`, receipt)
    return false
  }
  return true
}
