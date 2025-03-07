import { BigNumberish } from 'starknet'
import { renderDuelistImageUrl } from './duelist'

export type DuelSvgProps = {
  duel_id: BigNumberish
  base_uri: string
  profile_type_a: string
  profile_id_a: string
  profile_type_b: string
  profile_id_b: string
}

export const renderSvg = (props: DuelSvgProps): string => {
  let image_duelist_a = renderDuelistImageUrl(props.base_uri, 'portrait', props.profile_type_a, props.profile_id_a)
  let image_duelist_b = renderDuelistImageUrl(props.base_uri, 'portrait', props.profile_type_b, props.profile_id_b)
  let image_border = `${props.base_uri}/textures/cards/card_wide_brown.png`
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1942 1024'>` +
    `<image href='${image_duelist_a}' x='0' y='50' width='560px' height='924px' />` +
    `<image href='${image_duelist_b}' x='1380' y='50' width='560px' height='924px' />` +
    `<image href='${image_border}' x='0' y='0' width='1942px' height='1024px' />` +
    `</svg>`;
  return `data:image/svg+xml,${svg}`
}
