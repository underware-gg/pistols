import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { renderDuelistImageUrl } from './duelist'
import { SvgRenderOptions, _packSvg } from './types'
import { getAsset } from './assets'
import * as constants from '../generated/constants'

export type DuelSvgProps = {
  // base_uri: string
  duel_id: BigNumberish
  table_id: string
  premise: constants.Premise
  quote: string
  state: constants.ChallengeState
  winner: number
  profile_type_a: constants.ProfileType
  profile_id_a: number
  profile_type_b: constants.ProfileType
  profile_id_b: number
  // optional
  is_loading?: boolean
}

export const renderSvg = (props: DuelSvgProps, options: SvgRenderOptions = {}): string => {
  let image_duelist_a = renderDuelistImageUrl(props.profile_type_a, props.profile_id_a)
  let image_duelist_b = renderDuelistImageUrl(props.profile_type_b, props.profile_id_b)
  let image_border = `/textures/cards/card_wide_brown.png`
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1942 1024'>` +
    `<image href='${getAsset(profileAssets, image_duelist_a)}' x='0' y='50' width='560px' height='924px' />` +
    `<image href='${getAsset(profileAssets, image_duelist_b)}' x='1380' y='50' width='560px' height='924px' />` +
    `<image href='${getAsset(cardsAssets, image_border)}' x='0' y='0' width='1942px' height='1024px' />` +
    `</svg>`;
  return _packSvg(svg, options)
}
