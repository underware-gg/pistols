import { BigNumberish } from 'starknet'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { makeCharacterDuelistId } from '@underware/pistols-sdk/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { SceneName  } from '/src/data/assetsTypes'


//------------------------------------------
// misc helpers
//

export const makeDuelDataUrl = (duelId: BigNumberish) => {
  return `/dueldata/${bigintToDecimal(duelId)}`
}

export const makeDuelUrl = (duelId: BigNumberish) => {
  return `https://${window.location.hostname}/duel/${duelId}`;
}

export const makeDuelTweetUrl = (
  duelId: BigNumberish, 
  quote: string, 
  premise: constants.Premise, 
  livesStaked: number, 
  isYouA: boolean, 
  isYouB: boolean, 
  leftPlayerName: string, 
  rightPlayerName: string,
  isFinished: boolean = false
) => {
  const duelUrl = makeDuelUrl(duelId);
              
  // Limit quote length for Twitter
  const MAX_QUOTE_LENGTH = 40;
  const shortQuote = quote && quote.length > MAX_QUOTE_LENGTH 
    ? quote.substring(0, MAX_QUOTE_LENGTH) + '...' 
    : quote;
  
  // Format premise correctly
  const premiseText = premise ? constants.PREMISES[premise]?.prefix?.toUpperCase() || '' : '';
  const isPremiseOver = premiseText.startsWith('OVER');
  
  // High stakes mention only if lives > 1
  const highStakes = livesStaked > 1 ? '🔥 HIGH STAKES DUEL! 🔥\n' : '';
  
  // Emojis for visual appeal
  const emojis = ['🎯', '💥', '🔫', '⏱️', '🏆'];
  const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
  
  // Generate proper tweet based on context
  let tweetText;

  // For completed duels - suspenseful messaging without spoilers
  if (isFinished) {
    if (isYouA || isYouB) {
      // You were a participant
      const opponentName = isYouA ? rightPlayerName : leftPlayerName;
      tweetText = encodeURIComponent(`⚔️ DUEL CONCLUDED! ⚔️\n\nMy honor was on the line against ${opponentName} ${premiseText}...\n\n${randomEmoji()} The outcome will shock you! See what happened at @Pistols_gg\n\n${duelUrl}\n#PistolsAtDawn`);
    } else {
      // Spectator view
      if (livesStaked > 1) {
        tweetText = encodeURIComponent(`⚔️ BLOOD HAS BEEN SPILLED! ⚔️\n\n${leftPlayerName} vs ${rightPlayerName} ${premiseText} reached its shocking conclusion!\n\n${randomEmoji()} Fortune favored one duelist... but who?\n\n${randomEmoji()} See the fate that awaited at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
      } else {
        tweetText = encodeURIComponent(`⚔️ DRAMATIC FINISH! ⚔️\n\n${leftPlayerName} vs ${rightPlayerName} ${premiseText} just ended!\n\n${randomEmoji()} You won't believe how this duel concluded...\n\n${randomEmoji()} Witness the final moments at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
      }
    }
  } else {
    // For ongoing or new duels - original messaging
    if (isYouA) {
      // I challenged them
      if (isPremiseOver && quote) {
        // If premise is "OVER" and we have a quote
        if (shortQuote.length < MAX_QUOTE_LENGTH - 10) { 
          tweetText = encodeURIComponent(`⚔️ CHALLENGE ISSUED! ⚔️\n\nI've called out ${rightPlayerName} ${premiseText} this grave matter:\n\n"${shortQuote}"\n\n${highStakes}${randomEmoji()} Honor demands satisfaction at @Pistols_gg!\n${duelUrl}\n#PistolsAtDawn`);
        } else {
          tweetText = encodeURIComponent(`⚔️ CHALLENGE ISSUED! ⚔️\n\nI've summoned ${rightPlayerName} to face me in combat at @Pistols_gg!\n\n${randomEmoji()} The offense? Too serious for Twitter...\n\n${highStakes}${randomEmoji()} Come witness justice served!\n${duelUrl}\n#PistolsAtDawn`);
        }
      } else {
        // For other premises (TO, FOR, etc)
        tweetText = encodeURIComponent(`⚔️ CHALLENGE ISSUED! ⚔️\n\nI've challenged ${rightPlayerName} ${premiseText} in PISTOLS AT DAWN!\n\n${quote ? `The reason: "${shortQuote}"\n\n` : ''}${highStakes}${randomEmoji()} Dawn breaks, pistols ready at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
      }
    } else if (isYouB) {
      // They challenged me
      if (isPremiseOver && quote) {
        // If premise is "OVER" and we have a quote
        if (shortQuote.length < MAX_QUOTE_LENGTH - 10) {
          tweetText = encodeURIComponent(`⚔️ DUEL SUMMONING! ⚔️\n\n${rightPlayerName} has challenged me ${premiseText} these fighting words:\n\n"${shortQuote}"\n\n${highStakes}${randomEmoji()} Will I survive? Find out at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
        } else {
          tweetText = encodeURIComponent(`⚔️ DUEL SUMMONING! ⚔️\n\n${rightPlayerName} dares question my honor at @Pistols_gg!\n\n${randomEmoji()} The accusation? Come see for yourself...\n\n${highStakes}${randomEmoji()} My reputation hangs in the balance!\n${duelUrl}\n#PistolsAtDawn`);
        }
      } else {
        // For other premises (TO, FOR, etc)
        tweetText = encodeURIComponent(`⚔️ DUEL SUMMONING! ⚔️\n\n${rightPlayerName} has challenged me ${premiseText} in PISTOLS AT DAWN!\n\n${quote ? `Their accusations: "${shortQuote}"\n\n` : ''}${highStakes}${randomEmoji()} Victory or death at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
      }
    } else {
      // Spectator view
      if (isPremiseOver && quote) {
        // If premise is "OVER" and we have a quote
        if (shortQuote.length < MAX_QUOTE_LENGTH - 10) {
          tweetText = encodeURIComponent(`⚔️ DUEL ALERT! ⚔️\n\n${leftPlayerName} vs ${rightPlayerName} ${premiseText}:\n\n"${shortQuote}"\n\n${highStakes}${randomEmoji()} Blood will be spilled at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
        } else {
          tweetText = encodeURIComponent(`⚔️ DUEL ALERT! ⚔️\n\n${leftPlayerName} vs ${rightPlayerName} at @Pistols_gg!\n\n${randomEmoji()} The scandal that started it all? Too juicy for Twitter!\n\n${highStakes}${randomEmoji()} Witness the bloodshed!\n${duelUrl}\n#PistolsAtDawn`);
        }
      } else {
        // For other premises (TO, FOR, etc)
        tweetText = encodeURIComponent(`⚔️ DUEL ALERT! ⚔️\n\n${leftPlayerName} vs ${rightPlayerName} ${premiseText} in PISTOLS AT DAWN!\n\n${quote ? `Fighting over: "${shortQuote}"\n\n` : ''}${highStakes}${randomEmoji()} Only one will leave with honor at @Pistols_gg\n${duelUrl}\n#PistolsAtDawn`);
      }
    }
  }
  
  return `https://twitter.com/intent/tweet?text=${tweetText}`;
}

export const PLAYER_CHARACTER_ID = makeCharacterDuelistId(constants.DuelistProfile.Character, constants.CharacterKey.Player)


//------------------------------------------
// (challenge.cairo)
//
export const LiveChallengeStates: constants.ChallengeState[] = [
  constants.ChallengeState.Awaiting,
  constants.ChallengeState.InProgress,
]

export const PastChallengeStates: constants.ChallengeState[] = [
  constants.ChallengeState.Resolved,
  constants.ChallengeState.Draw,
  constants.ChallengeState.Refused,
  constants.ChallengeState.Withdrawn,
  constants.ChallengeState.Expired,
]

export const AllChallengeStates: constants.ChallengeState[] = [
  ...LiveChallengeStates,
  ...PastChallengeStates,
]

export const ChallengeStateNames: Record<constants.ChallengeState, string> = {
  [constants.ChallengeState.Null]: 'Null',
  [constants.ChallengeState.Awaiting]: 'Awaiting',
  [constants.ChallengeState.Withdrawn]: 'Withdrawn',
  [constants.ChallengeState.Refused]: 'Refused',
  [constants.ChallengeState.Expired]: 'Expired',
  [constants.ChallengeState.InProgress]: 'In Progress',
  [constants.ChallengeState.Resolved]: 'Resolved',
  [constants.ChallengeState.Draw]: 'Draw',
}

export const ChallengeStateDescriptions: Record<constants.ChallengeState, string> = {
  [constants.ChallengeState.Null]: "Challenge does not exist",
  [constants.ChallengeState.Awaiting]: "Waiting for Challenged's response",
  [constants.ChallengeState.Withdrawn]: "Cowardly withdrawn by Challenger",
  [constants.ChallengeState.Refused]: "Cowardly refused by Challenged",
  [constants.ChallengeState.Expired]: "Challenge expired",
  [constants.ChallengeState.InProgress]: "Challenge in progress",
  [constants.ChallengeState.Resolved]: "Honour has been satisfied",
  [constants.ChallengeState.Draw]: "Honour has not been satisfied",
}

export const ChallengeStateReplyVerbs: Record<constants.ChallengeState, string> = {
  [constants.ChallengeState.Null]: '---',
  [constants.ChallengeState.Awaiting]: '---',
  [constants.ChallengeState.Withdrawn]: 'withdrew from',
  [constants.ChallengeState.Refused]: 'refused',
  [constants.ChallengeState.Expired]: 'collected',
  [constants.ChallengeState.InProgress]: 'accepted',
  [constants.ChallengeState.Resolved]: 'accepted',
  [constants.ChallengeState.Draw]: 'accepted',
}

export const ChallengeStateClasses: Record<constants.ChallengeState, string> = {
  [constants.ChallengeState.Null]: '',
  [constants.ChallengeState.Awaiting]: '',
  [constants.ChallengeState.Withdrawn]: 'Canceled',
  [constants.ChallengeState.Refused]: 'Canceled',
  [constants.ChallengeState.Expired]: 'Canceled',
  [constants.ChallengeState.InProgress]: 'Bold Important',
  [constants.ChallengeState.Resolved]: '',
  [constants.ChallengeState.Draw]: 'Warning',
}

export const ChallengeQuotes = [
  //34567890123456789012345678901| << max cairo string size (31 bytes)
  "I challenge ya for a duel!",
  "I demand satisfaction!",
  "You are no honourable Lord!",
  "Let's settle this on pistols!",
  "Your time has come, punk!",
  "Pistols clash at dawn!",
  "A price must be paid!",
  "We meet at sunrise!",
  "Prepare to die!",
  "How dare you?",
  "For honour!",
]

export const RoundStateNames: Record<constants.RoundState, string> = {
  [constants.RoundState.Null]: 'Null',
  [constants.RoundState.Commit]: 'Commit',
  [constants.RoundState.Reveal]: 'Reveal',
  [constants.RoundState.Finished]: 'Finished',
}


//------------------------------------------
// (action.cairo)
//
export enum Action {
  // Idle = Action_None,
  None = 'None', // constants.PacesCard.None,
  Paces1 = 'Paces1', // constants.PacesCard.Paces1,
  Paces2 = 'Paces2', // constants.PacesCard.Paces2,
  Paces3 = 'Paces3', // constants.PacesCard.Paces3,
  Paces4 = 'Paces4', // constants.PacesCard.Paces4,
  Paces5 = 'Paces5', // constants.PacesCard.Paces5,
  Paces6 = 'Paces6', // constants.PacesCard.Paces6,
  Paces7 = 'Paces7', // constants.PacesCard.Paces7,
  Paces8 = 'Paces8', // constants.PacesCard.Paces8,
  Paces9 = 'Paces9', // constants.PacesCard.Paces9,
  Paces10 = 'Paces10', // constants.PacesCard.Paces10,
  Seppuku = 'Seppuku', // constants.BladesCard.Seppuku,
  PocketPistol = 'PocketPistol', // constants.BladesCard.PocketPistol,
  Behead = 'Behead', // constants.BladesCard.Behead,
  Grapple = 'Grapple', // constants.BladesCard.Grapple,
}

export const ActionNames: Record<Action, string> = {
  [Action.None]: 'Idle',
  [Action.Paces1]: '1 Pace',
  [Action.Paces2]: '2 Paces',
  [Action.Paces3]: '3 Paces',
  [Action.Paces4]: '4 Paces',
  [Action.Paces5]: '5 Paces',
  [Action.Paces6]: '6 Paces',
  [Action.Paces7]: '7 Paces',
  [Action.Paces8]: '8 Paces',
  [Action.Paces9]: '9 Paces',
  [Action.Paces10]: '10 Paces',
  [Action.Seppuku]: 'Seppuku',
  [Action.PocketPistol]: 'Pocket Pistol',
  [Action.Behead]: 'Behead',
  [Action.Grapple]: 'Grapple',
}

export const ActionVerbs: Record<Action, string> = {
  [Action.None]: 'Stays',
  [Action.Paces1]: 'Fires at',
  [Action.Paces2]: 'Fires at',
  [Action.Paces3]: 'Fires at',
  [Action.Paces4]: 'Fires at',
  [Action.Paces5]: 'Fires at',
  [Action.Paces6]: 'Fires at',
  [Action.Paces7]: 'Fires at',
  [Action.Paces8]: 'Fires at',
  [Action.Paces9]: 'Fires at',
  [Action.Paces10]: 'Fires at',
  [Action.Seppuku]: 'Commits a',
  [Action.PocketPistol]: 'Tries to',
  [Action.Behead]: 'Commits a',
  [Action.Grapple]: 'Commits a',
}

export const ActionEmojis: Record<Action, string> = {
  [Action.None]: EMOJIS.IDLE,
  [Action.Paces1]: EMOJIS.PACES,
  [Action.Paces2]: EMOJIS.PACES,
  [Action.Paces3]: EMOJIS.PACES,
  [Action.Paces4]: EMOJIS.PACES,
  [Action.Paces5]: EMOJIS.PACES,
  [Action.Paces6]: EMOJIS.PACES,
  [Action.Paces7]: EMOJIS.PACES,
  [Action.Paces8]: EMOJIS.PACES,
  [Action.Paces9]: EMOJIS.PACES,
  [Action.Paces10]: EMOJIS.PACES,
  [Action.Seppuku]: EMOJIS.SEPPUKU,
  [Action.PocketPistol]: EMOJIS.POCKET_PISTOL,
  [Action.Behead]: EMOJIS.BEHEAD,
  [Action.Grapple]: EMOJIS.GRAPPLE,
}

export const ArchetypeNames: Record<constants.Archetype, string> = {
  [constants.Archetype.Undefined]: 'Undefined',
  [constants.Archetype.Villainous]: 'Villainous',
  [constants.Archetype.Trickster]: 'Trickster',
  [constants.Archetype.Honourable]: 'Honourable',
}

export const MenuLabels: Partial<Record<SceneName, string>> = {
  [SceneName.Gate]: 'Exit to Gate',
  [SceneName.Tavern]: 'The Bar',
  [SceneName.Duelists]: 'The Balcony (Opponents)',
  [SceneName.Matchmaking]: 'The Matchmaking Table',
  [SceneName.DuelsBoard]: 'The Tables (Live Duels)',
  [SceneName.Graveyard]: 'The Graveyard (Past Duels)',
  [SceneName.Profile]: 'Account & Duelists',
}


