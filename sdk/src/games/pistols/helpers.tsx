import { BigNumberish } from 'starknet'
import { bigintToHex } from 'src/exports/utils'
import {
  DuelistHand,
  getPacesCardFromValue,
  getTacticsCardFromValue,
  getBladesCardFromValue,
  ProfileType,
  ProfileDescription,
  DuelistProfile,
  CharacterProfile,
  BotProfile,
  DUELIST_PROFILES,
  CHARACTER_PROFILES,
  BOT_PROFILES,
  PROFILES,
} from './generated/constants'

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


//------------------------------------------
// (profile_type.cairo)
//

export const getProfileDescription = (profileType: ProfileType, profileValue: DuelistProfile|CharacterProfile|BotProfile): ProfileDescription => {
  switch (profileType) {
    case ProfileType.Duelist:   return DUELIST_PROFILES[profileValue as DuelistProfile]
    case ProfileType.Character: return CHARACTER_PROFILES[profileValue as CharacterProfile]
    case ProfileType.Bot:       return BOT_PROFILES[profileValue as BotProfile]
    default:                    return DUELIST_PROFILES[DuelistProfile.Unknown]
  }
}

export const makeCharacterDuelistId = (profileType: ProfileType, profileValue: DuelistProfile | CharacterProfile | BotProfile): BigNumberish => {
  const _baseId = (profileType: ProfileType): bigint => {
    switch (profileType) {
      case ProfileType.Duelist:   return PROFILES.DUELIST_ID_BASE
      case ProfileType.Character: return PROFILES.CHARACTER_ID_BASE
      case ProfileType.Bot:       return PROFILES.BOT_ID_BASE
      default:                    return PROFILES.UNDEFINED_ID_BASE
    }
  }
  const profileId = getProfileDescription(profileType, profileValue).profile_id
  return bigintToHex((_baseId(profileType) | BigInt(profileId ?? 0)))
}
