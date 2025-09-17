import { DojoCall, DojoProvider, getContractByName } from '@dojoengine/core'
import { AccountInterface, BigNumberish, CairoCustomEnum, Call, CallData, UniversalDetails, CairoOption, CairoOptionVariant } from 'starknet'
import { arrayClean, shortAddress, isPositiveBigint, bigintToHex, bigintToAddress } from 'src/utils/misc/types'
import { NAMESPACE, getLordsAddress, getBankAddress, getVrfAddress, DojoManifest, getMatchmakerAddress } from 'src/games/pistols/config/config'
import { bigintToU256 } from 'src/starknet/starknet'
import { makeCustomEnum } from 'src/starknet/starknet_enum'
import { DojoNetworkConfig } from 'src/games/pistols/config/networks'
import { setupWorld } from 'src/games/pistols/generated/contracts.gen'
import { emitter } from 'src/dojo/hooks/useDojoEmitterEvent'
import * as constants from 'src/games/pistols/generated/constants'
import { DuelistProfileKey } from '../misc/profiles'

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

  // Transaction status checker - can be used by transaction store
  const checkTransactionStatus = async (signer: AccountInterface, hash: string, calls?: DojoCalls, key?: string, shouldEmit: boolean = true): Promise<boolean> => {
    const receipt = await signer.waitForTransaction(hash, { retryInterval: 200 })
    const success = getReceiptStatus(receipt, shouldEmit);

    (success ? console.log : console.warn)(`execute success:`, success, 'receipt:', receipt, 'calls:', calls)

    if (key) {
      if (success) {
        emitter.emit('transaction_completed', { key, result: true })
      } else {
        emitter.emit('transaction_failed', { key, error: 'Transaction failed' })
      }
    }

    return success
  };

  // executeMulti() based on:
  // https://github.com/cartridge-gg/rollyourown/blob/f39bfd7adc866c1a10142f5ce30a3c6f900b467e/web/src/dojo/hooks/useSystems.ts#L178-L190
  const _executeTransaction = async (signer: AccountInterface, calls: DojoCalls, key?: string): Promise<boolean> => {
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

      // If we have a key, emit transaction hash event
      if (key) {
        emitter.emit('transaction_hash', { key, hash: tx.transaction_hash })
      }

      success = await checkTransactionStatus(signer, tx.transaction_hash, calls, key)
    } catch (e) {
      console.warn(`execute exception:`, calls, e)
      // If we have a key, emit error event
      if (key) {
        emitter.emit('transaction_failed', { key, error: e instanceof Error ? e.message : 'Transaction failed' })
      }
    }
    return success
  };

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

  const approve_erc20_call = (value: BigNumberish, tokenAddress: BigNumberish, spenderAddress: BigNumberish): Call | undefined => {
    if (!isPositiveBigint(value)) return undefined
    return {
      contractAddress: bigintToAddress(tokenAddress),
      entrypoint: 'approve',
      calldata: [bigintToAddress(spenderAddress), bigintToU256(value)],
    }
  }
  const approve_lords_call = (value: BigNumberish): Call | undefined => {
    return approve_erc20_call(
      value,
      getLordsAddress(selectedNetworkConfig.networkId),
      getBankAddress(selectedNetworkConfig.networkId),
    );
  }

  // https://docs.cartridge.gg/vrf/overview#executing-vrf-transactions
  const vrf_request_call = (contractName: string, nonceAddress: BigNumberish): Call => {
    const contract_address = getContractByName(manifest, NAMESPACE, contractName).address
    return {
      contractAddress: getVrfAddress(selectedNetworkConfig.networkId),
      entrypoint: 'request_random',
      calldata: CallData.compile({
        caller: contract_address,
        source: { type: 0, address: nonceAddress },
      }),
    }
  }

  return {
    // Export the checkTransactionStatus function for transaction store
    checkTransactionStatus,

    //
    // game.cairo
    //
    game: {
      commit_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildCommitMovesCalldata(
            duelist_id,
            duel_id,
            hash,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      reveal_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[], key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildRevealMovesCalldata(
            duelist_id,
            duel_id,
            salt,
            moves,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      collect_duel: async (signer: AccountInterface, duel_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildCollectDuelCalldata(
            duel_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      clear_call_to_challenge: async (signer: AccountInterface, duel_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildClearCallToChallengeCalldata(
            duel_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      emit_player_bookmark: async (signer: AccountInterface, target_address: BigNumberish, target_id: BigNumberish, enabled: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildEmitPlayerBookmarkCalldata(
            bigintToHex(target_address),
            target_id,
            enabled,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      clear_player_social_link: async (signer: AccountInterface, social_platform: constants.SocialPlatform, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.game.buildClearPlayerSocialLinkCalldata(
            makeCustomEnum(social_platform),
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      emit_player_setting: async (signer: AccountInterface, social_platform: constants.SocialPlatform, setting: constants.PlayerSetting, value: boolean, key?: string): Promise<boolean> => {
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
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // matchmaker.cairo
    //
    matchmaker: {
      enlist_duelist: async (signer: AccountInterface, duelist_id: BigNumberish, queue_id: constants.QueueId, key?: string): Promise<boolean> => {
        const queue_id_enum = makeCustomEnum(queue_id);
        const fees = await contractCalls.matchmaker.getEntryFee(queue_id_enum) as Record<string, BigNumberish>;
        const [tokenAddress, value] = Object.values(fees);
        const calls: DojoCalls = [
          approve_erc20_call(
            value,
            tokenAddress,
            getMatchmakerAddress(selectedNetworkConfig.networkId),
          ),
          contractCalls.matchmaker.buildEnlistDuelistCalldata(
            duelist_id,
            queue_id_enum,
          ),
        ];;
        return await _executeTransaction(signer, calls, key);
      },
      match_make_me: async (signer: AccountInterface, duelist_id: BigNumberish, queue_id: constants.QueueId, queue_mode: constants.QueueMode, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          vrf_request_call('matchmaker', signer.address),
          contractCalls.matchmaker.buildMatchMakeMeCalldata(
            duelist_id,
            makeCustomEnum(queue_id),
            makeCustomEnum(queue_mode),
          ),
        ];
        return await _executeTransaction(signer, calls, key);
      },
      clear_queue: async (signer: AccountInterface, queue_id: constants.QueueId, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.matchmaker.buildClearQueueCalldata(
            makeCustomEnum(queue_id),
          ),
        ];
        return await _executeTransaction(signer, calls, key);
      },
    },
    //
    // tutorial.cairo
    //
    tutorial: {
      create_tutorial: async (signer: AccountInterface, player_id: BigNumberish, tutorial_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildCreateTutorialCalldata(
            player_id,
            tutorial_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      commit_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, hash: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildCommitMovesCalldata(
            duelist_id,
            duel_id,
            hash,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      reveal_moves: async (signer: AccountInterface, duelist_id: BigNumberish, duel_id: BigNumberish, salt: BigNumberish, moves: number[], key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.tutorial.buildRevealMovesCalldata(
            duelist_id,
            duel_id,
            salt,
            moves,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // duel_token
    //
    duel_token: {
      create_duel: async (signer: AccountInterface, duel_type: constants.DuelType, duelist_id: BigNumberish, challenged_address: BigNumberish, lives_staked: number, expire_minutes: number, premise: constants.Premise, message: string, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.duel_token.buildCreateDuelCalldata(
            makeCustomEnum(duel_type),
            duelist_id,
            bigintToHex(challenged_address),
            lives_staked,
            expire_minutes,
            makeCustomEnum(premise),
            message,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      reply_duel: async (signer: AccountInterface, duel_id: BigNumberish, duelist_id: BigNumberish, accepted: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.duel_token.buildReplyDuelCalldata(
            duel_id,
            duelist_id,
            accepted,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // pack_token
    //
    pack_token: {
      claim_starter_pack: async (signer: AccountInterface, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.pack_token.buildClaimStarterPackCalldata(),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      purchase: async (signer: AccountInterface, pack_type: constants.PackType, key?: string): Promise<boolean> => {
        const pack_type_enum = makeCustomEnum(pack_type)
        const value = await contractCalls.pack_token.calcMintFee(signer.address, pack_type_enum) as BigNumberish
        const calls: DojoCalls = [
          approve_lords_call(value),
          vrf_request_call('pack_token', signer.address),
          contractCalls.pack_token.buildPurchaseCalldata(
            pack_type_enum,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      airdrop: async (signer: AccountInterface, recipient: BigNumberish, pack_type: constants.PackType, collection: constants.DuelistProfile | null, profile_key: DuelistProfileKey | null, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [];
        // random packs need VRF
        if (pack_type == constants.PackType.GenesisDuelists5x || pack_type == constants.PackType.FreeDuelist) {
          calls.push(vrf_request_call('pack_token', signer.address));
        }
        // airdrop call
        const pack_type_enum = makeCustomEnum(pack_type)
        const duelist_profile_enum = (collection && profile_key) ? makeCustomEnum(collection, makeCustomEnum(profile_key)) : undefined
        const duelist_profile_option = new CairoOption(
          duelist_profile_enum ? CairoOptionVariant.Some : CairoOptionVariant.None, duelist_profile_enum,
        );
        calls.push(
          contractCalls.pack_token.buildAirdropCalldata(
            bigintToAddress(recipient),
            pack_type_enum,
            duelist_profile_option,
          ),
        );
        return await _executeTransaction(signer, calls, key)
      },
      open: async (signer: AccountInterface, pack_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.pack_token.buildOpenCalldata(
            pack_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // ring_token
    //
    // fn claim_season_ring(ref self: TState, duel_id: u128, ring_type: RingType) -> u128;
    // fn airdrop_ring(ref self: TState, recipient: ContractAddress, ring_type: RingType) -> u128;
    ring_token: {
      claim_season_ring: async (signer: AccountInterface, duel_id: BigNumberish, ring_type: constants.RingType, key?: string): Promise<boolean> => {
        let calls: DojoCalls = [
          contractCalls.ring_token.buildClaimSeasonRingCalldata(
            bigintToHex(duel_id),
            makeCustomEnum(ring_type),
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      airdrop_ring: async (signer: AccountInterface, recipient: BigNumberish, ring_type: constants.RingType, key?: string): Promise<boolean> => {
        let calls: DojoCalls = [
          contractCalls.ring_token.buildAirdropRingCalldata(
            bigintToHex(recipient),
            makeCustomEnum(ring_type),
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // bank
    //
    bank: {
      sponsor_duelists: async (signer: AccountInterface, lords_amount: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_lords_call(lords_amount),
          contractCalls.bank.buildSponsorDuelistsCalldata(
            signer.address,
            lords_amount,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      sponsor_season: async (signer: AccountInterface, lords_amount: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_lords_call(lords_amount),
          contractCalls.bank.buildSponsorSeasonCalldata(
            signer.address,
            lords_amount,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      sponsor_tournament: async (signer: AccountInterface, lords_amount: BigNumberish, tournament_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          approve_lords_call(lords_amount),
          contractCalls.bank.buildSponsorTournamentCalldata(
            signer.address,
            lords_amount,
            tournament_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      collect_season: async (signer: AccountInterface, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.bank.buildCollectSeasonCalldata(),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
    //
    // admin
    //
    admin: {
      set_paused: async (signer: AccountInterface, paused: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetPausedCalldata(
            paused,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      set_is_team_member: async (signer: AccountInterface, address: BigNumberish, is_team_member: boolean, is_admin: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetIsTeamMemberCalldata(
            bigintToHex(address),
            is_team_member,
            is_admin,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      set_is_blocked: async (signer: AccountInterface, address: BigNumberish, is_blocked: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildSetIsBlockedCalldata(
            bigintToHex(address),
            is_blocked,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      disqualify_duelist: async (signer: AccountInterface, season_id: BigNumberish, duelist_id: BigNumberish, block_owner: boolean, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildDisqualifyDuelistCalldata(
            season_id,
            duelist_id,
            block_owner,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
      qualify_duelist: async (signer: AccountInterface, season_id: BigNumberish, duelist_id: BigNumberish, key?: string): Promise<boolean> => {
        const calls: DojoCalls = [
          contractCalls.admin.buildQualifyDuelistCalldata(
            season_id,
            duelist_id,
          ),
        ]
        return await _executeTransaction(signer, calls, key)
      },
    },
  }
}

function getReceiptStatus(receipt: any, shouldEmit: boolean = true): boolean {
  if (receipt.execution_status != 'SUCCEEDED') {
    if (receipt.execution_status == 'REVERTED') {
      console.error(`Transaction reverted:`, receipt.revert_reason)
    } else {
      console.error(`Transaction error [${receipt.execution_status}]:`, receipt)
    }
    if (shouldEmit) {
      emitter.emit('transaction_error', {
        status: receipt.execution_status,
        reason: receipt.revert_reason,
      })
    }
    return false
  }
  return true
}

