
//
// must be in sync with challenge.cairo
//
export enum ChallengeState {
  Null,
  Awaiting,
  Canceled,
  Refused,
  Expired,
  InProgress,
  Resolved,
  Draw,
}

export const ChallengeStateNames = {
  [ChallengeState.Null]: 'Null',
  [ChallengeState.Awaiting]: 'Awaiting',
  [ChallengeState.Canceled]: 'Canceled',
  [ChallengeState.Refused]: 'Refused',
  [ChallengeState.Expired]: 'Expired',
  [ChallengeState.InProgress]: 'InProgress',
  [ChallengeState.Resolved]: 'Resolved',
  [ChallengeState.Draw]: 'Draw',
}
