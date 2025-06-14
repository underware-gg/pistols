import { useCallback } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useAsyncRunner } from '@underware/pistols-sdk/utils/hooks'
import { constants } from '@underware/pistols-sdk/pistols/gen'


//------------------------------------------
// game
//

export const useExecuteEmitPlayerBookmark = (targetAddress: BigNumberish, targetId: BigNumberish, isBookmarked: boolean) => {
  const { run, isRunning } = useAsyncRunner<boolean>()
  const { account, isConnected } = useAccount()
  const { game } = useDojoSystemCalls();
  const _execute = useCallback(() => {
    run(() => game.emit_player_bookmark(account, targetAddress, targetId, isBookmarked))
  }, [run, game, account, targetAddress, targetId, isBookmarked])
  return {
    emit_player_bookmark: _execute,
    isDisabled: (!isConnected || isRunning),
  }
}

export const useExecuteClearPlayerSocialLink = (socialPlatform: constants.SocialPlatform) => {
  const { run, isRunning } = useAsyncRunner<boolean>()
  const { account, isConnected } = useAccount()
  const { game } = useDojoSystemCalls();
  const _execute = useCallback(() => {
    run(() => game.clear_player_social_link(account, socialPlatform))
  }, [run, game, account, socialPlatform])
  return {
    clear_player_social_link: _execute,
    isDisabled: (!isConnected || isRunning),
  }
}

export const useExecuteEmitPlayerSetting = (socialPlatform: constants.SocialPlatform, setting: constants.PlayerSetting, value: boolean) => {
  const { run, isRunning } = useAsyncRunner<boolean>()
  const { account, isConnected } = useAccount()
  const { game } = useDojoSystemCalls();
  const _execute = useCallback(() => {
    run(() => game.emit_player_setting(account, socialPlatform, setting, value))
  }, [run, game, account, socialPlatform, setting, value])
  return {
    emit_player_setting: _execute,
    isDisabled: (!isConnected || isRunning),
  }
}
