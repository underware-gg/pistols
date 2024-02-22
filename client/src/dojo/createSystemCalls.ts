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
      console.log(`execute ${system}(${args.length}) tx:`, tx)

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
    const result = await _executeCall('get_pact', args)
    return result !== null ? BigInt(result) : null
  }

  const has_pact = async (duelist_a: bigint, duelist_b: bigint): Promise<boolean | null> => {
    const args = [duelist_a, duelist_b]
    const result = await _executeCall('has_pact', args)
    return result !== null ? Boolean(result) : null
  }

  const calc_hit_bonus = async (duelist: bigint): Promise<number | null> => {
    const args = [duelist]
    const result = await _executeCall('calc_hit_bonus', args)
    return result !== null ? Number(result) : null
  }

  const calc_hit_penalty = async (health: number): Promise<number | null> => {
    const args = [health]
    const result = await _executeCall('calc_hit_penalty', args)
    return result !== null ? Number(result) : null
  }

  const get_duelist_hit_chance = async (duelist: bigint, action: number, health: number): Promise<number | null> => {
    const args = [duelist, action, health]
    const result = await _executeCall('get_duelist_hit_chance', args)
    return result !== null ? Number(result) : null
  }

  const get_duelist_crit_chance = async (duelist: bigint, action: number, health: number): Promise<number | null> => {
    const args = [duelist, action, health]
    const result = await _executeCall('get_duelist_crit_chance', args)
    return result !== null ? Number(result) : null
  }

  const get_duelist_action_honour = async (duelist: bigint, action: number): Promise<number | null> => {
    const args = [duelist, action]
    const result = await _executeCall('get_duelist_action_honour', args)
    return result !== null ? Number(result) : null
  }

  const get_valid_packed_actions = async (round_number: number): Promise<number[] | null> => {
    const args = [round_number]
    const result = await _executeCall('get_valid_packed_actions', args)
    return result !== null ? result.map((v: BigNumberish) => Number(v)) : null
  }
  const pack_action_slots = async (slot1: number, slot2: number): Promise<number | null> => {
    const args = [slot1, slot2]
    const result = await _executeCall('pack_action_slots', args)
    return result !== null ? Number(result) : null
  }
  const unpack_action_slots = async (packed: number): Promise<number[] | null> => {
    const args = [packed]
    const result = await _executeCall('unpack_action_slots', args)
    return result !== null ? result.map((v: BigNumberish) => Number(v)) : null
  }

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
    get_duelist_hit_chance,
    get_duelist_crit_chance,
    get_duelist_action_honour,
    get_valid_packed_actions,
    pack_action_slots,
    unpack_action_slots,
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
