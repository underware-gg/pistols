import { DojoCall, DojoProvider, getContractByName } from '@dojoengine/core'
import { AccountInterface, BigNumberish, Call, CallData } from 'starknet'
import { arrayClean, shortAddress, isPositiveBigint } from 'src/utils/misc/types'
import { NAMESPACE, getLordsAddress, getBankAddress } from 'src/games/pistols/config/config'
import { stringToFelt, bigintToU256 } from 'src/utils/misc/starknet'
import { makeCustomEnum } from 'src/utils/misc/starknet_enum'
import { DojoNetworkConfig } from 'src/games/pistols/config/networks'
import { DojoManifest } from 'src/dojo/contexts/Dojo'
import { setupWorld } from 'src/games/pistols/generated/contracts.gen'
import { emitter } from 'src/dojo/hooks/useDojoEmitterEvent'
import * as constants from 'src/games/pistols/generated/constants'

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export type DojoCalls = Array<DojoCall | Call>

const game_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'game',
  entrypoint,
  calldata,
})
const tutorial_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'tutorial',
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
const pack_token_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'pack_token',
  entrypoint,
  calldata,
})
const admin_call = (entrypoint: string, calldata: any[]): DojoCall => ({
  contractName: 'admin',
  entrypoint,
  calldata,
})

export function createSystemCalls(
  provider: DojoProvider,
  manifest: DojoManifest,
  constractCalls: ReturnType<typeof setupWorld>,
  selectedNetworkConfig: DojoNetworkConfig,
) {
  
  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190
  const _executeTransaction = async (signer: AccountInterface, calls: DojoCalls): Promise<boolean> => {
    let success = false
    try {
      console.log(`execute...`, calls)
      calls = arrayClean(calls)
      const tx = await provider.execute(signer, calls, NAMESPACE);
      calls.forEach((c, index) => {
        //@ts-ignore
        console.log(`execute[${index}] ${c?.contractAddress ? `(${shortAddress(c.contractAddress)})` : c?.contractName}::${c.entrypoint}():`, c.calldata, tx)
      })

      const receipt = await signer.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
      success = getReceiptStatus(receipt);
      (success ? console.log : console.warn)(`execute success:`, success, 'receipt:', receipt, 'calls:', calls)
    } catch (e) {
      console.warn(`execute exception:`, calls, e)
    } finally {
    }
    return success
  }

  // const _executeCall = async <T extends Result>(call: DojoCall): Promise<T | null> => {
  //   let results: Result = undefined
  //   try {
  //     results = await provider.call(NAMESPACE, call)
  //   } catch (e) {
  //     console.warn(`call ${call.contractName}::${call.entrypoint}(${call.calldata.length}) exception:`, e)
  //   } finally {
  //   }
  //   return results as T
  // }

  const approve_call = (approved_value: BigNumberish): Call | undefined => {
    if (!isPositiveBigint(approved_value)) return undefined
    return {
      contractAddress: getLordsAddress(selectedNetworkConfig.networkId),
      entrypoint: 'approve',
      calldata: [getBankAddress(selectedNetworkConfig.networkId), bigintToU256(approved_value)],
    }
  }

  // https://docs.cartridge.gg/vrf/overview#executing-vrf-transactions
  const vrf_request_call = (signer: AccountInterface, contractName: string): Call => {
    const contract_address = getContractByName(manifest, NAMESPACE, contractName).address
    const vrf_address = selectedNetworkConfig.vrfAddress || getContractByName(manifest, NAMESPACE, 'vrf_mock').address
    return {
      contractAddress: vrf_address,
      entrypoint: 'request_random',
      calldata: CallData.compile({
        caller: contract_address,
        source: { type: 0, address: signer.address },
      }),
    }
  }

  return {
    //
    // game.cairo
    //
    game: {
      commit_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish): Promise<boolean> => {
        const args = [duelist_id, duel_id, hash]
        const calls: DojoCalls = [game_call('commit_moves', args)]
        return await _executeTransaction(signer, calls)
      },
      reveal_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
        const args = [duelist_id, duel_id, salt, moves]
        const calls: DojoCalls = [game_call('reveal_moves', args)]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // tutorial.cairo
    //
    tutorial: {
      create_tutorial: async (signer: AccountInterface, player_id: BigNumberish, tutorial_id: BigNumberish): Promise<boolean> => {
        const args = [player_id, tutorial_id]
        const calls: DojoCalls = [tutorial_call('create_tutorial', args)]
        return await _executeTransaction(signer, calls)
      },
      commit_moves: async (signer: AccountInterface, player_id: BigNumberish, tutorial_id: BigNumberish, hash: BigNumberish): Promise<boolean> => {
        const args = [player_id, tutorial_id, hash]
        const calls: DojoCalls = [tutorial_call('commit_moves', args)]
        return await _executeTransaction(signer, calls)
      },
      reveal_moves: async (signer: AccountInterface, player_id: BigNumberish, tutorial_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
        const args = [player_id, tutorial_id, salt, moves]
        const calls: DojoCalls = [tutorial_call('reveal_moves', args)]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // duel_token
    //
    duel_token: {
      create_duel: async (signer: AccountInterface, duelist_id: BigNumberish, challenged_address: BigNumberish, premise: constants.Premise, quote: string, table_id: string, expire_hours: number): Promise<boolean> => {
        // const approved_value = await constractCalls.duel_token.calcMintFee(table_id) as BigNumberish
        const args = [duelist_id, BigInt(challenged_address), makeCustomEnum(premise), stringToFelt(quote), table_id, expire_hours]
        let calls: DojoCalls = [
          // approve_call(approved_value),
          duel_token_call('create_duel', args),
        ]
        return await _executeTransaction(signer, calls)
      },
      reply_duel: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, accepted: boolean): Promise<boolean> => {
        const args = [duelist_id, duel_id, accepted]
        const calls: DojoCalls = [duel_token_call('reply_duel', args)]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // pack_token
    //
    pack_token: {
      claim_welcome_pack: async (signer: AccountInterface): Promise<boolean> => {
        const args: any[] = []
        const calls: DojoCalls = [pack_token_call('claim_welcome_pack', args)]
        return await _executeTransaction(signer, calls)
      },
      purchase: async (signer: AccountInterface, pack_type: constants.PackType): Promise<boolean> => {
        const pack_type_enum = makeCustomEnum(pack_type)
        const approved_value = await constractCalls.pack_token.calcMintFee(signer.address, pack_type_enum) as BigNumberish
        const args = [pack_type_enum]
        let calls: DojoCalls = [
          approve_call(approved_value),
          vrf_request_call(signer, 'pack_token'),
          pack_token_call('purchase', args),
        ]
        return await _executeTransaction(signer, calls)
      },
      open: async (signer: AccountInterface, pack_id: BigNumberish): Promise<boolean> => {
        const args = [pack_id]
        const calls: DojoCalls = [pack_token_call('open', args)]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // admin
    //
    admin: {
      grant_admin: async (signer: AccountInterface, address: BigNumberish, granted: boolean): Promise<boolean> => {
        const args = [address, granted]
        const calls: DojoCalls = [admin_call('grant_admin', args)]
        return await _executeTransaction(signer, calls)
      },
      set_config: async (signer: AccountInterface, values: any): Promise<boolean> => {
        // const args = Object.keys(Config.schema).map(key => {
        //   const value = values[key]
        //   if (value == null) throw new Error()
        //   return value
        // })
        // const calls: DojoCalls = [admin_call('set_config', args)]
        // return await _executeTransaction(signer, calls)
        console.warn(`FUNCTIONALITY DISABLED!`)
        return false
      },
      set_table: async (signer: AccountInterface, table: any): Promise<boolean> => {
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
      },
    },
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
