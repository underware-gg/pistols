import {
  getEvents,
  // setComponentsFromEvents,
} from '@dojoengine/utils'
import { getContractByName } from '@dojoengine/core'
import { getComponentValue } from '@dojoengine/recs'
import { Account, BigNumberish, Call, Result, uint256 } from 'starknet'
import { ClientComponents } from '@/lib/dojo/setup/createClientComponents'
import { SetupNetworkResult } from '@/lib/dojo/setup/setup'
import { stringToFelt } from '@/lib/utils/starknet'
import { bigintAdd, bigintToEntity, bigintToHex } from '@/lib/utils/types'
import { emitter } from '@/pistols/three/game'

// FIX while this is not merged
// https://github.com/dojoengine/dojo.js/pull/190
import { setComponentsFromEvents } from '@/lib/dojo/fix/setComponentsFromEvents'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export type DojoCall = {
  contractName: string
  entrypoint: string
  calldata: BigNumberish[]
}

const actions_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'actions',
  entrypoint,
  calldata,
})
const admin_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'admin',
  entrypoint,
  calldata,
})

export function createSystemCalls(
  network: SetupNetworkResult,
  components: ClientComponents,
  manifest: any,
) {
  const { execute, call, contractComponents } = network
  const { Challenge, Wager, TTable } = components

  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190

  const _executeTransaction = async (signer: Account, params: DojoCall | Call[]): Promise<boolean> => {
    let success = false
    try {
      const tx = await execute(signer, params);
      if (!Array.isArray(params)) {
        console.log(`execute ${params?.contractName}::${params.entrypoint}() tx:`, params.calldata, tx)
      } else {
        params.forEach((param, index) => {
          console.log(`execute[${index}] ${param.contractAddress}::${param.entrypoint}() tx:`, param.calldata, tx)
        })
      }

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt);
      (success ? console.log : console.warn)(`execute success:`, success, 'receipt:', receipt, 'params:', params)

      // set from events ahead of torii
      // setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`execute exception:`, params, e)
    } finally {
    }
    return success
  }

  const _executeCall = async (params: DojoCall): Promise<any | null> => {
    let results = null
    try {
      const response: Result = await call(params)
      // result = decodeComponent(contractComponents['Component'], response)
      // results = Array.isArray(response) ? response.map(v => BigInt(v)) : typeof response == 'boolean' ? response : BigInt(response)
      results = response
      // console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${params.contractName}::${params.entrypoint}(${params.calldata.length}) exception:`, e)
    } finally {
    }
    return results
  }

  const register_duelist = async (signer: Account, name: string, profile_pic: number): Promise<boolean> => {
    const args = [stringToFelt(name), profile_pic]
    return await _executeTransaction(signer, actions_call('register_duelist', args))
  }

  const create_challenge = async (signer: Account, challenged: bigint, message: string, table_id: string, wager_value: bigint, expire_seconds: number): Promise<boolean> => {
    // find lords contract
    const table = getComponentValue(TTable, bigintToEntity(stringToFelt(table_id)))
    if (!table) throw new Error(`Table does not exist [${table_id}]`)
    //calculate value
    const fee = await calc_fee(table_id, wager_value)
    const approved_value = bigintAdd(wager_value, fee)
    let calls: Call[] = []
    // approve call
    const actions_contract = getContractByName(manifest, 'actions')
    if (BigInt(table.contract_address) > 0n) {
      calls.push({
        contractAddress: bigintToHex(table.contract_address),
        entrypoint: 'approve',
        calldata: [actions_contract.address, uint256.bnToUint256(approved_value)]
      })
    }
    // game call
    calls.push({
      contractAddress: actions_contract.address,
      entrypoint: 'create_challenge',
      calldata: [challenged, stringToFelt(message), table_id, uint256.bnToUint256(wager_value), expire_seconds]
    })
    return await _executeTransaction(signer, calls)
  }

  const reply_challenge = async (signer: Account, duel_id: bigint, accepted: boolean): Promise<boolean> => {
    const args = [duel_id, accepted]
    if (accepted) {
      // find Wager
      const challenge = getComponentValue(Challenge, bigintToEntity(duel_id))
      const wager = getComponentValue(Wager, bigintToEntity(duel_id))
      const approved_value = wager ? (wager.value + wager.fee) : 0n
      if (approved_value > 0n) {
        // find lords contract
        const table = getComponentValue(TTable, bigintToEntity(challenge.table_id))
        if (!table) throw new Error(`Table does not exist [${challenge.table_id}]`)
        // approve call
        let calls: Call[] = []
        const actions_contract = getContractByName(manifest, 'actions')
        if (BigInt(table.contract_address) > 0n) {
          calls.push({
            contractAddress: bigintToHex(table.contract_address),
            entrypoint: 'approve',
            calldata: [actions_contract.address, uint256.bnToUint256(approved_value)]
          })
        }
        // game call
        calls.push({
          contractAddress: actions_contract.address,
          entrypoint: 'reply_challenge',
          calldata: args,
        })
        return await _executeTransaction(signer, calls)
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

  const calc_fee = async (table_id: string, wager_value: BigNumberish): Promise<bigint | null> => {
    const args = [stringToFelt(table_id), wager_value]
    const results = await _executeCall(actions_call('calc_fee', args))
    return results !== null ? results[0] : null
  }

  type simulate_honour_for_action_result = {
    action_honour: number
    duelist_honour: number
  }
  const simulate_honour_for_action = async (duelist: bigint, action: number): Promise<simulate_honour_for_action_result | null> => {
    const args = [duelist, action]
    const results = await _executeCall(actions_call('simulate_honour_for_action', args))
    if (!results) return null
    // convert to Numbers
    const [action_honour, duelist_honour] = Object.values(results).map((v: bigint) => Number(v > 255n ? -1 : v))
    return {
      action_honour,
      duelist_honour,
    }
  }

  const simulate_chances = async (duelist: bigint, duel_id: bigint, round_number: number, action): Promise<any | null> => {
    const args = [duelist, duel_id, round_number, action]
    const results = await _executeCall(actions_call('simulate_chances', args))
    // console.log(`simulate_chances`, results)
    if (!results) return null
    // convert to Numbers
    return Object.keys(results).reduce((acc, k) => {
      acc[k] = Number(results[k])
      return acc
    }, {})
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
    simulate_chances,
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
