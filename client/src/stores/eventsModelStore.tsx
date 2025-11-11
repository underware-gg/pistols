import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet';
import { useAccount } from '@starknet-react/core';
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { useAllStoreModels, useDojoSetup, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo';
import { parseCustomEnum, parseEnumVariant, weiToEth } from '@underware/pistols-sdk/starknet';
import { bigintEquals, bigintToAddress, bigintToDecimal, bigintToHex, bigintToNumber } from '@underware/pistols-sdk/utils';
import { models, constants } from '@underware/pistols-sdk/pistols/gen';
import * as ENV from '/src/utils/env'
import { useConfig } from './configStore';
import { useSeasonsLeaderboardRewards_OLD } from '../queries/useSeasonsLeaderboardRewards';

export const useEventsStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
// [CallToChallengeEvent]
//
const _ignoredActions = [
  constants.ChallengeAction.Undefined,
  constants.ChallengeAction.Finished,
]
const _requiredActions = [
  constants.ChallengeAction.Reply,
  constants.ChallengeAction.Commit,
  constants.ChallengeAction.Reveal,
  constants.ChallengeAction.Results,
]
export type CallToChallengeDuel = {
  duelId: bigint;
  action: constants.ChallengeAction;
  requiresAction: boolean;
  timestamp: number;
}
export function useCallToChallenges() {
  const { address } = useAccount()
  const entities = useEventsStore((state) => state.entities)
  const activeChallenges = useMemo(() => (
    Object.values(entities)
      .reduce((acc, e) => {
        const callToAction = e.models.pistols.CallToChallengeEvent
        if (callToAction) {
          const duelId = BigInt(callToAction?.duel_id ?? 0);
          const action = parseEnumVariant<constants.ChallengeAction>(callToAction.action);
          if (!_ignoredActions.includes(action)
            && bigintEquals(callToAction.player_address, address)
          ) {
            acc.push({
              duelId,
              action,
              requiresAction: _requiredActions.includes(action),
              timestamp: Number(callToAction.timestamp),
            })
          }
        }
        return acc;
      }, [] as CallToChallengeDuel[])
  ), [entities])
  const requiredDuelIds = useMemo(() => activeChallenges.filter((ch) => ch.requiresAction).map((ch) => ch.duelId), [activeChallenges])
  const requiresAction = useMemo(() => (requiredDuelIds.length > 0), [requiredDuelIds])
  // useMemo(() => console.log(`[EventsModelStoreSync] useCallToChallenge() =================>`, entities, activeChallenges, requiredDuelIds), [activeChallenges])
  return {
    activeChallenges,   // all current active challenges
    requiredDuelIds,    // IDs of challenges that require action
    requiresAction,     // true if there are challenges that require action
  }
}

export function useDuelCallToAction(duel_id: BigNumberish) {
  const { requiredDuelIds } = useCallToChallenges()
  return requiredDuelIds.includes(BigInt(duel_id))
}

export function useDuelCallToActionWithState(duel_id: BigNumberish) {
  const { activeChallenges } = useCallToChallenges()
  return activeChallenges.find((ch) => ch.duelId === BigInt(duel_id))
}



//--------------------------------
// 'consumer' hooks
// [PlayerSocialLinkEvent]
//
const _makePlayerSettingKeys = (address: BigNumberish, setting: constants.PlayerSetting, socialPlatform: constants.SocialPlatform): BigNumberish[] => {
  return [
    bigintToHex(address),
    constants.getPlayerSettingValue(setting),
    constants.getSocialPlatformValue(socialPlatform),
  ]
}

export const usePlayerSocialLink = (socialPlatform: constants.SocialPlatform) => {
  const { address } = useAccount()
  return useSocialLink(socialPlatform, address)
}
export const useSocialLink = (socialPlatform: constants.SocialPlatform, address: BigNumberish) => {
  const entities = useEventsStore((state) => state.entities);
  const link = useStoreModelsByKeys<models.PlayerSocialLinkEvent>(entities, 'PlayerSocialLinkEvent', [address, constants.getSocialPlatformValue(socialPlatform)]);
  
  const userName = useMemo(() => link?.user_name ?? '', [link])
  const userId = useMemo(() => link?.user_id ?? '', [link])
  const avatar = useMemo(() => link?.avatar ?? '', [link])
  const isLinked = useMemo(() => Boolean(userName) || Boolean(userId), [userName, userId])

  // PlayerSetting.OptOutNotifications
  const optOutKeys = useMemo(() => _makePlayerSettingKeys(address, constants.PlayerSetting.OptOutNotifications, socialPlatform), [address, socialPlatform]);
  const optOutSetting = useStoreModelsByKeys<models.PlayerSettingEvent>(entities, 'PlayerSettingEvent', optOutKeys);
  const {
    variant: _optedOutVariant,
    value: optedOutValue,
  } = useMemo(() => parseCustomEnum<constants.PlayerSettingValue, boolean>(optOutSetting?.value), [optOutSetting])

  // console.log(`useSocialLink() ::: entities=`, entities)
  // console.log(`useSocialLink() ::: link=`, link)
  // console.log(`useSocialLink() ::: optOut=`, optOutSetting)
  // console.log(`useSocialLink() ::: optedOut/optedOutValue=`, _optedOutVariant, optedOutValue)

  return {
    isLinked,
    userName,
    userId,
    avatar,
    optedOut: optedOutValue,
  }
}

//
// Discord
//
export const usePlayerDiscordSocialLink = () => {
  const { address } = useAccount()
  return useDiscordSocialLink(address)
}
export const useDiscordSocialLink = (address: BigNumberish) => {
  const { selectedNetworkConfig } = useDojoSetup()
  const { userName, userId, avatar, isLinked, optedOut } = useSocialLink(constants.SocialPlatform.Discord, address)
  const avatarUrl = useMemo(() => (
    (userId && avatar) ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : ''
  ), [userId, avatar])
  // get a new version of the avatar url from the assets server
  // must be used only if avatarUrl is not available
  const apiAvatarUrl = useMemo(() => (
    (userId ? `${selectedNetworkConfig.assetsServerUrl}/api/discord/avatar/${userId}/` : '')
  ), [userId])
  // get the user data from the assets server
  const apiUserDatarUrl = useMemo(() => (
    (userId ? `${selectedNetworkConfig.assetsServerUrl}/api/discord/user/${userId}/` : '')
  ), [userId])
  return {
    isLinked,
    userName,
    userId,
    avatar,
    avatarUrl,
    apiAvatarUrl,
    apiUserDatarUrl,
    optedOut,
  }
}


//--------------------------------
// [SeasonLeaderboardEvent]
//
export type SeasonLeaderboardPosition = {
  duelistId: bigint;
  points: number;
  playerAddress: string;
  lordsAmount_eth: bigint;
  lordsAmount_wei: bigint;
}
export type SeasonLeaderboard = {
  totalLords_wei: bigint;
  totalLords_eth: bigint;
  duelists: Record<string, SeasonLeaderboardPosition>;
  positions: SeasonLeaderboardPosition[],
}
const _parseSeasonLeaderboard = (leaderboard: models.SeasonLeaderboardEvent | undefined): SeasonLeaderboard => {
  const positions = leaderboard?.positions.map((position) => {
    return {
      duelistId: BigInt(position.duelist_id),
      points: bigintToNumber(position.points),
      playerAddress: bigintToAddress(position.player_address),
      lordsAmount_eth: weiToEth(BigInt(position.lords_amount)),
      lordsAmount_wei: BigInt(position.lords_amount)
    }
  }) ?? [];
  const duelists = positions.reduce((acc, position) => {
    acc[bigintToDecimal(position.duelistId)] = position;
    return acc;
  }, {} as Record<string, SeasonLeaderboardPosition>);
  const totalLords_wei = positions.reduce((acc, position) => acc + BigInt(position.lordsAmount_wei), 0n);
  return {
    positions,
    duelists,
    totalLords_wei,
    totalLords_eth: weiToEth(totalLords_wei),
  }
}

export const useSeasonLeaderboards = (seasonId: number) => {
  const entities = useEventsStore((state) => state.entities);
  const leaderboard = useStoreModelsByKeys<models.SeasonLeaderboardEvent>(entities, 'SeasonLeaderboardEvent', [seasonId]);
  const seasonLeaderboard = useMemo(() => _parseSeasonLeaderboard(leaderboard), [leaderboard])
  // useEffect(() => {
  //   console.log(`useSeasonLeaderboards() ::: seasonLeaderboard=`, seasonId, seasonLeaderboard)
  // }, [seasonId, seasonLeaderboard])
  return {
    seasonLeaderboard
  }
}

export const useAllSeasonLeaderboards = () => {
  const entities = useEventsStore((state) => state.entities);
  const leaderboards = useAllStoreModels<models.SeasonLeaderboardEvent>(entities, 'SeasonLeaderboardEvent');

  // TODO: REMOVE THIS!
  const rewardsPerSeason = useSeasonsLeaderboardRewards_OLD();

  const leaderboardsPerSeason = useMemo(() => {
    const result = leaderboards.reduce((acc, leaderboard) => {
      const seasonId = Number(leaderboard.season_id);
      acc[seasonId] = _parseSeasonLeaderboard(leaderboard);
      return acc;
    }, {} as Record<number, SeasonLeaderboard>);

    // -------- TODO: REMOVE THIS! ------------
    Object.entries(rewardsPerSeason).forEach(([seasonId, rewards]) => {
      result[seasonId] = {
        totalLords_wei: rewards.totalLords,
        totalLords_eth: weiToEth(rewards.totalLords),
        duelists: Object.fromEntries(Object.entries(rewards.duelists).map(([duelistId, lordsAmount]) => [duelistId, {
          duelistId: BigInt(duelistId),
          points: 0,
          playerAddress: '?',
          lordsAmount_wei: lordsAmount,
          lordsAmount_eth: weiToEth(lordsAmount),
        }])),
      };
    });
    // ---------- until here ----------

    return result;
  }, [leaderboards, rewardsPerSeason])


  useEffect(() => {
    console.log(`useAllSeasonLeaderboards() ::: leaderboards=`, leaderboardsPerSeason)
  }, [leaderboardsPerSeason])
  
  return {
    leaderboardsPerSeason,
  }
}
