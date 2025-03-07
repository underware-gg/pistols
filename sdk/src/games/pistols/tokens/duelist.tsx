import { BigNumberish } from 'starknet'

export type DuelistSvgProps = {
  duelist_id: BigNumberish
  base_uri: string
  profile_type: string
  profile_id: string
}

export const renderDuelistImageUrl = (base_uri: string, variant: string, profile_type: string, profile_id: string): string => {
  return `${base_uri}/profiles/${profile_type}/${variant}/${('00' + profile_id).slice(-2)}.jpg`
}

export const renderSvg = (props: DuelistSvgProps): string => {
  let image_square = renderDuelistImageUrl(props.base_uri, 'square', props.profile_type, props.profile_id)
  let image_border = `${props.base_uri}/textures/cards/card_front_brown.png`
  let svg =
    `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 1024 1434'>` +
    `<image href='${image_square}' x='0' y='0' width='1024px' height='1024px' />` +
    `<image href='${image_border}' x='0' y='0' width='1024px' height='1434px' />` +
    `</svg>`;
  return `data:image/svg+xml,${svg}`
}
