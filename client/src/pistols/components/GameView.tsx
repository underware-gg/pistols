import React, { useEffect } from 'react'
import { useGameplayContext, GameState } from '@/pistols/hooks/GameplayContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useGameEvent } from '@/pistols/hooks/useGameEvent'
import GameCanvas from '@/pistols/components/GameCanvas'
import { AudioName } from '@/pistols/data/assets'


const GameView = () => {
  const { duelId } = usePistolsContext()
  const { gameImpl, isPlaying, dispatchAnimated} = useGameplayContext()

  const animated = useGameEvent('animated', -1)
  useEffect(() => {
    console.log(`animated:`, animated)
    dispatchAnimated(animated)
  }, [animated])

  // const { chamberExists, yonder } = useChamber(chamberId)
  // const { tilemap, gameTilemap } = useChamberMap(chamberId, 777)

  // console.log(`GameView`, chamberId, chamberExists, gameTilemap)

  // Load map, set player start
  // useEffect(() => {
  //   if (chamberExists) {
  //     gameImpl?.setupMap(gameTilemap ?? null, false)
  //   }
  // }, [gameImpl, chamberExists, gameTilemap])


  return (
    <div className='Relative GameView'>
      <GameCanvas guiEnabled={null} />
      <GameLoop />
      <GameAudios />
    </div>
  )
}

const GameLoop = ({
}) => {
  const { duelId } = usePistolsContext()
  const { sfxEnabled } = useSettingsContext()
  const {
    gameImpl, gameState, isPlaying, health,
    dispatchGameState, dispatchMessage,
  } = useGameplayContext()

  // // Main game loop
  // useEffect(() => {
  //   if (!isPlaying) return

  //   //
  //   // Dark tar recharge has preference (to Slenderduck)
  //   // come back to process the move
  //   //
  //   if (tilemap[tile] == TileType.DarkTar) {
  //     if (gameImpl?.isTileEnaled(tile)) {
  //       gameImpl?.disableTile(tile)
  //       gameImpl?.playAudio(AudioName.DARK_TAR, sfxEnabled)
  //       dispatchDarkTar(100)
  //       return;
  //     }
  //   }

  //   //
  //   // Messages
  //   //
  //   if (!hasLight) {
  //     dispatchMessage('No light! Beware the Slender Duck!')
  //   }

  //   //
  //   // End-game situations
  //   //
  //   if (tilemap[tile] == TileType.Exit) {
  //     dispatchGameState(GameState.Verifying)
  //     dispatchTurnToDir(Dir.South)
  //   } else if (health == 0) {
  //     dispatchGameState(GameState.NoHealth)
  //   } else if (isPlaying && stepCount == 64) {
  //     dispatchSlendered()
  //   } else {
  //     //
  //     // Process movement
  //     //
  //     const chestAround = _isAround(tilemap, tile, TileType.Chest)
  //     const monsterAround = _isAround(tilemap, tile, TileType.Monster)
  //     const slenderAround = _isAround(tilemap, tile, TileType.SlenderDuck)
  //     if (chestAround != null) {
  //       gameImpl?.rotatePlayerTo(chestAround)
  //       dispatchTurnToTile(tile)
  //       // gameImpl?.playAudio(AudioName.MONSTER_HIT, sfxEnabled)
  //       dispatchGameState(GameState.Verifying)
  //     } else if (!hasLight && (tilemap[tile] == TileType.SlenderDuck || slenderAround != null)) {
  //       gameImpl?.damageFromTile(slenderAround ?? tile)
  //       gameImpl?.rotateToPlayer(slenderAround ?? tile)
  //       gameImpl?.rotatePlayerTo(slenderAround ?? tile)
  //       dispatchTurnToTile(tile)
  //       gameImpl?.playAudio(AudioName.MONSTER_HIT, sfxEnabled)
  //       dispatchSlendered()
  //     } else if (hasLight && tilemap[tile] == TileType.Monster) {
  //       gameImpl?.damageFromTile(tile)
  //       gameImpl?.playAudio(AudioName.MONSTER_HIT, sfxEnabled)
  //       dispatchHitDamage()
  //     } else if (hasLight && monsterAround != null) {
  //       gameImpl?.damageFromTile(monsterAround)
  //       gameImpl?.rotateToPlayer(monsterAround)
  //       gameImpl?.playAudio(AudioName.MONSTER_TOUCH, sfxEnabled)
  //       dispatchNearDamage()
  //     }
  //   }
  // }, [gameState, playerPosition?.tile, stepCount, light])

  // //----------------------------------
  // // Verify moves on-chain
  // //
  // const { finish_level } = useDojoSystemCalls()
  // const { account } = useDojoAccount()
  // const { name } = useDuelist(account?.address)
  // useEffect(() => {
  //   const proofLostGames = (process.env.PROOF_LOST_GAMES && (gameState == GameState.NoHealth || gameState == GameState.Slendered))
  //   if (gameState == GameState.Verifying || proofLostGames) {
  //     let proof = 0n
  //     steps.map((step, index) => {
  //       proof |= (BigInt(step.dir) << BigInt(index * 4))
  //     });
  //     console.log(`PROOF:`, bigintToHex(proof))
  //     const success = finish_level(account, chamberId, proof, steps.length, name)
  //     if (success && gameState == GameState.Verifying) {
  //       dispatchGameState(success ? GameState.Verified : GameState.NotVerified)
  //     }
  //   }
  // }, [gameState])

  return <></>
}


const GameAudios = () => {
  const { musicEnabled, sfxEnabled } = useSettingsContext()
  const { gameImpl, gameState, isPlaying } = useGameplayContext()

  useEffect(() => {
    const _play = (musicEnabled)
    gameImpl?.playAudio(AudioName.AMBIENT, _play)
  }, [musicEnabled])

  return <></>
}


export default GameView
