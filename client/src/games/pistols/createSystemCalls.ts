import { DojoCall, DojoProvider, getContractByName } from '@dojoengine/core'
import { AccountInterface, BigNumberish, Call, Result } from 'starknet'
import { DojoManifest } from '@/lib/dojo/Dojo'
import { ClientComponents } from '@/lib/dojo/setup/setup'
import { arrayClean, bigintToHex, isPositiveBigint, shortAddress } from '@/lib/utils/types'
import { stringToFelt, bigintToU256 } from '@/lib/utils/starknet'
import {
  Premise, getPremiseValue,
  ProfilePicType, getProfilePicTypeValue,
} from '@/games/pistols/generated/constants'
import { convert_duel_progress } from '@/games/pistols/duel_progress'
import { emitter } from '@/pistols/three/game'
import { getConfig } from '@/pistols/stores/configStore'

// FIX while this is not merged
// https://github.com/dojoengine/dojo.js/pull/190
// import { setComponentsFromEvents } from '@/lib/dojo/fix/setComponentsFromEvents'

export const NAMESPACE = 'pistols'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export type DojoCalls = Array<DojoCall | Call>

const game_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'game',
  entrypoint,
  calldata,
})
const admin_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'admin',
  entrypoint,
  calldata,
})
const duel_token_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'duel_token',
  entrypoint,
  calldata,
})
const duelist_token_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'duelist_token',
  entrypoint,
  calldata,
})

export function createSystemCalls(
  components: ClientComponents,
  manifest: DojoManifest,
  provider: DojoProvider,
) {
  
  const approve_call = (approved_value: BigNumberish): Call | undefined => {
    if (!isPositiveBigint(approved_value)) return undefined
    const config = getConfig()
    if (!config) throw new Error(`Config does not exist`)
    if (!isPositiveBigint(config.lords_address)) return undefined
    const bank_contract = getContractByName(manifest, NAMESPACE, 'bank')
    return {
      contractAddress: bigintToHex(config.lords_address),
      entrypoint: 'approve',
      calldata: [bank_contract.address, bigintToU256(approved_value)],
    }
  }

  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190

  const _executeTransaction = async (signer: AccountInterface, calls: DojoCalls): Promise<boolean> => {
    let success = false
    try {
      console.log(`execute...`, calls)
      calls = arrayClean(calls)
      const tx = await provider.execute(signer, calls, NAMESPACE);
      calls.forEach((param, index) => {
        //@ts-ignore
        console.log(`execute[${index}] ${param?.contractAddress ? `(${shortAddress(param.contractAddress)})` : calls?.contractName}::${param.entrypoint}():`, param.calldata, tx)
      })

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt);
      (success ? console.log : console.warn)(`execute success:`, success, 'receipt:', receipt, 'calls:', calls)

      // set from events ahead of torii
      // setComponentsFromEvents(contractComponents, getEvents(receipt));
    } catch (e) {
      console.warn(`execute exception:`, calls, e)
    } finally {
    }
    return success
  }

  const _executeCall = async <T extends Result>(call: DojoCall): Promise<T | null> => {
    let results: Result = undefined
    try {
      results = await provider.call(NAMESPACE, call)
      // result = decodeComponent(contractComponents['Component'], response)
      // results = Array.isArray(response) ? response.map(v => BigInt(v)) : typeof response == 'boolean' ? response : BigInt(response)
      // console.log(`call ${system}(${args.length}) success:`, result)
    } catch (e) {
      console.warn(`call ${call.contractName}::${call.entrypoint}(${call.calldata.length}) exception:`, e)
    } finally {
    }
    return results as T
  }


  //
  // Game
  //

  const commit_moves = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish): Promise<boolean> => {
    const args = [duelist_id, duel_id, hash]
    const calls: DojoCalls = [game_call('commit_moves', args)]
    return await _executeTransaction(signer, calls)
  }

  const reveal_moves = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
    const args = [duelist_id, duel_id, salt, moves]
    const calls: DojoCalls = [game_call('reveal_moves', args)]
    return await _executeTransaction(signer, calls)
  }


  //
  // Duel token
  //

  const create_duel = async (signer: AccountInterface, duelist_id: BigNumberish, challenged_id_or_address: BigNumberish, premise: Premise, quote: string, table_id: string, expire_hours: number): Promise<boolean> => {
    let calls: DojoCalls = []
    //
    // approve call
    const approved_value = await calc_mint_fee_duel(table_id)
    const approve = approve_call(approved_value)
    if (approve) calls.push(approve)
    //
    // game call
    const args = [duelist_id, BigInt(challenged_id_or_address), getPremiseValue(premise), stringToFelt(quote), table_id, expire_hours]
    calls.push(duel_token_call('create_duel', args))
    return await _executeTransaction(signer, calls)
  }

  const reply_duel = async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, accepted: boolean): Promise<boolean> => {
    const args = [duelist_id, duel_id, accepted]
    const calls: DojoCalls = [duel_token_call('reply_duel', args)]
    return await _executeTransaction(signer, calls)
  }


  //
  // Duelist token
  //

  const create_duelist = async (signer: AccountInterface, recipient: BigNumberish, name: string, profile_pic_type: ProfilePicType, profile_pic_uri: string): Promise<boolean> => {
    let calls: DojoCalls = []
    //
    // approve call
    const approved_value = await calc_mint_fee_duelist(signer.address)
    const approve = approve_call(approved_value)
    if (approve) calls.push(approve)
    //
    // game call
    const args = [recipient, stringToFelt(name), getProfilePicTypeValue(profile_pic_type), stringToFelt(profile_pic_uri)]
    calls.push(duelist_token_call('create_duelist', args))
    return await _executeTransaction(signer, calls)
  }

  const update_duelist = async (signer: AccountInterface, duelist_id: BigNumberish, name: string, profile_pic_type: ProfilePicType, profile_pic_uri: string): Promise<boolean> => {
    const args = [duelist_id, stringToFelt(name), getProfilePicTypeValue(profile_pic_type), stringToFelt(profile_pic_uri)]
    const calls: DojoCalls = [duelist_token_call('update_duelist', args)]
    return await _executeTransaction(signer, calls)
  }


  //
  // Admin
  //

  const grant_admin = async (signer: AccountInterface, address: BigNumberish, granted: boolean): Promise<boolean> => {
    const args = [address, granted]
    const calls: DojoCalls = [admin_call('grant_admin', args)]
    return await _executeTransaction(signer, calls)
  }

  const admin_set_config = async (signer: AccountInterface, values: any): Promise<boolean> => {
    // const args = Object.keys(Config.schema).map(key => {
    //   const value = values[key]
    //   if (value == null) throw new Error()
    //   return value
    // })
    // const calls: DojoCalls = [admin_call('set_config', args)]
    // return await _executeTransaction(signer, calls)
    console.warn(`FUNCTIONALITY DISABLED!`)
    return false
  }

  const admin_set_table = async (signer: AccountInterface, table: any): Promise<boolean> => {
    // const args = Object.keys(TableConfig.schema).map(key => {
    //   const value = table[key]
    //   if (value == null) throw new Error()
    //   return value
    // })
    // // const args = [values]
    // const calls: DojoCalls = [admin_call('set_table', args)]
    // return await _executeTransaction(signer, calls)
    console.warn(`FUNCTIONALITY DISABLED!`)
    return false
  }

  const admin_set_table_admittance = async (signer: AccountInterface, table_admittance: any): Promise<boolean | null> => {
    // const args = Object.keys(TableAdmittance.schema).map(key => {
    //   const value = table_admittance[key]
    //   if (value == null) throw new Error()
    //   return value
    // })
    // const calls: DojoCalls = [admin_call('set_table_admittance', args)]
    // return await _executeTransaction(signer, calls)
    console.warn(`FUNCTIONALITY DISABLED!`)
    return false
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

  const calc_mint_fee_duel = async (table_id: string): Promise<bigint | null> => {
    const args = [stringToFelt(table_id)]
    const results = await _executeCall<bigint>(duel_token_call('calc_mint_fee', args))
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

  const calc_mint_fee_duelist = async (recipient: BigNumberish): Promise<bigint | null> => {
    const args = [recipient]
    const results = await _executeCall<bigint>(duelist_token_call('calc_mint_fee', args))
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
    calc_mint_fee_duel,
    create_duel,
    reply_duel,
    can_join,
    // get_pact,
    // has_pact,
    //
    // duelist_token
    calc_mint_fee_duelist,
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
