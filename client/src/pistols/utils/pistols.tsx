import { BigNumberish } from 'starknet'
import { Archetype, BladesCard, ChallengeState, getBladesCardFromValue, getPacesCardFromValue, getTacticsCardFromValue, PacesCard, Premise, RoundState, TacticsCard } from '@/games/pistols/generated/constants'
import { EMOJI } from '@/pistols/data/messages'
import { SceneName } from '@/pistols/data/assets'
import { bigintToNumber } from '@/lib/utils/types'

//------------------------------------------
// must be in sync with CHALLENGE_STATE
// (challenge.cairo)
//
export const LiveChallengeStates: ChallengeState[] = [
  ChallengeState.Awaiting,
  ChallengeState.InProgress,
]

export const PastChallengeStates: ChallengeState[] = [
  ChallengeState.Resolved,
  ChallengeState.Draw,
  ChallengeState.Refused,
  ChallengeState.Withdrawn,
  ChallengeState.Expired,
]

export const AllChallengeStates: ChallengeState[] = [
  ...LiveChallengeStates,
  ...PastChallengeStates,
]

export const ChallengeStateNames: Record<ChallengeState, string> = {
  [ChallengeState.Null]: 'Null',
  [ChallengeState.Awaiting]: 'Awaiting',
  [ChallengeState.Withdrawn]: 'Withdrawn',
  [ChallengeState.Refused]: 'Refused',
  [ChallengeState.Expired]: 'Expired',
  [ChallengeState.InProgress]: 'In Progress',
  [ChallengeState.Resolved]: 'Resolved',
  [ChallengeState.Draw]: 'Draw',
}

export const ChallengeStateDescriptions: Record<ChallengeState, string> = {
  [ChallengeState.Null]: "Challenge does not exist",
  [ChallengeState.Awaiting]: "Awaiting for Challenged's response",
  [ChallengeState.Withdrawn]: "Cowardly withdrawn by Challenger",
  [ChallengeState.Refused]: "Cowardly refused by Challenged",
  [ChallengeState.Expired]: "Challenge expired",
  [ChallengeState.InProgress]: "Challenge in progress",
  [ChallengeState.Resolved]: "Honour has been satisfied",
  [ChallengeState.Draw]: "Honour has not been satisfied",
}

export const ChallengeStateClasses: Record<ChallengeState, string> = {
  [ChallengeState.Null]: '',
  [ChallengeState.Awaiting]: '',
  [ChallengeState.Withdrawn]: 'Canceled',
  [ChallengeState.Refused]: 'Canceled',
  [ChallengeState.Expired]: 'Canceled',
  [ChallengeState.InProgress]: 'Bold Important',
  [ChallengeState.Resolved]: '',
  [ChallengeState.Draw]: 'Warning',
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

export const RoundStateNames: Record<RoundState, string> = {
  [RoundState.Null]: 'Null',
  [RoundState.Commit]: 'Commit',
  [RoundState.Reveal]: 'Reveal',
  [RoundState.Finished]: 'Finished',
}


//------------------------------------------
// (action.cairo)
//
export enum Action {
  Idle = PacesCard.None,
  Paces1 = PacesCard.Paces1,
  Paces2 = PacesCard.Paces2,
  Paces3 = PacesCard.Paces3,
  Paces4 = PacesCard.Paces4,
  Paces5 = PacesCard.Paces5,
  Paces6 = PacesCard.Paces6,
  Paces7 = PacesCard.Paces7,
  Paces8 = PacesCard.Paces8,
  Paces9 = PacesCard.Paces9,
  Paces10 = PacesCard.Paces10,
  Seppuku = BladesCard.Seppuku,
  PocketPistol = BladesCard.PocketPistol,
  Behead = BladesCard.Behead,
  Grapple = BladesCard.Grapple,
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

export const ActionTypes: Record<string, Action[]> = {
  paces: [
    Action.Paces1,
    Action.Paces2,
    Action.Paces3,
    Action.Paces4,
    Action.Paces5,
    Action.Paces6,
    Action.Paces7,
    Action.Paces8,
    Action.Paces9,
    Action.Paces10,
  ],
  melee: [
    Action.Behead,
    Action.Grapple,
  ],
  runner: [
    Action.Seppuku,
    Action.PocketPistol,
  ]
}

export const ArchetypeNames: Record<Archetype, string> = {
  [Archetype.Undefined]: 'Undefined',
  [Archetype.Villainous]: 'Villainous',
  [Archetype.Trickster]: 'Trickster',
  [Archetype.Honourable]: 'Honourable',
}

export const PremisePrefix: Record<Premise, string> = {
  [Premise.Null]: 'over...?',
  [Premise.Matter]: 'over the matter of',
  [Premise.Debt]: 'to discharge a debt',
  [Premise.Dispute]: 'to satisfy a dispute',
  [Premise.Honour]: 'to defend their honour',
  [Premise.Hatred]: 'to satisfy a burning hatred',
  [Premise.Blood]: 'for the love of death and blood',
  [Premise.Nothing]: 'for no reason other than',
  [Premise.Tournament]: 'to be the winner of',
}

export const MenuLabels: Partial<Record<SceneName, string>> = {
  [SceneName.Gate]: 'Exit to Gate',
  [SceneName.Tavern]: 'The Bar',
  [SceneName.Duelists]: 'The Balcony (Opponents)',
  [SceneName.Duels]: 'The Tables (Live Duels)',
  [SceneName.Graveyard]: 'The Graveyard (Past Duels)',
  [SceneName.Profile]: 'Account & Duelists',
}

export type Hand = {
  card_fire: PacesCard,
  card_dodge: PacesCard,
  card_tactics: TacticsCard,
  card_blades: BladesCard,
}

export const movesToHand = (moves: number[]): Hand => {
  return {
    card_fire: getPacesCardFromValue(moves[0]),
    card_dodge: getPacesCardFromValue(moves[1]),
    card_tactics: getTacticsCardFromValue(moves[2]),
    card_blades: getBladesCardFromValue(moves[3]),
  }
}

export const makeDuelDataUrl = (duelId: BigNumberish) => {
  return `/dueldata/${bigintToNumber(duelId)}`
}
