
//
// must be in sync with challenge.cairo
// (CHALLENGE_STATE)
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
  [ChallengeState.Null]: 'Challenge does not exist',
  [ChallengeState.Awaiting]: 'Awaiting for Challenged\'s reply',
  [ChallengeState.Withdrawn]: 'Cowardly withdrawn by Challenger',
  [ChallengeState.Refused]: 'Cowardly refused by Challenged',
  [ChallengeState.Expired]: 'Challenge expired',
  [ChallengeState.InProgress]: 'Challenge in progress!',
  [ChallengeState.Resolved]: 'Honor has been satisfied',
  [ChallengeState.Draw]: 'Honor has not been satisfied',
}
