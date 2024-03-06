import { bigintToHex } from '@/pistols/utils/utils'
import { EMOJI } from '@/pistols/data/messages'

//------------------------------------------
// must be in sync with CHALLENGE_STATE
// (challenge.cairo)
//
export enum ChallengeState {
  Null,
  Awaiting,
  Withdrawn,
  Refused,
  Expired,
  InProgress,
  Resolved,
  Draw,
}

export const ChallengeStateNames: Record<ChallengeState, string> = {
  [ChallengeState.Null]: 'Null',
  [ChallengeState.Awaiting]: 'Awaiting',
  [ChallengeState.Withdrawn]: 'Withdrawn',
  [ChallengeState.Refused]: 'Refused',
  [ChallengeState.Expired]: 'Expired',
  [ChallengeState.InProgress]: 'InProgress',
  [ChallengeState.Resolved]: 'Resolved',
  [ChallengeState.Draw]: 'Draw',
}

export const ChallengeStateDescriptions: Record<ChallengeState, string> = {
  [ChallengeState.Null]: "Challenge does not exist",
  [ChallengeState.Awaiting]: "Awaiting for Challenged's reply",
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
  [ChallengeState.InProgress]: 'Positive',
  [ChallengeState.Resolved]: '',
  [ChallengeState.Draw]: 'Warning',
}


export const ChallengeMessages = [
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


//------------------------------------------
// must be in sync with ROUND_STATE
// (challenge.cairo)
//
export enum RoundState {
  Null,
  Commit,
  Reveal,
  Finished,
}
export const RoundStateNames: Record<RoundState, string> = {
  [RoundState.Null]: 'Null',
  [RoundState.Commit]: 'Commit',
  [RoundState.Reveal]: 'Reveal',
  [RoundState.Finished]: 'Finished',
}


//------------------------------------------
// must be in sync with BLADES
// (action.cairo)
//
export enum Action {
  Idle = 0,
  Paces1 = 1,
  Paces2 = 2,
  Paces3 = 3,
  Paces4 = 4,
  Paces5 = 5,
  Paces6 = 6,
  Paces7 = 7,
  Paces8 = 8,
  Paces9 = 9,
  Paces10 = 10,
  Fast = 0x10,
  Strong = 0x20,
  Block = 0x30,
  Flee = 0x40,
  Steal = 0x50,
  Seppuku = 0x60,
}

export const ActionNames: Record<Action, string> = {
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
  [Action.Idle]: 'Idle',
  [Action.Fast]: 'Fast Blow',
  [Action.Strong]: 'Strong Blow',
  [Action.Block]: 'Block',
  [Action.Flee]: 'Flee',
  [Action.Steal]: 'Steal',
  [Action.Seppuku]: 'Seppuku',
}

export const ActionVerbs: Record<Action, string> = {
  [Action.Paces1]: 'Shoots at',
  [Action.Paces2]: 'Shoots at',
  [Action.Paces3]: 'Shoots at',
  [Action.Paces4]: 'Shoots at',
  [Action.Paces5]: 'Shoots at',
  [Action.Paces6]: 'Shoots at',
  [Action.Paces7]: 'Shoots at',
  [Action.Paces8]: 'Shoots at',
  [Action.Paces9]: 'Shoots at',
  [Action.Paces10]: 'Shoots at',
  [Action.Idle]: 'Stays',
  [Action.Fast]: 'Strikes a',
  [Action.Strong]: 'Strikes a',
  [Action.Block]: 'Do a',
  [Action.Flee]: 'Tries to',
  [Action.Steal]: 'Tries to',
  [Action.Seppuku]: 'Commits a',
}

export const ActionEmojis: Record<Action, string> = {
  [Action.Paces1]: EMOJI.PISTOL,
  [Action.Paces2]: EMOJI.PISTOL,
  [Action.Paces3]: EMOJI.PISTOL,
  [Action.Paces4]: EMOJI.PISTOL,
  [Action.Paces5]: EMOJI.PISTOL,
  [Action.Paces6]: EMOJI.PISTOL,
  [Action.Paces7]: EMOJI.PISTOL,
  [Action.Paces8]: EMOJI.PISTOL,
  [Action.Paces9]: EMOJI.PISTOL,
  [Action.Paces10]: EMOJI.PISTOL,
  [Action.Idle]: EMOJI.IDLE,
  [Action.Fast]: EMOJI.LIGHT,
  [Action.Strong]: EMOJI.HEAVY,
  [Action.Block]: EMOJI.BLOCK,
  [Action.Flee]: EMOJI.FLEE,
  [Action.Steal]: EMOJI.WAGER,
  [Action.Seppuku]: EMOJI.SEPPUKU,
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
    Action.Fast,
    Action.Strong,
    Action.Block,
  ],
  runner: [
    Action.Flee,
    Action.Steal,
    Action.Seppuku,
  ]
}

//-------------------------
// client stuff
//

export const makeDuelUrl = (duelId: bigint) => (`/duel/${bigintToHex(duelId)}`)

