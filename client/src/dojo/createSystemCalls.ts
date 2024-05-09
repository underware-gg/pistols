import { getEvents, setComponentsFromEvents, decodeComponent } from '@dojoengine/utils'
import { SetupNetworkResult } from '../lib/dojo/setup/setupNetwork'
import { splitU256, stringToFelt } from '@/lib/utils/starknet'
import { Account, BigNumberish, Call, CallContractResponse, uint256 } from 'starknet'
import { emitter } from '@/pistols/three/game'
import { getContractByName } from '@dojoengine/core'
import { bigintToEntity, bigintToHex } from '@/lib/utils/types'
import { getComponentValue } from '@dojoengine/recs'
import { ClientComponents } from '../lib/dojo/setup/createClientComponents'


export type SystemCalls = ReturnType<typeof createSystemCalls>;

export type DojoCall = {
  contractName: string
  functionName: string
  callData: BigNumberish[]
}

const actions_call = (functionName: string, callData: any[]) => ({
  contractName: 'actions',
  functionName,
  callData,
})
const admin_call = (functionName: string, callData: any[]) => ({
  contractName: 'admin',
  functionName,
  callData,
})

export function createSystemCalls(
  network: SetupNetworkResult,
  components: ClientComponents,
  manifest: any,
) {
  const { execute, executeMulti, call, contractComponents } = network
  const { Wager, Coin } = components

  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190

  const _executeTransaction = async (signer: Account, params: DojoCall | Call[]): Promise<boolean> => {
    let success = false
    try {
      let tx = null
      if (!Array.isArray(params)) {
        tx = await execute(signer, params.contractName, params.functionName, params.callData);
        console.log(`execute ${params.contractName}::${params.functionName}() tx:`, params.callData, tx)
      } else {
        tx = await executeMulti(signer, params)
        console.log(`executeMulti:`, params, ` tx:`, tx)
      }

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt);
      (success ? console.log : console.warn)(`execute success:`, success, 'receipt:', receipt, 'params:', params)

      setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`execute exception:`, params, e)
    } finally {
    }
    return success
  }

  const _executeCall = async (params: DojoCall): Promise<any | null> => {
    let results = null
    try {
      const response: CallContractResponse = await call(params.contractName, params.functionName, params.callData)
      // console.log(response)
      // result = decodeComponent(contractComponents['Component'], response)
      results = response.result.map(v => BigInt(v))
      // console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${params.contractName}::${params.functionName}(${params.callData.length}) exception:`, e)
    } finally {
    }
    return results
  }

  const register_duelist = async (signer: Account, name: string, profile_pic: number): Promise<boolean> => {
    const args = [stringToFelt(name), profile_pic]
    return await _executeTransaction(signer, actions_call('register_duelist', args))
  }

  const create_challenge = async (signer: Account, challenged: bigint, message: string, wager_coin: number, wager_value: bigint, expire_seconds: number): Promise<boolean> => {
    // find lords contract
    const coin = getComponentValue(Coin, bigintToEntity(wager_coin))
    //calculate value
    const fee = await calc_fee(wager_coin, wager_value)
    const approved_value = (wager_value + fee)
    // approve call
    const actions_contract = getContractByName(manifest, 'actions')
    const approve_call: Call = {
      contractAddress: bigintToHex(coin.contract_address),
      entrypoint: 'approve',
      calldata: [actions_contract.address, uint256.bnToUint256(approved_value)]
    }
    // game call
    const create_challenge_call = {
      contractAddress: actions_contract.address,
      entrypoint: 'create_challenge',
      calldata: [challenged, stringToFelt(message), wager_coin, uint256.bnToUint256(wager_value), expire_seconds]
    }
    return await _executeTransaction(signer, [approve_call, create_challenge_call])
  }

  const reply_challenge = async (signer: Account, duel_id: bigint, accepted: boolean): Promise<boolean> => {
    const args = [duel_id, accepted]
    if (accepted) {
      // find Wager
      const wager = getComponentValue(Wager, bigintToEntity(duel_id))
      const approved_value = (wager.value + wager.fee)
      if (approved_value > 0n) {
        // find lords contract
        const coin = getComponentValue(Coin, bigintToEntity(wager.coin))
        // approve call
        const actions_contract = getContractByName(manifest, 'actions')
        const approve_call: Call = {
          contractAddress: bigintToHex(coin.contract_address),
          entrypoint: 'approve',
          calldata: [actions_contract.address, uint256.bnToUint256(approved_value)]
        }
        // game call
        const reply_challenge_call = {
          contractAddress: actions_contract.address,
          entrypoint: 'reply_challenge',
          calldata: args,
        }
        return await _executeTransaction(signer, [approve_call, reply_challenge_call])
      }
    }
    // no need to approve
    return await _executeTransaction(signer, actions_call('reply_challenge', args))
  }

  const commit_action = async (signer: Account, duel_id: bigint, round_number: number, hash: bigint): Promise<boolean> => {
    const args = [duel_id, round_number, hash]
    return await _executeTransaction(signer, actions_call('commit_action', args))
  }

  const reveal_action = async (signer: Account, duel_id: bigint, round_number: number, salt: bigint, action1: number, action2: number): Promise<boolean> => {
    const args = [duel_id, round_number, salt, action1, action2]
    return await _executeTransaction(signer, actions_call('reveal_action', args))
  }

  // read-only calls

  const get_pact = async (duelist_a: bigint, duelist_b: bigint): Promise<bigint | null> => {
    const args = [duelist_a, duelist_b]
    const results = await _executeCall(actions_call('get_pact', args))
    return results !== null ? results[0] : null
  }

  const has_pact = async (duelist_a: bigint, duelist_b: bigint): Promise<boolean | null> => {
    const args = [duelist_a, duelist_b]
    const results = await _executeCall(actions_call('has_pact', args))
    return results !== null ? Boolean(results[0]) : null
  }

  const calc_fee = async (wager_coin: number, wager_value: BigNumberish): Promise<bigint | null> => {
    const wei = splitU256(wager_value)
    const args = [wager_coin, wei.low, wei.high]
    const results = await _executeCall(actions_call('calc_fee', args))
    return results !== null ? results[0] : null
  }

  const calc_hit_bonus = async (duelist: bigint): Promise<number | null> => {
    const args = [duelist]
    const results = await _executeCall(actions_call('calc_hit_bonus', args))
    return results !== null ? Number(results[0]) : null
  }

  const calc_hit_penalty = async (health: number): Promise<number | null> => {
    const args = [health]
    const results = await _executeCall(actions_call('calc_hit_penalty', args))
    return results !== null ? Number(results[0]) : null
  }

  const calc_hit_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall(actions_call('calc_hit_chances', args))
    return results !== null ? Number(results[0]) : null
  }

  const calc_crit_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall(actions_call('calc_crit_chances', args))
    return results !== null ? Number(results[0]) : null
  }

  const calc_critical_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<number | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall(actions_call('calc_critical_chances', args))
    return results !== null ? Number(results[0]) : null
  }

  const simulate_honour_for_action = async (duelist: bigint, action: number): Promise<number | null> => {
    const args = [duelist, action]
    const results = await _executeCall(actions_call('simulate_honour_for_action', args))
    return (results !== null && results[0] >= 0) ? Number(results[0]) : null
  }

  const get_valid_packed_actions = async (round_number: number): Promise<number[] | null> => {
    const args = [round_number]
    const results = await _executeCall(actions_call('get_valid_packed_actions', args))
    return results !== null ? results.map(v => Number(v)) : null
  }
  // const pack_action_slots = async (slot1: number, slot2: number): Promise<number | null> => {
  //   const args = [slot1, slot2]
  //   const results = await _executeCall(actions_call('pack_action_slots', args))
  //   return results !== null ? Number(results[0]) : null
  // }
  // const unpack_action_slots = async (packed: number): Promise<number[] | null> => {
  //   const args = [packed]
  //   const results = await _executeCall(actions_call('unpack_action_slots', args))
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
    calc_fee,
    calc_hit_bonus,
    calc_hit_penalty,
    calc_hit_chances,
    calc_crit_chances,
    calc_critical_chances,
    simulate_honour_for_action,
    get_valid_packed_actions,
    // pack_action_slots,
    // unpack_action_slots,
  }
}

function getReceiptStatus(receipt: any): boolean {
  if (receipt.execution_status != 'SUCCEEDED') {
    if (receipt.execution_status == 'REVERTED') {
      console.error(`Transaction reverted:`, receipt.revert_reason)
    } else {
      console.error(`Transaction error [${receipt.execution_status}]:`, receipt)
    }
    emitter.emit('transaction_error', {
      status: receipt.execution_status,
      reason: receipt.revert_reason,
    })
    return false
  }
  return true
}
