import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { SvgRenderOptions, _packSvg } from './types'
import { getAsset } from './assets'
import * as constants from '../generated/constants'

export type DuelistSvgProps = {
  // base_uri: string
  duelist_id: BigNumberish
  owner: BigNumberish
  username: string
  honour: number
  archetype: constants.Archetype
  profile_type: constants.ProfileType
  profile_id: number
  total_duels: number
  total_wins: number
  total_losses: number
  total_draws: number
  fame: number
  lives: number
  is_memorized: boolean
  duel_id: BigNumberish
}

export const ProfileTypeFolder: Record<constants.ProfileType, string> = {
  [constants.ProfileType.Undefined]: 'duelists',
  [constants.ProfileType.Duelist]: 'duelists',
  [constants.ProfileType.Character]: 'characters',
  [constants.ProfileType.Bot]: 'bots',
}

export const renderDuelistImageUrl = (variant: string, profile_type: constants.ProfileType, profile_id: number): string => {
  const folder = ProfileTypeFolder[profile_type]
  return `/profiles/${folder}/${variant}/${('00' + profile_id.toString()).slice(-2)}.jpg`
}

export const renderSvg = (props: DuelistSvgProps, options: SvgRenderOptions = {}): string => {
  let profile_url = renderDuelistImageUrl('square', props.profile_type, props.profile_id)
  let card_url = `/textures/cards/card_front_brown.png`
  let svg =
    // `<?xml version='1.0' encoding='UTF-8' standalone='no'?>` +
    // `<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN' 'http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'>` +
    `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'>` +
    `<image href='${getAsset(profileAssets, profile_url)}' x='0' y='0' width='1024px' height='1024px' />` +
    `<image href='${getAsset(cardsAssets, card_url)}' x='0' y='0' width='1024px' height='1434px' />` +
    `</svg>`;
  return _packSvg(svg, options)
}
