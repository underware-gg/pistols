import {
  COLOR_SHADOW, COLOR_DARK,
  card_cross,
  SvgRenderOptions,
  encodeSvg,
  COLOR_TITLE,
} from './types'
import { BigNumberish } from 'starknet'
import { assets as profileAssets } from './assets/generated/profiles'
import { assets as cardsAssets } from './assets/generated/cards'
import { assets as uiAssets } from './assets/generated/ui'
import { getAsset } from './assets/assets'
import { getProfileDescriptor, getProfileKey, makeProfilePicUrl } from '../misc/profiles'
import * as constants from '../generated/constants'

export type DuelSvgProps = {
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
  is_loading?: boolean
}

// paper size: 799w x 1072h -> resized: 805w x 1080h
const WIDTH = 805;
const HEIGHT = 1080;
const HALF_WIDTH = Math.floor(WIDTH / 2);

const PROFILE_W = Math.floor(WIDTH * 0.45); // 362
const PROFILE_H = PROFILE_W; // 362
const PROFILE_Y = 152;
const PROFILE_GAP = Math.floor(HALF_WIDTH - PROFILE_W); // ~40
const PROFILE_X1 = PROFILE_GAP;
const PROFILE_X2 = Math.floor(HALF_WIDTH);
const MASK_SKEW = Math.floor(PROFILE_W * 0.2);

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDuelTypePremiseLabel = (duelType: constants.DuelType): string => {
  if (!duelType || duelType === constants.DuelType.Undefined) return 'DUEL';
  if (duelType === constants.DuelType.BotPlayer) return 'BOT DUEL';
  return `${duelType.toUpperCase()} DUEL`;
};

const formatPremisePhrase = (premise: constants.Premise | string): string => {
  if (!premise || premise === constants.Premise.Undefined || premise === 'Undefined') return 'to defend their honour';
  const desc = constants.PREMISES[premise as constants.Premise];
  if (desc && desc.prefix) return desc.prefix;
  return `for ${premise}`;
};

export const renderSvg = async (props: DuelSvgProps, options: SvgRenderOptions = {}): Promise<string> => {
  const profile_key_a = getProfileKey(props.profile_type_a, props.profile_id_a)
  const profile_key_b = getProfileKey(props.profile_type_b, props.profile_id_b)
  const profile_a = getProfileDescriptor(props.profile_type_a, profile_key_a)
  const profile_b = getProfileDescriptor(props.profile_type_b, profile_key_b)

  const is_resolved = props.state === constants.ChallengeState.Resolved;
  const is_draw = props.state === constants.ChallengeState.Draw || (is_resolved && props.winner === 0);
  const is_finished = is_resolved || props.state === constants.ChallengeState.Draw;

  const is_dead_a = is_finished && props.winner !== 1;
  const is_dead_b = is_finished && props.winner !== 2;

  const username_a = props.username_a || profile_a.name || 'Challenger';
  const username_b = props.username_b || profile_b.name || 'Challenged';

  let image_duelist_a = makeProfilePicUrl(props.profile_id_a, props.profile_type_a)
  let image_duelist_b = makeProfilePicUrl(props.profile_id_b, props.profile_type_b)
  let image_paper = `/images/ui/duel_paper.png`

  // Results text logic
  let outcomeHeader = '★  OUTCOME  ★';
  let outcomeTitle = 'DUEL IN PROGRESS';
  let outcomeSubtitle = 'The duelists have taken their paces';
  let outcomeBadgeColor = '#8c2210';

  if (is_finished) {
    if (is_draw) {
      outcomeHeader = '⚔  HONOURABLE DRAW  ⚔';
      outcomeTitle = 'MUTUAL DEFEAT';
      outcomeSubtitle = 'Neither duelist survived the dawn';
      outcomeBadgeColor = '#5c3818';
    } else if (props.winner === 1) {
      outcomeHeader = '★  VICTORIOUS  ★';
      outcomeTitle = escapeXml(username_a).toUpperCase();
      outcomeSubtitle = `Defeated ${escapeXml(username_b)} in mortal combat`;
      outcomeBadgeColor = '#8c2210';
    } else if (props.winner === 2) {
      outcomeHeader = '★  VICTORIOUS  ★';
      outcomeTitle = escapeXml(username_b).toUpperCase();
      outcomeSubtitle = `Defeated ${escapeXml(username_a)} in mortal combat`;
      outcomeBadgeColor = '#8c2210';
    }
  } else if (props.state === constants.ChallengeState.Awaiting) {
    outcomeHeader = '📜  CHALLENGE ISSUED  📜';
    outcomeTitle = 'AWAITING DUEL';
    outcomeSubtitle = 'Awaiting acceptance of the challenge';
    outcomeBadgeColor = '#6b4c1b';
  } else if (props.state === constants.ChallengeState.Expired) {
    outcomeHeader = '⏳  CHALLENGE EXPIRED  ⏳';
    outcomeTitle = 'DUEL EXPIRED';
    outcomeSubtitle = 'The appointed hour has passed';
    outcomeBadgeColor = '#5c3818';
  } else if (props.state === constants.ChallengeState.Withdrawn || props.state === constants.ChallengeState.Refused) {
    outcomeHeader = '⚔  CHALLENGE VOID  ⚔';
    outcomeTitle = props.state === constants.ChallengeState.Withdrawn ? 'WITHDRAWN' : 'REFUSED';
    outcomeSubtitle = 'The duel will not take place';
    outcomeBadgeColor = '#5c3818';
  }

  const seasonText = props.season_id ? `SEASON ${props.season_id}` : 'SEASON —';
  const premiseLabel = formatDuelTypePremiseLabel(props.duel_type);
  const premisePhrase = formatPremisePhrase(props.premise);
  const rawMessage = (props.message || '').trim();
  const hasMessage = rawMessage.length > 0;
  const escapedMessage = escapeXml(rawMessage);

  // Dynamic layout positioning for result card, premise & message
  const resultCardY = 585;
  const resultCardH = 185;
  const divider2Y = 800;
  const premiseY = hasMessage ? 840 : 855;
  const messageY = 945;

  // Title font size adjustment for longer winner names
  const outcomeTitleFontSize = outcomeTitle.length > 18 ? 38 : outcomeTitle.length > 13 ? 44 : 50;

  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 ${WIDTH} ${HEIGHT}'>
<style>
  text{
    fill:${COLOR_DARK};
    text-shadow:0.02rem 0.02rem 2px ${COLOR_SHADOW};
    font-family:Garamond, "Times New Roman", Georgia, serif;
    dominant-baseline:middle;
    text-anchor:middle;
    stroke-width:1px;
    -webkit-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
  }
  .DUEL_TITLE{
    fill:${COLOR_TITLE};
    font-size:50px;
    font-weight:bold;
    font-variant-caps:small-caps;
    letter-spacing:2px;
  }
  .SEASON_HEADER{
    font-size:22px;
    font-weight:bold;
    letter-spacing:4px;
    fill:#4a2c16;
  }
  .USERNAME{
    font-size:28px;
    font-weight:bold;
    font-style:italic;
    fill:${COLOR_DARK};
  }
  .NAME{
    font-size:26px;
    font-weight:bold;
    font-variant-caps:small-caps;
    fill:#4a2612;
  }
  .LEFT{
    text-anchor:start;
  }
  .RIGHT{
    text-anchor:end;
  }
  .VS_TEXT{
    font-size:38px;
    font-weight:bold;
    font-style:italic;
    fill:${COLOR_DARK};
  }
  .PROFILE{
    stroke:${COLOR_DARK};
    stroke-width:8px;
    fill:none;
  }
  .OUTCOME_HEADER{
    font-size:20px;
    font-weight:bold;
    letter-spacing:5px;
  }
  .OUTCOME_TITLE{
    font-size:${outcomeTitleFontSize}px;
    font-weight:bold;
    font-variant-caps:small-caps;
    letter-spacing:2px;
  }
  .OUTCOME_SUBTITLE{
    font-size:22px;
    font-style:italic;
    fill:#4a2612;
  }
  .PREMISE_LABEL{
    font-size:18px;
    font-weight:bold;
    letter-spacing:4px;
    fill:#7a441e;
  }
  .PREMISE_TEXT{
    font-size:30px;
    font-weight:bold;
    font-style:italic;
    fill:${COLOR_DARK};
  }
  .MESSAGE_TEXT{
    font-size:22px;
    font-style:italic;
    fill:#3d200e;
  }
  .FOOTER{
    font-size:18px;
    font-weight:bold;
    letter-spacing:3px;
    fill:#5c3519;
  }
  .dead{
    -webkit-filter:sepia(1) grayscale(0.5);
    filter:sepia(1) grayscale(0.5);
  }
</style>

// paper background
<image href='${await getAsset(uiAssets, image_paper)}' x='0' y='0' width='${WIDTH}px' height='${HEIGHT}px'/>

// vintage ornate outer border
<rect x='22' y='22' width='${WIDTH - 44}' height='${HEIGHT - 44}' fill='none' stroke='#4a2612' stroke-width='2' opacity='0.75'/>
<rect x='28' y='28' width='${WIDTH - 56}' height='${HEIGHT - 56}' fill='none' stroke='#4a2612' stroke-width='1' stroke-dasharray='6,4' opacity='0.6'/>

// corner ornaments
<path d='M22,45 L45,22 M22,22 L50,22 M22,22 L22,50' stroke='#4a2612' stroke-width='2' fill='none' opacity='0.8'/>
<path d='M${WIDTH - 22},45 L${WIDTH - 45},22 M${WIDTH - 22},22 L${WIDTH - 50},22 M${WIDTH - 22},22 L${WIDTH - 22},50' stroke='#4a2612' stroke-width='2' fill='none' opacity='0.8'/>
<path d='M22,${HEIGHT - 45} L45,${HEIGHT - 22} M22,${HEIGHT - 22} L50,${HEIGHT - 22} M22,${HEIGHT - 22} L22,${HEIGHT - 50}' stroke='#4a2612' stroke-width='2' fill='none' opacity='0.8'/>
<path d='M${WIDTH - 22},${HEIGHT - 45} L${WIDTH - 45},${HEIGHT - 22} M${WIDTH - 22},${HEIGHT - 22} L${WIDTH - 50},${HEIGHT - 22} M${WIDTH - 22},${HEIGHT - 22} L${WIDTH - 22},${HEIGHT - 50}' stroke='#4a2612' stroke-width='2' fill='none' opacity='0.8'/>

// top header
<text class='DUEL_TITLE' x='${HALF_WIDTH}' y='76'>
  DUEL #${props.duel_id}
</text>
<text class='SEASON_HEADER' x='${HALF_WIDTH}' y='110'>
  ${seasonText}
</text>

// usernames above portraits
<text class='USERNAME LEFT' x='${PROFILE_X1}' y='138'>
  ${escapeXml(username_a)}
</text>
<text class='USERNAME RIGHT' x='${WIDTH - PROFILE_X1}' y='138'>
  ${escapeXml(username_b)}
</text>

// profiles
<mask id='duel_mask1'>
  <path d='M${PROFILE_X1},${PROFILE_Y}h${PROFILE_W - MASK_SKEW}l${MASK_SKEW},${PROFILE_H}h-${PROFILE_W}z' fill='white'/>
</mask>
<mask id='duel_mask2'>
  <path d='M${PROFILE_X2},${PROFILE_Y}h${PROFILE_W}v${PROFILE_H}h-${PROFILE_W - MASK_SKEW}z' fill='white'/>
</mask>
<image ${is_dead_a ? `class='dead'` : ''} href='${await getAsset(profileAssets, image_duelist_a)}' x='${PROFILE_X1}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' mask='url(#duel_mask1)'/>
<image ${is_dead_b ? `class='dead'` : ''} href='${await getAsset(profileAssets, image_duelist_b)}' x='${PROFILE_X2}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' mask='url(#duel_mask2)'/>
<path class='PROFILE' d='M${PROFILE_X1},${PROFILE_Y}h${PROFILE_W - MASK_SKEW}l${MASK_SKEW},${PROFILE_H}h-${PROFILE_W}z'/>
<path class='PROFILE' d='M${PROFILE_X2},${PROFILE_Y}h${PROFILE_W}v${PROFILE_H}h-${PROFILE_W - MASK_SKEW}z'/>

// dead crosses
${is_dead_a ? `<image href='${await getAsset(cardsAssets, card_cross)}' x='${PROFILE_X1}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />` : ''}
${is_dead_b ? `<image href='${await getAsset(cardsAssets, card_cross)}' x='${PROFILE_X2}' y='${PROFILE_Y}' width='${PROFILE_W}px' height='${PROFILE_H}px' />` : ''}

// center VS medallion
<circle cx='${HALF_WIDTH}' cy='${PROFILE_Y + PROFILE_H / 2}' r='34' fill='#f7edd9' stroke='#3d1d0c' stroke-width='4'/>
<circle cx='${HALF_WIDTH}' cy='${PROFILE_Y + PROFILE_H / 2}' r='28' fill='none' stroke='#8c2210' stroke-width='1.5' stroke-dasharray='4,2'/>
<text class='VS_TEXT' x='${HALF_WIDTH}' y='${PROFILE_Y + PROFILE_H / 2 + 1}'>
  vs
</text>

// profile names below portraits
<text class='NAME LEFT' x='${PROFILE_X1}' y='${PROFILE_Y + PROFILE_H + 24}'>
  ${escapeXml(profile_a.name)} #${props.profile_id_a}
</text>
<text class='NAME RIGHT' x='${WIDTH - PROFILE_X1}' y='${PROFILE_Y + PROFILE_H + 24}'>
  ${escapeXml(profile_b.name)} #${props.profile_id_b}
</text>

// decorative divider 1
<path d='M50,555 L340,555 M360,555 L380,555 M402.5,548 L409,555 L402.5,562 L396,555 Z M425,555 L445,555 M465,555 L755,555' stroke='#4a2612' stroke-width='2' fill='#8c2210'/>

// results section card
<rect x='45' y='${resultCardY}' width='${WIDTH - 90}' height='${resultCardH}' rx='8' fill='#2b1408' fill-opacity='0.05' stroke='#4a2612' stroke-width='2' stroke-dasharray='10,5'/>
<rect x='52' y='${resultCardY + 7}' width='${WIDTH - 104}' height='${resultCardH - 14}' rx='5' fill='none' stroke='#4a2612' stroke-width='1' opacity='0.4'/>

// outcome header badge
<text class='OUTCOME_HEADER' style='fill:${outcomeBadgeColor};' x='${HALF_WIDTH}' y='${resultCardY + 38}'>
  ${outcomeHeader}
</text>

// outcome title (winner or draw)
<text class='OUTCOME_TITLE' style='fill:${is_finished && !is_draw ? COLOR_TITLE : COLOR_DARK};' x='${HALF_WIDTH}' y='${resultCardY + 92}'>
  ${outcomeTitle}
</text>

// outcome subtitle
<text class='OUTCOME_SUBTITLE' x='${HALF_WIDTH}' y='${resultCardY + 142}'>
  ${outcomeSubtitle}
</text>

// decorative divider 2
<path d='M80,${divider2Y} L350,${divider2Y} M402.5,${divider2Y - 6} L408,${divider2Y} L402.5,${divider2Y + 6} L397,${divider2Y} Z M455,${divider2Y} L725,${divider2Y}' stroke='#4a2612' stroke-width='1.5' fill='#8c2210'/>

// premise section
<text class='PREMISE_LABEL' x='${HALF_WIDTH}' y='${premiseY}'>
  — ${premiseLabel} —
</text>
<text class='PREMISE_TEXT' x='${HALF_WIDTH}' y='${premiseY + 38}'>
  Fought ${escapeXml(premisePhrase)}
</text>

// optional message quote
${hasMessage ? `
<path d='M150,${messageY - 22} L320,${messageY - 22} M402.5,${messageY - 26} L406,${messageY - 22} L402.5,${messageY - 18} L399,${messageY - 22} Z M485,${messageY - 22} L655,${messageY - 22}' stroke='#7a441e' stroke-width='1' fill='#7a441e' opacity='0.6'/>
<text class='MESSAGE_TEXT' x='${HALF_WIDTH}' y='${messageY + 8}'>
  “${escapedMessage}”
</text>
` : `
// ornamental star badge when no message
<path d='M${HALF_WIDTH - 24},${premiseY + 80} L${HALF_WIDTH + 24},${premiseY + 80} M${HALF_WIDTH},${premiseY + 62} L${HALF_WIDTH + 6},${premiseY + 80} L${HALF_WIDTH},${premiseY + 98} L${HALF_WIDTH - 6},${premiseY + 80} Z' stroke='#7a441e' stroke-width='1.5' fill='#8c2210' opacity='0.7'/>
`}

// footer divider
<path d='M35,1015 L${WIDTH - 35},1015' stroke='#4a2612' stroke-width='1.5' opacity='0.6'/>

// footer
<text class='FOOTER LEFT' x='45' y='1044'>
  #${props.duel_id}
</text>
<text class='FOOTER' x='${HALF_WIDTH}' y='1044'>
  ❖  PISTOLS.GG  ❖
</text>
<text class='FOOTER RIGHT' x='${WIDTH - 45}' y='1044'>
  ${seasonText}
</text>

</svg>
`;
  return encodeSvg(svg, options)
}


