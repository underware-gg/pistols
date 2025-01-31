import { BigNumberish } from 'starknet'
import { EMOJI } from '/src/data/messages'
import { SceneName } from '/src/data/assets'
import { bigintToDecimal } from '@underware_gg/pistols-sdk/utils'
import { constants, makeCharacterDuelistId } from '@underware_gg/pistols-sdk/pistols'


//------------------------------------------
// misc helpers
//

export const makeDuelDataUrl = (duelId: BigNumberish) => {
  return `/dueldata/${bigintToDecimal(duelId)}`
}

export const PLAYER_CHARACTER_ID = makeCharacterDuelistId(constants.ProfileType.Character, constants.CharacterProfile.Player)


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
  [constants.ChallengeState.Awaiting]: "Awaiting for Challenged's response",
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
  Idle = constants.PacesCard.None,
  Paces1 = constants.PacesCard.Paces1,
  Paces2 = constants.PacesCard.Paces2,
  Paces3 = constants.PacesCard.Paces3,
  Paces4 = constants.PacesCard.Paces4,
  Paces5 = constants.PacesCard.Paces5,
  Paces6 = constants.PacesCard.Paces6,
  Paces7 = constants.PacesCard.Paces7,
  Paces8 = constants.PacesCard.Paces8,
  Paces9 = constants.PacesCard.Paces9,
  Paces10 = constants.PacesCard.Paces10,
  Seppuku = constants.BladesCard.Seppuku,
  PocketPistol = constants.BladesCard.PocketPistol,
  Behead = constants.BladesCard.Behead,
  Grapple = constants.BladesCard.Grapple,
}

export const ActionNames: Record<Action, string> = {
  [Action.Idle]: 'Idle',
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
  [Action.Idle]: 'Stays',
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
  [Action.Idle]: EMOJI.IDLE,
  [Action.Paces1]: EMOJI.PACES,
  [Action.Paces2]: EMOJI.PACES,
  [Action.Paces3]: EMOJI.PACES,
  [Action.Paces4]: EMOJI.PACES,
  [Action.Paces5]: EMOJI.PACES,
  [Action.Paces6]: EMOJI.PACES,
  [Action.Paces7]: EMOJI.PACES,
  [Action.Paces8]: EMOJI.PACES,
  [Action.Paces9]: EMOJI.PACES,
  [Action.Paces10]: EMOJI.PACES,
  [Action.Seppuku]: EMOJI.SEPPUKU,
  [Action.PocketPistol]: EMOJI.POCKET_PISTOL,
  [Action.Behead]: EMOJI.BEHEAD,
  [Action.Grapple]: EMOJI.GRAPPLE,
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
  [SceneName.Duels]: 'The Tables (Live Duels)',
  [SceneName.Graveyard]: 'The Graveyard (Past Duels)',
  [SceneName.Profile]: 'Account & Duelists',
}


