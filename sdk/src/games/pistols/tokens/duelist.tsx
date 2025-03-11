import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/profiles'
import { assets as cardsAssets } from './assets/cards'
import { SvgRenderOptions, _packSvg } from './types'
import { getAsset } from './assets'
import * as constants from '../generated/constants'
import { map } from 'src/utils/misc/math'
import { shortAddress } from 'src/exports/utils'

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

// card size: 1024w x 1434h
// resized:   771w x 1080h
const WIDTH = 771;
const HEIGHT = 1080;
const HALF_WIDTH = Math.floor(WIDTH / 2);
const HALF_HEIGHT = Math.floor(HEIGHT / 2);

const SLOT_Y = (HEIGHT * 0.505);
const SLOT_X1 = (WIDTH * 0.11);
const SLOT_X2 = (WIDTH - SLOT_X1);

const FAME_Y = (HEIGHT * 0.64);
const BOX_Y = (HEIGHT * 0.68);
const BOX_W = (WIDTH * 0.6);
const BOX_H = 50;
const BOX_W_MIN = (BOX_H * 2);
const BOX_GAP = (WIDTH - BOX_W) / 2;

const USERNAME_Y = (HEIGHT * 0.76);

const STAT_W = (WIDTH * 0.35);
const STAT_H = 36;
const STAT_GAP = (WIDTH * 0.12);
const STAT1_Y = (HEIGHT * 0.785);
const STAT2_Y = (STAT1_Y + STAT_H);
const STAT3_Y = (STAT2_Y + STAT_H);
const STAT4_Y = (STAT3_Y + STAT_H);
const STAT5_Y = (STAT4_Y + STAT_H);

const STAR = '&#11088;' // ⭐️

// const card_square_url = `/textures/cards/card_front_brown.png`
const ArchetypeCardUrl: Record<constants.Archetype, string> = {
  [constants.Archetype.Honourable]: `/textures/cards/card_circular_honourable.png`,
  [constants.Archetype.Trickster]: `/textures/cards/card_circular_trickster.png`,
  [constants.Archetype.Villainous]: `/textures/cards/card_circular_villainous.png`,
  [constants.Archetype.Undefined]: `/textures/cards/card_circular_neutral.png`,
}

export const ProfileTypeFolder: Record<constants.ProfileType, string> = {
  [constants.ProfileType.Undefined]: 'duelists',
  [constants.ProfileType.Duelist]: 'duelists',
  [constants.ProfileType.Character]: 'characters',
  [constants.ProfileType.Bot]: 'bots',
}

export const renderDuelistImageUrl = (profile_type: constants.ProfileType, profile_id: number): string => {
  const folder = ProfileTypeFolder[profile_type];
  return `/profiles/${folder}/${('00' + profile_id.toString()).slice(-2)}.jpg`;
}

const _getProfile = (profile_type: constants.ProfileType, profile_id: number) => {
  switch (profile_type) {
    case constants.ProfileType.Duelist:
      return constants.DUELIST_PROFILES[constants.getDuelistProfileFromValue(profile_id)]
    case constants.ProfileType.Character:
      return constants.CHARACTER_PROFILES[constants.getCharacterProfileFromValue(profile_id)]
    case constants.ProfileType.Bot:
      return constants.BOT_PROFILES[constants.getBotProfileFromValue(profile_id)]
  }
  return constants.DUELIST_PROFILES[constants.getDuelistProfileFromValue(0)]
}

const _renderStat = (x: number, y: number, key: string, value: string) => {
  return `
// <rect x='${x}' y='${y}' width='${STAT_W}' height='${STAT_H}' fill='none' stroke='#2008'/>
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
  const life = (props.fame % 1000);
  const state = props.is_memorized ? 'Memorized' : (props.lives > 0) ? 'Alive' : 'Dead';
  const total_losses = (props.total_losses + props.total_draws);
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' preserveAspectRatio='xMinYMin meet' viewBox='0 0 ${WIDTH} ${HEIGHT}'>
<style>
  text{
    fill:#200;
    text-shadow:0.05rem 0.05rem 2px #2008;
    font-size:28px;
    font-family:Garamond;
    dominant-baseline:middle;
    text-anchor:middle;
    -webkit-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
  }
  .TITLE{
    font-size:60px;
    font-weight:bold;
    font-variant-caps:small-caps;
  }
  .HONOUR{
    font-size:50px;
    font-weight:bold;
    fill:#fffc;
  }
  .LIFE{
    // font-size:45px;
    fill:#fff8;
  }
  .USERNAME{
    font-size:40px;
    text-shadow:0.02rem 0.02rem 1px #2008;
    font-style:italic;
  }
  .KEY{
    text-anchor:start;
    text-shadow:0.02rem 0.02rem 1px #2008;
    font-weight:bold;
  }
  .VALUE{
    text-anchor:end;
    text-shadow:0.02rem 0.02rem 1px #2008;
  }
  rect{
    dominant-baseline:middle;
  }
  .shadow {
    -webkit-filter:drop-shadow(0.2rem 0.2rem 3px #200);
    filter:drop-shadow(0.2rem 0.2rem 3px #200);
  }
  #circle{
    stroke:none;
    fill:none;
  }
</style>
<image href='${getAsset(profileAssets, profile_url)}' x='125' y='100' width='521px' height='521px' />
<image href='${getAsset(cardsAssets, card_url)}' x='0' y='0' width='${WIDTH}px' height='${HEIGHT}px' />

// name
<path id='circle' d='M${92},350a200,200 0 1,1 ${WIDTH - 92 - 92},0' />
<text class='TITLE'>
  <textPath startOffset='50%' xlink:href='#circle'>
  ${profile.name}
  </textPath>
</text>

// Honour slots
//<circle cx='${SLOT_X1}' cy='${SLOT_Y}' r='${WIDTH * 0.05}' fill='white' />
//<circle cx='${SLOT_X2}' cy='${SLOT_Y}' r='${WIDTH * 0.05}' fill='white' />
<text class='HONOUR' x='${SLOT_X1}' y='${SLOT_Y}'>
  ${props.honour > 0 ? (props.honour / 10).toFixed(1) : ''}
</text>
<text class='TITLE' x='${SLOT_X2}' y='${SLOT_Y}'>
  ${props.archetype == constants.Archetype.Honourable ? '👑' : props.archetype == constants.Archetype.Trickster ? '🃏' : props.archetype == constants.Archetype.Villainous ? '👺' : ''}
</text>

// FAME
<text class='TITLE' x='${WIDTH / 2}' y='${FAME_Y}'>
  ${STAR} ${Math.floor(props.fame / 1000)}
</text>
<rect class='shadow' x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W}' height='${BOX_H}' rx='10' fill='#2004' />
<rect x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W_MIN + (life == 0 ? (BOX_W - BOX_W_MIN) : map(props.fame % 1000, 0, 1000, 0, BOX_W - BOX_W_MIN))}' height='${BOX_H}' rx='10' fill='#d9924c' stroke='#2008'/>
<rect class='shadow' x='${BOX_GAP}' y='${BOX_Y}' width='${BOX_W}' height='${BOX_H}' rx='10' fill='none' stroke='#2008' stroke-width='2' />
<text class='LIFE' x='${BOX_GAP + BOX_W_MIN / 2}' y='${BOX_Y + BOX_H / 2 + 5}'>
  ${life != 0 ? `${Math.floor(life / 10)}%` : ''}
</text>

// STATS
${_renderStat(STAT_GAP, STAT1_Y, 'ID', `#${props.duelist_id}`)}
${_renderStat(STAT_GAP, STAT2_Y, 'Fame', `${props.fame}`)}
${_renderStat(STAT_GAP, STAT3_Y, 'State', state)}
${BigInt(props.duel_id) > 0n
  ? _renderStat(STAT_GAP, STAT4_Y, 'Duel', `#${props.duel_id.toString()}`)
  : _renderStat(STAT_GAP, STAT4_Y, 'Dueling', `No`)
}
${_renderStat(STAT_GAP, STAT5_Y, 'Owner', shortAddress(BigInt(props.owner)))}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT1_Y, 'Duels', `${props.total_duels || '-'}`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT2_Y, 'Wins', props.total_wins == 0 ? '-' : `${props.total_wins} (${Math.floor((props.total_wins / props.total_duels) * 100)}%)`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT3_Y, 'Losses', total_losses == 0 ? '-' : `${(total_losses)} (${Math.floor(((total_losses) / props.total_duels) * 100)}%)`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT4_Y, 'Honour', `${(props.honour / 10).toFixed(1)}`)}
${_renderStat(WIDTH - STAT_GAP - STAT_W, STAT5_Y, props.archetype != constants.Archetype.Undefined ? `${props.archetype}` : '', '')}

<text class='USERNAME' x='${HALF_WIDTH}' y='${USERNAME_Y}'>
  ~ ${props.username || 'Unknown'} ~
</text>
</svg>
`;
  // svg = svg.map('\n', '');
  return _packSvg(svg, options)
}
