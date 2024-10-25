import { DojoProvider, getContractByName } from '@dojoengine/core'
import { getComponentValue } from '@dojoengine/recs'
import { AccountInterface, BigNumberish, Call, Result } from 'starknet'
import { stringToFelt, bigintToU256 } from '@/lib/utils/starknet'
import { DojoManifest } from '@/lib/dojo/Dojo'
import { ClientComponents } from '@/lib/dojo/setup/setup'
import { bigintAdd, bigintToEntity, bigintToHex, isPositiveBigint } from '@/lib/utils/types'
import { emitter } from '@/pistols/three/game'
import {
  Premise, getPremiseValue,
  Archetype, getArchetypeValue,
  ProfilePicType, getProfilePicTypeValue,
} from '@/games/pistols/generated/constants'
import { convert_duel_progress } from './duel_progress'

// FIX while this is not merged
// https://github.com/dojoengine/dojo.js/pull/190
// import { setComponentsFromEvents } from '@/lib/dojo/fix/setComponentsFromEvents'

export const NAMESPACE = 'pistols'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export type DojoCall = {
  contractName: string
  entrypoint: string
  calldata: BigNumberish[]
}

const game_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'game',
  entrypoint,
  calldata,
})
const admin_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'admin',
  entrypoint,
  calldata,
})
const duel_token_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'duel_token',
  entrypoint,
  calldata,
})
const duelist_token_call = (entrypoint: string, calldata: any[]) => ({
  contractName: 'duelist_token',
  entrypoint,
  calldata,
})

export function createSystemCalls(
  components: ClientComponents,
  manifest: DojoManifest,
  provider: DojoProvider,
) {
  const { TableConfig, TableAdmittance, Config } = components

  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190

  const _executeTransaction = async (signer: AccountInterface, params: DojoCall | Call[]): Promise<boolean> => {
    let success = false
    try {
      console.log(`execute...`, params)
      const tx = await provider.execute(signer, params, NAMESPACE);
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

  const _executeCall = async <T extends Result>(params: DojoCall): Promise<T | null> => {
    let results: Result = undefined
    try {
      results = await provider.call(NAMESPACE, params)
      // result = decodeComponent(contractComponents['Component'], response)
      // results = Array.isArray(response) ? response.map(v => BigInt(v)) : typeof response == 'boolean' ? response : BigInt(response)
      // console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${params.contractName}::${params.entrypoint}(${params.calldata.length}) exception:`, e)
    } finally {
    }
    return results as T
  }


  //
  // Game
  //

  const commit_moves = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish): Promise<boolean> => {
    const args = [duelist_id, duel_id, hash]
    return await _executeTransaction(signer, game_call('commit_moves', args))
  }

  const reveal_moves = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
    const args = [duelist_id, duel_id, salt, moves]
    return await _executeTransaction(signer, game_call('reveal_moves', args))
  }

  //
  // Duel token
  //


  const create_duel = async (signer: AccountInterface, duelist_id: BigNumberish, challenged_id_or_address: BigNumberish, premise: Premise, quote: string, table_id: string, expire_hours: number): Promise<boolean> => {
    // find lords contract
    const table = getComponentValue(TableConfig, bigintToEntity(stringToFelt(table_id)))
    if (!table) throw new Error(`Table does not exist [${table_id}]`)
    const duel_token_contract = getContractByName(manifest, NAMESPACE, 'duel_token')
    let calls: Call[] = []
    // // calculate fee value
    // const approved_value = await calc_fee_duel(table_id)
    // // approve call
    // if (isPositiveBigint(table.fee_contract_address) && approved_value > 0) {
    //   calls.push({
    //     contractAddress: bigintToHex(table.fee_contract_address),
    //     entrypoint: 'approve',
    //     calldata: [duel_token_contract.address, bigintToU256(approved_value)],
    //   })
    // }
    // game call
    calls.push({
      contractAddress: duel_token_contract.address,
      entrypoint: 'create_duel',
      calldata: [duelist_id, BigInt(challenged_id_or_address), getPremiseValue(premise), stringToFelt(quote), table_id, expire_hours],
    })
    return await _executeTransaction(signer, calls)
  }

  const reply_duel = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, accepted: boolean): Promise<boolean> => {
    const reply_args = [duelist_id, duel_id, accepted]
    return await _executeTransaction(signer, duel_token_call('reply_duel', reply_args))
  }


  //
  // Duelist token
  //

  const create_duelist = async (signer: AccountInterface, recipient: BigNumberish, name: string, profile_pic_type: ProfilePicType, profile_pic_uri: string): Promise<boolean> => {
    const args = [recipient, stringToFelt(name), getProfilePicTypeValue(profile_pic_type), stringToFelt(profile_pic_uri)]

    // TODO

    return await _executeTransaction(signer, duelist_token_call('create_duelist', args))
  }

  const update_duelist = async (signer: AccountInterface, duelist_id: BigNumberish, name: string, profile_pic_type: ProfilePicType, profile_pic_uri: string): Promise<boolean> => {
    const args = [duelist_id, stringToFelt(name), getProfilePicTypeValue(profile_pic_type), stringToFelt(profile_pic_uri)]
    return await _executeTransaction(signer, duelist_token_call('update_duelist', args))
  }


  //
  // Admin
  //

  const grant_admin = async (signer: AccountInterface, address: BigNumberish, granted: boolean): Promise<boolean> => {
    const args = [address, granted]
    return await _executeTransaction(signer, admin_call('grant_admin', args))
  }

  const admin_set_config = async (signer: AccountInterface, values: any): Promise<boolean> => {
    const args = Object.keys(Config.schema).map(key => {
      const value = values[key]
      if (value == null) throw new Error()
      return value
    })
    return await _executeTransaction(signer, admin_call('set_config', args))
  }

  const admin_set_table = async (signer: AccountInterface, table: any): Promise<boolean> => {
    const args = Object.keys(TableConfig.schema).map(key => {
      const value = table[key]
      if (value == null) throw new Error()
      return value
    })
    // const args = [values]
    return await _executeTransaction(signer, admin_call('set_table', args))
  }

  const admin_set_table_admittance = async (signer: AccountInterface, table_admittance: any): Promise<boolean | null> => {
    const args = Object.keys(TableAdmittance.schema).map(key => {
      const value = table_admittance[key]
      if (value == null) throw new Error()
      return value
    })
    return await _executeTransaction(signer, admin_call('set_table_admittance', args))
  }



  //------------------------------------
  // view calls
  //

  const get_duel_progress = async (duel_id: BigNumberish): Promise<any | null> => {
    const args = [duel_id]
    let results = await _executeCall<any>(game_call('get_duel_progress', args))
    const duel_progress = convert_duel_progress(results)
    // console.log(`get_duel_progress{${bigintToHex(duel_id)}}`, results, '>', duel_progress)
    return duel_progress
  }

  const get_player_card_decks = async (table_id: string): Promise<number[][] | null> => {
    const args = [table_id]
    const results = await _executeCall<any>(game_call('get_player_card_decks', args))
    if (results == null) return null
    return results.map((vo: BigNumberish[]) => vo.map((vi: BigNumberish) => Number(vi)))
  }

  //
  // duel_token
  //

  const calc_fee_duel = async (table_id: string): Promise<bigint | null> => {
    const args = [stringToFelt(table_id)]
    const results = await _executeCall<bigint>(duel_token_call('calc_fee', args))
    return results ?? null
  }

  const can_join = async (table_id: string, duelist_id: BigNumberish): Promise<boolean | null> => {
    const args = [stringToFelt(table_id), duelist_id]
    const results = await _executeCall<boolean>(duel_token_call('can_join', args))
    return results ?? null
  }

  // const get_pact = async (duelist_id_a: BigNumberish, duelist_id_b: BigNumberish): Promise<bigint | null> => {
  //   const args = [duelist_id_a, duelist_id_b]
  //   const results = await _executeCall<bigint>(duel_token_call('get_pact', args))
  //   return results ?? null
  // }

  // const has_pact = async (duelist_id_a: BigNumberish, duelist_id_b: BigNumberish): Promise<boolean | null> => {
  //   const args = [duelist_id_a, duelist_id_b]
  //   const results = await _executeCall<boolean>(duel_token_call('has_pact', args))
  //   return results ?? null
  // }


  //
  // duelist_token
  //

  const calc_fee_duelist = async (recipient: BigNumberish): Promise<boolean | null> => {
    const args = [recipient]
    const results = await _executeCall<boolean>(duelist_token_call('calc_fee', args))
    return results ?? null
  }

  const duelist_token_uri = async (token_id: BigNumberish): Promise<string | null> => {
    const args = [token_id]
    const results = await _executeCall<string>(duelist_token_call('token_uri', args))
    return results ?? null
  }

  //
  // admin
  //

  const admin_am_i_admin = async (account_address: BigNumberish): Promise<string | null> => {
    const args = [account_address]
    const results = await _executeCall<string>(admin_call('am_i_admin', args))
    return results ?? null
  }

  // TEST/DEBUG
  const test_validate_commit_message = async (
    account: BigNumberish,
    signature: BigNumberish[],
    duelId: BigNumberish,
    duelistId: BigNumberish,
  ): Promise<boolean | null> => {
    const args = [account, signature, duelId, duelistId]
    const results = await _executeCall<boolean>(game_call('test_validate_commit_message', args))
    return results ?? null
  }


  return {
    //
    // game
    commit_moves,
    reveal_moves,
    get_duel_progress,
    get_player_card_decks,
    //
    // duel_token
    calc_fee_duel,
    create_duel,
    reply_duel,
    can_join,
    // get_pact,
    // has_pact,
    //
    // duelist_token
    calc_fee_duelist,
    create_duelist,
    update_duelist,
    duelist_token_uri,
    //
    // admin
    grant_admin,
    admin_set_config,
    admin_set_table,
    admin_set_table_admittance,
    admin_am_i_admin,
    //
    // TEST/DEBUG
    test_validate_commit_message,
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
