import {
  ArchetypeCardUrl,
  COLOR_SHADOW, COLOR_LIGHT, COLOR_DARK,
  renderDuelistImageUrl, card_cross,
  STAR, PISTOL,
  SvgRenderOptions,
  _getProfile, _packSvg,
  COLOR_TITLE,
} from './types'
import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { shortAddress } from 'src/utils/misc/types'
import { map } from 'src/utils/misc/math'
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
  // optional
  is_loading?: boolean
}

// card size: 1024w x 1434h
// resized:   771w x 1080h
const WIDTH = 771;
const HEIGHT = 1080;
const HALF_WIDTH = Math.floor(WIDTH / 2);
const HALF_HEIGHT = Math.floor(HEIGHT / 2);

const PROFILE_X = 125;
const PROFILE_Y = 100;
const PROFILE_W = 521;
const PROFILE_H = 521;

const SLOT_Y = (HEIGHT * 0.505);
const SLOT_X1 = (WIDTH * 0.11);
const SLOT_X2 = (WIDTH - SLOT_X1 - 0.02);

const FAME_Y = (HEIGHT * 0.63);
const BOX_Y = (HEIGHT * 0.66);
const BOX_W = (WIDTH * 0.6);
const BOX_H = 50;
const BOX_W_MIN = (BOX_H * 2);
const BOX_GAP = (WIDTH - BOX_W) / 2;

const USERNAME_Y = (HEIGHT * 0.74);

const STAT_W = (WIDTH * 0.35);
const STAT_H = 36;
const STAT_GAP = (WIDTH * 0.12);
const STAT1_Y = (HEIGHT * 0.77);
const STAT2_Y = (STAT1_Y + STAT_H);
const STAT3_Y = (STAT2_Y + STAT_H);
const STAT4_Y = (STAT3_Y + STAT_H);
const STAT5_Y = (STAT4_Y + STAT_H);

const WEBSITE_Y = (HEIGHT * 0.95);

const _renderStat = (x: number, y: number, key: string, value: string) => {
  return `
// <rect x='${x}' y='${y}' width='${STAT_W}' height='${STAT_H}' fill='none' stroke='${COLOR_SHADOW}'/>
<text class='KEY' x='${x}' y='${y + STAT_H / 2}'>
  ${key}
</text>
<text class='VALUE' x='${x + STAT_W}' y='${y + STAT_H / 2}'>
  ${value}
</text>
`
}

export const renderSvg = (props: DuelistSvgProps, options: SvgRenderOptions = {}): string => {
  const profile = _getProfile(props.profile_type, props.profile_id)
  const profile_url = renderDuelistImageUrl(props.profile_type, props.profile_id);
  const card_url = ArchetypeCardUrl[props.archetype];
  const life_bar_value = (props.fame % 1000);
  const is_alive = (props.lives > 0);
  const is_duelling = (BigInt(props.duel_id) > 0n);
  const state = props.is_memorized ? 'Memorized' : (is_alive ? 'Alive' : 'Dead');
  const total_losses = (props.total_losses + props.total_draws);
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' preserveAspectRatio='xMinYMin meet' viewBox='0 0 ${WIDTH} ${HEIGHT}'>
<style>
  text{
    fill:${COLOR_DARK};
    text-shadow:0.02rem 0.02rem 1px ${COLOR_SHADOW};
    font-size:28px;
    font-family:Garamond;
    text-anchor:middle;
    dominant-baseline:middle;
    text-decoration-thickness:1px;
    -webkit-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
  }
  .TITLE{
    font-size:50px;
    font-weight:bold;
    font-variant-caps:small-caps;
  }
  .HONOUR{
    fill:${COLOR_LIGHT};
    font-size:50px;
    font-weight:bold;
  }
  .LIFE{
    fill:${COLOR_LIGHT};
    // font-size:45px;
  }
  .WEBSITE{
    font-size:20px;
    // font-family:monospace;
    // font-style:italic;
    // text-decoration:underline;
  }
  .BAR {
    fill:${COLOR_TITLE};
    stroke:${COLOR_SHADOW};
  }
  .USERNAME{
    font-size:40px;
    font-style:italic;
  }
  .KEY{
    text-anchor:start;
    font-weight:bold;
  }
  .VALUE{
    text-anchor:end;
  }
  rect{
    dominant-baseline:middle;
  }
  .shadow {
    -webkit-filter:drop-shadow(0.2rem 0.2rem 3px ${COLOR_DARK});
    filter:drop-shadow(0.2rem 0.2rem 3px ${COLOR_DARK});
  }
  #circle{
    stroke:none;
    fill:none;
  }
</style>
<image href='${getAsset(profileAssets, profile_url)}' x='${PROFILE_X}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />
<image href='${getAsset(cardsAssets, card_url)}' x='0' y='0' width='${WIDTH}px' height='${HEIGHT}px' />

// name
<path id='circle' d='M${92},350a200,200 0 1,1 ${WIDTH - 92 - 92},0' />
<text class='TITLE'>
  <textPath startOffset='50%' xlink:href='#circle'>
  ${profile.name} #${props.duelist_id}
  </textPath>
</text>

// avoid flickering while loading
${(props.is_loading !== true) &&
`

// Dead duelist cross
${(!is_alive && props.is_memorized === false) &&
  `<image href='${getAsset(cardsAssets, card_cross)}' x='${PROFILE_X}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />`
}

// Honour slots
//<circle cx='${SLOT_X1}' cy='${SLOT_Y}' r='${WIDTH * 0.05}' fill='white' />
//<circle cx='${SLOT_X2}' cy='${SLOT_Y}' r='${WIDTH * 0.05}' fill='white' />
<text class='HONOUR' x='${SLOT_X1}' y='${SLOT_Y}'>
  ${props.honour > 0 ? (props.honour / 10).toFixed(1) : ''}
</text>
<text class='TITLE' x='${SLOT_X2}' y='${SLOT_Y}'>
  ${is_duelling ? PISTOL
    : props.archetype == constants.Archetype.Honourable ? '👑'
      : props.archetype == constants.Archetype.Trickster ? '🃏'
        : props.archetype == constants.Archetype.Villainous ? '👺'
          : ''
  }
</text>

// FAME
<text class='TITLE' x='${WIDTH / 2}' y='${FAME_Y}'>
  ${STAR} ${props.lives}
</text>
<rect class='shadow' x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W}' height='${BOX_H}' rx='10' fill='#2004'/>
${is_alive &&
`
<rect class='BAR' x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W_MIN + (life_bar_value == 0 ? (BOX_W - BOX_W_MIN) : map(life_bar_value, 0, 1000, 0, BOX_W - BOX_W_MIN))}' height='${BOX_H}' rx='10'/>
<rect class='shadow' x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W}' height='${BOX_H}' rx='10' fill='none' stroke='${COLOR_SHADOW}' stroke-width='2'/>
<text class='LIFE' x='${BOX_GAP + BOX_W_MIN / 2}' y='${BOX_Y + BOX_H / 2 + 5}'>
  ${life_bar_value != 0 ? `${Math.floor(life_bar_value / 10)}%` : ''}
</text>
`
}
<text class='LIFE' x='${BOX_GAP + BOX_W_MIN / 2}' y='${BOX_Y + BOX_H / 2 + 5}'>
  ${life_bar_value != 0 ? `${Math.floor(life_bar_value / 10)}%` : ''}
</text>

// PLAYER NAME
<text class='USERNAME' x='${HALF_WIDTH}' y='${USERNAME_Y}'>
  ~ ${props.username || 'Unknown Player'} ~
</text>

// STATS
${_renderStat(STAT_GAP, STAT1_Y, 'ID', `#${props.duelist_id}`)}
${_renderStat(STAT_GAP, STAT2_Y, 'Fame', `${props.fame}`)}
${_renderStat(STAT_GAP, STAT3_Y, 'State', state)}
${is_duelling
  ? _renderStat(STAT_GAP, STAT4_Y, 'Duel', `#${props.duel_id.toString()}`)
  : _renderStat(STAT_GAP, STAT4_Y, 'Dueling', `No`)
}
${_renderStat(STAT_GAP, STAT5_Y, 'Player', shortAddress(BigInt(props.owner)))}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT1_Y, 'Duels', `${props.total_duels || '-'}`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT2_Y, 'Wins', props.total_wins == 0 ? '-' : `${props.total_wins} (${Math.floor((props.total_wins / props.total_duels) * 100)}%)`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT3_Y, 'Losses', total_losses == 0 ? '-' : `${(total_losses)} (${Math.floor(((total_losses) / props.total_duels) * 100)}%)`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT4_Y, 'Honour', `${(props.honour / 10).toFixed(1)}`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT5_Y, props.archetype != constants.Archetype.Undefined ? `${props.archetype}` : '', '')}

// pistols
<text class='WEBSITE' x='${HALF_WIDTH}' y='${WEBSITE_Y}'>
  pistols.gg
</text>


` // props.is_loading
}

</svg>
`;
  // svg = svg.map('\n', '');
  return _packSvg(svg, options)
}
