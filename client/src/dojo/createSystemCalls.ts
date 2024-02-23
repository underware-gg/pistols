import { getEvents, setComponentsFromEvents, decodeComponent } from '@dojoengine/utils'
import { SetupNetworkResult } from './setupNetwork'
import { stringToFelt } from '@/pistols/utils/starknet'
import { Account, BigNumberish } from 'starknet'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { execute, call, contractComponents }: SetupNetworkResult,
  // { Duelist, Duel }: ClientComponents,
) {

  const _executeTransaction = async (signer: Account, system: string, args: any[]): Promise<boolean> => {
    let success = false
    try {
      // console.log(`${system} args:`, args)
      const tx = await execute(signer, 'actions', system, args)
      console.log(`execute ${system}() tx:`, args, tx)

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt);
      (success ? console.log : console.warn)(`execute ${system}(${args.length}) success:`, success, 'receipt:', receipt)

      setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`execute ${system}(${args.length}) exception:`, e)
    } finally {
    }
    return success
  }

  const _executeCall = async (system: string, args: any[]): Promise<any | null> => {
    let results = null
    try {
      const eventData = await call('actions', system, args)
      // console.log(eventData)
      // result = decodeComponent(contractComponents['Component'], eventData.result)
      results = eventData.result.map(v => BigInt(v))
      // console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${system}(${args.length}) exception:`, e)
    } finally {
    }
    return results
  }

  const register_duelist = async (signer: Account, name: string, profile_pic: number): Promise<boolean> => {
    const args = [stringToFelt(name), profile_pic]
    return await _executeTransaction(signer, 'register_duelist', args)
  }

  const create_challenge = async (signer: Account, challenged: bigint, message: string, expire_seconds: number): Promise<boolean> => {
    const args = [challenged, stringToFelt(message), expire_seconds]
    return await _executeTransaction(signer, 'create_challenge', args)
  }

  const reply_challenge = async (signer: Account, duel_id: bigint, accepted: boolean): Promise<boolean> => {
    const args = [duel_id, accepted]
    return await _executeTransaction(signer, 'reply_challenge', args)
  }

  const commit_action = async (signer: Account, duel_id: bigint, round_number: number, hash: bigint): Promise<boolean> => {
    const args = [duel_id, round_number, hash]
    return await _executeTransaction(signer, 'commit_action', args)
  }

  const reveal_action = async (signer: Account, duel_id: bigint, round_number: number, salt: bigint, action1: number, action2: number): Promise<boolean> => {
    const args = [duel_id, round_number, salt, action1, action2]
    return await _executeTransaction(signer, 'reveal_action', args)
  }

  // read-only calls

  const get_pact = async (duelist_a: bigint, duelist_b: bigint): Promise<bigint | null> => {
    const args = [duelist_a, duelist_b]
    const results = await _executeCall('get_pact', args)
    return results !== null ? results[0] : null
  }

  const has_pact = async (duelist_a: bigint, duelist_b: bigint): Promise<boolean | null> => {
    const args = [duelist_a, duelist_b]
    const results = await _executeCall('has_pact', args)
    return results !== null ? Boolean(results[0]) : null
  }

  const calc_hit_bonus = async (duelist: bigint): Promise<number | null> => {
    const args = [duelist]
    const results = await _executeCall('calc_hit_bonus', args)
    return results !== null ? Number(results[0]) : null
  }

  const calc_hit_penalty = async (health: number): Promise<number | null> => {
    const args = [health]
    const results = await _executeCall('calc_hit_penalty', args)
    return results !== null ? Number(results[0]) : null
  }

  const calc_hit_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall('calc_hit_chances', args)
    return results !== null ? Number(results[0]) : null
  }

  const calc_crit_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall('calc_crit_chances', args)
    return results !== null ? Number(results[0]) : null
  }

  const calc_glance_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall('calc_glance_chances', args)
    return results !== null ? Number(results[0]) : null
  }

  const calc_honour_for_action = async (duelist: bigint, action: number): Promise<number | null> => {
    const args = [duelist, action]
    const results = await _executeCall('calc_honour_for_action', args)
    return results !== null ? Number(results[0]) : null
  }

  const get_valid_packed_actions = async (round_number: number): Promise<number[] | null> => {
    const args = [round_number]
    const results = await _executeCall('get_valid_packed_actions', args)
    return results !== null ? results.map(v => Number(v)) : null
  }
  // const pack_action_slots = async (slot1: number, slot2: number): Promise<number | null> => {
  //   const args = [slot1, slot2]
  //   const results = await _executeCall('pack_action_slots', args)
  //   return results !== null ? Number(results[0]) : null
  // }
  // const unpack_action_slots = async (packed: number): Promise<number[] | null> => {
  //   const args = [packed]
  //   const results = await _executeCall('unpack_action_slots', args)
  //   return results !== null ? results.map(v => Number(v)) : null
  // }

  return {
    register_duelist,
    create_challenge,
    reply_challenge,
    commit_action,
    reveal_action,
    // read-only calls
    get_pact,
    has_pact,
    calc_hit_bonus,
    calc_hit_penalty,
    calc_hit_chances,
    calc_crit_chances,
    calc_glance_chances,
    calc_honour_for_action,
    get_valid_packed_actions,
    // pack_action_slots,
    // unpack_action_slots,
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
