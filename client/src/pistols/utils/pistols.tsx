import { bigintToHex } from "./utils"


//------------------------------------------
// must be in sync with CONSTANTS
// (constants.cairo)
//
export const ROUND_COUNT = 2
export const FULL_HONOUR = 100
export const FULL_HEALTH = 100
export const HALF_HEALTH = 50


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
// (blades.cairo)
//
export enum Blades {
  Null,
  Light,
  Heavy,
  Block,
}

export const BladesNames = {
  [Blades.Null]: 'Null',
  [Blades.Light]: 'Light',
  [Blades.Heavy]: 'Heavy',
  [Blades.Block]: 'Block',
}

//-------------------------
// client stuff
//

export const makeDuelUrl = (duelId: bigint) => (`/duel/${bigintToHex(duelId)}`)

