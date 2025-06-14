import { DojoCall, DojoProvider, getContractByName } from '@dojoengine/core'
import { AccountInterface, BigNumberish, CairoCustomEnum, Call, CallData, UniversalDetails } from 'starknet'
import { arrayClean, shortAddress, isPositiveBigint, bigintToHex } from 'src/utils/misc/types'
import { NAMESPACE, getLordsAddress, getBankAddress, getVrfAddress, DojoManifest } from 'src/games/pistols/config/config'
import { bigintToU256 } from 'src/starknet/starknet'
import { makeCustomEnum } from 'src/starknet/starknet_enum'
import { DojoNetworkConfig } from 'src/games/pistols/config/networks'
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
      console.log(`_executeTransaction(): execute...`, calls, provider)
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
      clear_call_to_challenge: async (signer: AccountInterface, duel_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildClearCallToChallengeCalldata(
            duel_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      emit_player_bookmark: async (signer: AccountInterface, target_address: BigNumberish, target_id: BigNumberish, enabled: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildEmitPlayerBookmarkCalldata(
            bigintToHex(target_address),
            target_id,
            enabled,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      clear_player_social_link: async (signer: AccountInterface, social_platform: constants.SocialPlatform): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildClearPlayerSocialLinkCalldata(
            makeCustomEnum(social_platform),
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      emit_player_setting: async (signer: AccountInterface, social_platform: constants.SocialPlatform, setting: constants.PlayerSetting, value: boolean): Promise<boolean> => {
        const settingValue = (
          setting == constants.PlayerSetting.OptOutNotifications ? makeCustomEnum(constants.PlayerSettingValue.Boolean, value)
            : undefined
        );
        const calls: DojoCalls = [
          contractCalls.game.buildEmitPlayerSettingCalldata(
            makeCustomEnum(setting, makeCustomEnum(social_platform)),
            settingValue,
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
      create_duel: async (signer: AccountInterface, duel_type: constants.DuelType, duelist_id: BigNumberish, challenged_address: BigNumberish, lives_staked: number, expire_hours: number, premise: constants.Premise, message: string): Promise<boolean> => {
        let calls: DojoCalls = [
          contractCalls.duel_token.buildCreateDuelCalldata(
            makeCustomEnum(duel_type),
            duelist_id,
            bigintToHex(challenged_address),
            lives_staked,
            expire_hours,
            makeCustomEnum(premise),
            message,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      reply_duel: async (signer: AccountInterface, duel_id: BigNumberish, duelist_id: BigNumberish, accepted: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.duel_token.buildReplyDuelCalldata(
            duel_id,
            duelist_id,
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
      collect_season: async (signer: AccountInterface): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.bank.buildCollectSeasonCalldata(),
        ]
        return await _executeTransaction(signer, calls)
      },
    },
    //
    // admin
    //
    admin: {
      set_paused: async (signer: AccountInterface, paused: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetPausedCalldata(
            paused,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      set_is_team_member: async (signer: AccountInterface, address: BigNumberish, is_team_member: boolean, is_admin: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetIsTeamMemberCalldata(
            bigintToHex(address),
            is_team_member,
            is_admin,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      set_is_blocked: async (signer: AccountInterface, address: BigNumberish, is_blocked: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetIsBlockedCalldata(
            bigintToHex(address),
            is_blocked,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      disqualify_duelist: async (signer: AccountInterface, season_id: BigNumberish, duelist_id: BigNumberish, block_owner: boolean): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildDisqualifyDuelistCalldata(
            season_id,
            duelist_id,
            block_owner,
          ),
        ]
        return await _executeTransaction(signer, calls)
      },
      qualify_duelist: async (signer: AccountInterface, season_id: BigNumberish, duelist_id: BigNumberish): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildQualifyDuelistCalldata(
            season_id,
            duelist_id,
          ),
        ]
        return await _executeTransaction(signer, calls)
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
