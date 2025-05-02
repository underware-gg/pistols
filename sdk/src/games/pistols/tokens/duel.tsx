import {
  ArchetypeCardUrl,
  COLOR_SHADOW, COLOR_LIGHT, COLOR_DARK,
  card_cross,
  STAR, PISTOL,
  SvgRenderOptions,
  _packSvg,
  COLOR_TITLE,
} from './types'
import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { assets as uiAssets } from './assets/ui'
import { getAsset } from './assets'
import { getProfileDescription, getProfileKey, makeProfilePicUrl } from '../misc/profiles'
import * as constants from '../generated/constants'

export type DuelSvgProps = {
  // base_uri: string
  duel_id: BigNumberish
  duel_type: constants.DuelType
  premise: constants.Premise
  state: constants.ChallengeState
  winner: number
  season_id: number
  profile_type_a: constants.DuelistProfile
  profile_type_b: constants.DuelistProfile
  profile_id_a: number
  profile_id_b: number
  username_a: string
  username_b: string
  address_a: BigNumberish
  address_b: BigNumberish
  message: string
  // optional
  is_loading?: boolean
}

// paper size: 799w x 1072h
// resized:   805w x 1080h
const WIDTH = 805;
const HEIGHT = 1080;
const HALF_WIDTH = Math.floor(WIDTH / 2);
const HALF_HEIGHT = Math.floor(HEIGHT / 2);

const PROFILE_W = Math.floor(WIDTH * 0.45);
const PROFILE_H = PROFILE_W;
const PROFILE_Y = 130;
const PROFILE_GAP = Math.floor(HALF_WIDTH - PROFILE_W);
const PROFILE_X1 = PROFILE_GAP;
const PROFILE_X2 = Math.floor(HALF_WIDTH);
const MASK_SKEW = Math.floor(PROFILE_W * 0.2);

const TITLE_Y = 50;
const USERNAME_Y = 100;
const NAME_Y = USERNAME_Y + PROFILE_H + 70;
const NAME_X1 = PROFILE_GAP;
const NAME_X2 = (WIDTH - PROFILE_GAP);

const WEBSITE_Y = (HEIGHT * 0.97);


export const renderSvg = (props: DuelSvgProps, options: SvgRenderOptions = {}): string => {
  const profile_key_a = getProfileKey(props.profile_type_a, props.profile_id_a)
  const profile_key_b = getProfileKey(props.profile_type_b, props.profile_id_b)
  const profile_a = getProfileDescription(props.profile_type_a, profile_key_a)
  const profile_b = getProfileDescription(props.profile_type_b, profile_key_b)
  const is_finished = (props.state === constants.ChallengeState.Resolved || props.state === constants.ChallengeState.Draw);
  const is_dead_a = (is_finished && props.winner != 1);
  const is_dead_b = (is_finished && props.winner != 2);
  let image_duelist_a = makeProfilePicUrl(props.profile_id_a, props.profile_type_a)
  let image_duelist_b = makeProfilePicUrl(props.profile_id_b, props.profile_type_b)
  let image_paper = `/images/ui/duel_paper.png`
  let svg = `
<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 ${WIDTH} ${HEIGHT}'>
<style>
  text{
    fill:${COLOR_DARK};
    text-shadow:0.02rem 0.02rem 2px ${COLOR_SHADOW};
    font-size:28px;
    font-family:Garamond;
    dominant-baseline:middle;
    text-anchor:middle;
    stroke-width:1px;
    -webkit-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
  }
  .VS{
    font-size:50px;
  }
  .TITLE{
    fill:${COLOR_TITLE};
    // stroke:${COLOR_SHADOW};
    font-size:50px;
    font-weight:bold;
    font-variant-caps:small-caps;
    text-anchor:start;
  }
  .USERNAME{
    font-size:40px;
    font-style:italic;
    text-anchor:start;
  }
  .NAME{
    font-size:36px;
    font-weight:bold;
    font-variant-caps:small-caps;
    text-anchor:start;
  }
  .RIGHT{
    text-anchor:end;
  }
  .PROFILE {
    stroke:${COLOR_DARK};
    stroke-width:10px;
    fill:none;
  }
  .WEBSITE{
    font-size:20px;
    // font-family:monospace;
    // font-style:italic;
    // text-decoration:underline;
  }
  .dead{
    -webkit-filter:sepia(1);
    filter:sepia(1);
  }
</style>

// paper background
<image href='${getAsset(uiAssets, image_paper)}' x='0' y='0' width='${WIDTH}px' height='${HEIGHT}px'/>

// profiles
<mask id='mask1'>
  <path d='M${PROFILE_X1},${PROFILE_Y}h${PROFILE_W - MASK_SKEW}l${MASK_SKEW},${PROFILE_H}h-${PROFILE_W}z' fill='white'/>
</mask>
<mask id='mask2'>
  <path d='M${PROFILE_X2},${PROFILE_Y}h${PROFILE_W}v${PROFILE_H}h-${PROFILE_W - MASK_SKEW}z' fill='white'/>
</mask>
<image ${is_dead_a ? `class='dead'` : ''} href='${getAsset(profileAssets, image_duelist_a)}' x='${PROFILE_X1}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' mask='url(#mask1)'/>
<image ${is_dead_b ? `class='dead'` : ''} href='${getAsset(profileAssets, image_duelist_b)}' x='${PROFILE_X2}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' mask='url(#mask2)'/>
<path class='PROFILE' d='M${PROFILE_X1},${PROFILE_Y}h${PROFILE_W - MASK_SKEW}l${MASK_SKEW},${PROFILE_H}h-${PROFILE_W}z'/>
<path class='PROFILE' d='M${PROFILE_X2},${PROFILE_Y}h${PROFILE_W}v${PROFILE_H}h-${PROFILE_W - MASK_SKEW}z'/>
<text class='VS' x='${HALF_WIDTH}' y='${PROFILE_Y+PROFILE_H/2}'>
  vs
</text>
// cross
${is_dead_a && `<image href='${getAsset(cardsAssets, card_cross)}' x='${PROFILE_X1}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />`}
${is_dead_b && `<image href='${getAsset(cardsAssets, card_cross)}' x='${PROFILE_X2}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />`}

// usernames
<text class='TITLE' x='${NAME_X1}' y='${TITLE_Y}'>
  Duel #${props.duel_id}
</text>
<text class='TITLE RIGHT' x='${NAME_X2}' y='${TITLE_Y}'>
  Season ${props.season_id || '...'}
</text>

// usernames
<text class='USERNAME' x='${NAME_X1}' y='${USERNAME_Y}'>
  ${props.username_a}
</text>
<text class='USERNAME RIGHT' x='${NAME_X2}' y='${USERNAME_Y}'>
  ${props.username_b}
</text>

// profile names
<text class='NAME' x='${NAME_X1}' y='${NAME_Y}'>
  ${profile_a.name} #${props.profile_id_a}
</text>
<text class='NAME RIGHT' x='${NAME_X2}' y='${NAME_Y}'>
  ${profile_b.name} #${props.profile_id_b}
</text>


// pistols
<text class='WEBSITE' x='${HALF_WIDTH}' y='${WEBSITE_Y}'>
  pistols.gg
</text>

</svg>
`;
  return _packSvg(svg, options)
}
