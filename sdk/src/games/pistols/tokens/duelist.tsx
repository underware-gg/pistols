import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { getAsset } from './assets'
import * as constants from '../generated/constants'

export type DuelistSvgProps = {
  duelist_id: BigNumberish
  base_uri: string
  profile_type: string
  profile_id: string
}

export const renderDuelistImageUrl = (variant: string, profile_type: string, profile_id: string): string => {
  return `/profiles/${profile_type}/${variant}/${('00' + profile_id).slice(-2)}.jpg`
}

export const renderSvg = (props: DuelistSvgProps): string => {
  let profile_url = renderDuelistImageUrl('square', props.profile_type, props.profile_id)
  let card_url = `/textures/cards/card_front_brown.png`
  let svg =
    // `<?xml version='1.0' encoding='UTF-8' standalone='no'?>` +
    // `<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN' 'http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'>` +
    `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'>` +
    `<image href='${getAsset(profileAssets, profile_url)}' x='0' y='0' width='1024px' height='1024px' />` +
    `<image href='${getAsset(cardsAssets, card_url)}' x='0' y='0' width='1024px' height='1434px' />` +
    `</svg>`;
  return `data:image/svg+xml,${svg}`
}
