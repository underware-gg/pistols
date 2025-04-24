import {
  DuelistHand,
  getPacesCardFromValue,
  getTacticsCardFromValue,
  getBladesCardFromValue,
} from '../generated/constants'

//------------------------------------------
// misc helpers
//

export const movesToHand = (moves: number[]): DuelistHand => {
  return {
    card_fire: getPacesCardFromValue(moves[0]),
    card_dodge: getPacesCardFromValue(moves[1]),
    card_tactics: getTacticsCardFromValue(moves[2]),
    card_blades: getBladesCardFromValue(moves[3]),
  }
}
