import { useCallback } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useAsyncRunner } from '@underware/pistols-sdk/utils/hooks'


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

