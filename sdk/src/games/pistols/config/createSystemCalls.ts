import { DojoCall, DojoProvider, getContractByName } from '@dojoengine/core'
import { AccountInterface, BigNumberish, Call, CallData, UniversalDetails } from 'starknet'
import { arrayClean, shortAddress, isPositiveBigint, bigintToHex } from 'src/utils/misc/types'
import { NAMESPACE, getLordsAddress, getBankAddress, getVrfAddress } from 'src/games/pistols/config/config'
import { stringToFelt, bigintToU256 } from 'src/utils/starknet/starknet'
import { makeCustomEnum } from 'src/utils/starknet/starknet_enum'
import { DojoNetworkConfig } from 'src/games/pistols/config/networks'
import { DojoManifest } from 'src/dojo/contexts/Dojo'
import { setupWorld } from 'src/games/pistols/generated/contracts.gen'
import { emitter } from 'src/dojo/hooks/useDojoEmitterEvent'
import * as constants from 'src/games/pistols/generated/constants'

export type SystemCalls = ReturnType<typeof createSystemCalls>;
export type DojoCalls = Array<DojoCall | Call>

const _details: UniversalDetails = {
  version: 3,
}

export function createSystemCalls(
  provider: DojoProvider,
  manifest: DojoManifest,
  contractCalls: ReturnType<typeof setupWorld>,
  selectedNetworkConfig: DojoNetworkConfig,
) {
  
  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190
  const _executeTransaction = async (signer: AccountInterface, calls: DojoCalls): Promise<boolean> => {
    let success = false
    try {
      console.log(`_executeTransaction(): execute...`, calls)
      if (!signer) {
        throw new Error(`_executeTransaction(): not connected!`)
      }
      calls = arrayClean(calls)
      const tx = await provider.execute(signer, calls, NAMESPACE, _details);
      calls.forEach((c, index) => {
        //@ts-ignore
        console.log(`execute[${index}] ${c?.contractAddress ? `(${shortAddress(c.contractAddress)})` : c?.contractName}::${c.entrypoint}():`, c.calldata, tx)
      })
      if (!tx) {
        throw new Error(`_executeTransaction(): provider returned undefined tx`)
      }
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
    return {
      contractAddress: getVrfAddress(selectedNetworkConfig.networkId),
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
        const calls: DojoCalls = [
          contractCalls.game.buildCommitMovesCalldata(
            duelist_id,
            duel_id,
            hash,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      reveal_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildRevealMovesCalldata(
            duelist_id,
            duel_id,
            salt,
            moves,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      collect_duel: async (signer: AccountInterface, duel_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildCollectDuelCalldata(
            duel_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      collect_season: async (signer: AccountInterface): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildCollectSeasonCalldata(),
        ]
        return await _executeTransaction(signer, calls)
      },
      clear_call_to_action: async (signer: AccountInterface, duel_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildClearCallToActionCalldata(
            duel_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // tutorial.cairo
    //
    tutorial: {
      create_tutorial: async (signer: AccountInterface, player_id: BigNumberish, tutorial_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildCreateTutorialCalldata(
            player_id,
            tutorial_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      commit_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildCommitMovesCalldata(
            duelist_id,
            duel_id,
            hash,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      reveal_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[]): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildRevealMovesCalldata(
            duelist_id,
            duel_id,
            salt,
            moves,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // duel_token
    //
    duel_token: {
      create_duel: async (signer: AccountInterface, duelist_id: BigNumberish, challenged_address: BigNumberish, premise: constants.Premise, quote: string, table_id: string, expire_hours: number, lives_staked: number): Promise<boolean> => {
        let calls: DojoCalls = [
          contractCalls.duel_token.buildCreateDuelCalldata(
            duelist_id,
            bigintToHex(challenged_address),
            makeCustomEnum(premise),
            stringToFelt(quote),
            stringToFelt(table_id),
            expire_hours,
            lives_staked,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      reply_duel: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, accepted: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.duel_token.buildReplyDuelCalldata(
            duelist_id,
            duel_id,
            accepted,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // pack_token
    //
    pack_token: {
      claim_starter_pack: async (signer: AccountInterface): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.pack_token.buildClaimStarterPackCalldata(),
        ]
        return await _executeTransaction(signer, calls)
      },
      purchase: async (signer: AccountInterface, pack_type: constants.PackType): Promise<boolean> => {
        const pack_type_enum = makeCustomEnum(pack_type)
        const approved_value = await contractCalls.pack_token.calcMintFee(signer.address, pack_type_enum) as BigNumberish
        let calls: DojoCalls = [
          approve_call(approved_value),
          vrf_request_call(signer, 'pack_token'),
          contractCalls.pack_token.buildPurchaseCalldata(
            pack_type_enum,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      open: async (signer: AccountInterface, pack_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.pack_token.buildOpenCalldata(
            pack_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // bank
    //
    bank: {
      sponsor_duelists: async (signer: AccountInterface, lords_amount: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_call(lords_amount),
          contractCalls.bank.buildSponsorDuelistsCalldata(
            signer.address,
            lords_amount,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      sponsor_season: async (signer: AccountInterface, lords_amount: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_call(lords_amount),
          contractCalls.bank.buildSponsorSeasonCalldata(
            signer.address,
            lords_amount,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      sponsor_tournament: async (signer: AccountInterface, lords_amount: BigNumberish, tournament_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_call(lords_amount),
          contractCalls.bank.buildSponsorTournamentCalldata(
            signer.address,
            lords_amount,
            tournament_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // admin
    //
    admin: {
      grant_admin: async (signer: AccountInterface, address: BigNumberish, granted: boolean): Promise<boolean> => {
        // const calls: DojoCalls = [
        //   contractCalls.admin.buildGrantAdminCalldata(
        //     bigintToHex(address),
        //     granted,
        //   ),
        // ]
        // return await _executeTransaction(signer, calls)
        console.warn(`FUNCTIONALITY DISABLED!`)
        return false
      },
      set_config: async (signer: AccountInterface, values: any): Promise<boolean> => {
        console.warn(`FUNCTIONALITY DISABLED!`)
        return false
      },
      set_table: async (signer: AccountInterface, table: any): Promise<boolean> => {
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
