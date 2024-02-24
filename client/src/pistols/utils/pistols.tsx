import { bigintToHex } from "./utils"

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

export const ChallengeStateNames = {
  [ChallengeState.Null]: 'Null',
  [ChallengeState.Awaiting]: 'Awaiting',
  [ChallengeState.Withdrawn]: 'Withdrawn',
  [ChallengeState.Refused]: 'Refused',
  [ChallengeState.Expired]: 'Expired',
  [ChallengeState.InProgress]: 'InProgress',
  [ChallengeState.Resolved]: 'Resolved',
  [ChallengeState.Draw]: 'Draw',
}

export const ChallengeStateDescriptions = {
  [ChallengeState.Null]: "Challenge does not exist",
  [ChallengeState.Awaiting]: "Awaiting for Challenged's reply",
  [ChallengeState.Withdrawn]: "Cowardly withdrawn by Challenger",
  [ChallengeState.Refused]: "Cowardly refused by Challenged",
  [ChallengeState.Expired]: "Challenge expired",
  [ChallengeState.InProgress]: "Challenge in progress!",
  [ChallengeState.Resolved]: "Honour has been satisfied",
  [ChallengeState.Draw]: "Honour has not been satisfied",
}

export const ChallengeStateClasses = {
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


//------------------------------------------
// must be in sync with BLADES
// (action.cairo)
//
export enum Blades {
  Idle = 0,
  Fast = 0x10,
  Strong = 0x20,
  Block = 0x30,
}

export const BladesNames = {
  [Blades.Idle]: 'Idle',
  [Blades.Fast]: 'Fast Blow',
  [Blades.Strong]: 'Strong Blow',
  [Blades.Block]: 'Block',
}

export const BladesVerbs = {
  [Blades.Idle]: 'Stays',
  [Blades.Fast]: 'Strikes a',
  [Blades.Strong]: 'Strikes a',
  [Blades.Block]: 'Do a',
}

//-------------------------
// client stuff
//

export const makeDuelUrl = (duelId: bigint) => (`/duel/${bigintToHex(duelId)}`)

