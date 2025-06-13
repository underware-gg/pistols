import { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet';
import { useAccount } from '@starknet-react/core';
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { bigintEquals, bigintToHex } from '@underware/pistols-sdk/utils';
import { useStoreModelsByKeys } from '@underware/pistols-sdk/dojo';
import { models, constants } from '@underware/pistols-sdk/pistols/gen';
import { parseEnumVariant } from '@underware/pistols-sdk/starknet';

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
        const duelId = BigInt(callToAction?.duel_id ?? 0);
        if (duelId > 0n && bigintEquals(callToAction.player_address, address)) {
          const action = parseEnumVariant<constants.ChallengeAction>(callToAction.action);
          if (!_ignoredActions.includes(action)) {
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
  // console.warn(`useCallToChallenge() =================>`, entities, activeChallenges, requiredDuelIds)
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



//--------------------------------
// 'consumer' hooks
// [PlayerSocialLinkEvent]
//

export const usePlayerSocialLink = (socialPlatform: constants.SocialPlatform) => {
  const { address } = useAccount()
  return useSocialLink(socialPlatform, address)
}
export const useSocialLink = (socialPlatform: constants.SocialPlatform, address: BigNumberish) => {
  const entities = useEventsStore((state) => state.entities);
  const link = useStoreModelsByKeys<models.PlayerSocialLinkEvent>(entities, 'PlayerSocialLinkEvent', [address, constants.getSocialPlatformValue(socialPlatform)])

  const userName = useMemo(() => link?.user_name ?? '', [link])
  const userId = useMemo(() => link?.user_id ?? '', [link])
  const avatar = useMemo(() => link?.avatar ?? '', [link])
  const isLinked = useMemo(() => Boolean(userName) || Boolean(userId), [userName, userId])

  return {
    isLinked,
    userName,
    userId,
    avatar,
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
  const { userName, userId, avatar, isLinked } = useSocialLink(constants.SocialPlatform.Discord, address)
  const avatarUrl = useMemo(() => (
    (userId && avatar) ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : ''
  ), [userId, avatar])
  return {
    isLinked,
    userName,
    userId,
    avatar,
    avatarUrl,
  }
}

