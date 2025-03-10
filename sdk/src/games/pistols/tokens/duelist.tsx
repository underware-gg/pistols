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

// size:    1024w x 1434h
// resized:  771w x 1080h
const WIDTH = 771;
const HEIGHT = 1080;
const card_square_url = `/textures/cards/card_front_brown.png`
const ArchetypeCardUrl: Record<constants.Archetype, string> = {
  [constants.Archetype.Honourable]: `/textures/cards/card_circular_honourable.png`,
  [constants.Archetype.Trickster]: `/textures/cards/card_circular_trickster.png`,
  [constants.Archetype.Villainous]: `/textures/cards/card_circular_villainous.png`,
  [constants.Archetype.Undefined]: `/textures/cards/card_circular_neutral.png`,
}
const STAR = '&#11088;' // ⭐️

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

export const renderSvg = (props: DuelistSvgProps, options: SvgRenderOptions = {}): string => {
  const profile = _getProfile(props.profile_type, props.profile_id)
  const profile_url = renderDuelistImageUrl(props.profile_type, props.profile_id);
  const card_url = ArchetypeCardUrl[props.archetype];
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' 
preserveAspectRatio='xMinYMin meet' viewBox='0 0 ${WIDTH} ${HEIGHT}'>
<style>
text{
fill:#200;
text-shadow: 0.05rem 0.05rem 5px #0008;
font-size:30px;
font-family:Garamond;
dominant-baseline:middle;
-webkit-user-select:none;
-moz-user-select:none;
-ms-user-select:none;
user-select:none;
}
.NAME{
font-size:60px;
font-weight:bold;
dominant-baseline:middle;
text-anchor:middle;
}
.FAME{
font-size:80px;
font-weight:bold;
dominant-baseline:middle;
text-anchor:middle;
}
#circle{
stroke:none;
fill:none;
}
</style>
<image href='${getAsset(profileAssets, profile_url)}' x='125' y='100' width='521px' height='521px' />
<image href='${getAsset(cardsAssets, card_url)}' x='0' y='0' width='${WIDTH}px' height='${HEIGHT}px' />
<path id='circle' d='M${92},350a200,200 0 1,1 ${WIDTH - 92 - 92},0' />
<text class='NAME'>
  <textPath startOffset='50%' xlink:href='#circle'>
  ${profile.name}
  </textPath>
</text>
<text class='FAME' x='${WIDTH / 2}' y='${HEIGHT * 0.7}'>
  ${STAR}${props.fame}
</text>
</svg>
`.replaceAll('\n', '');
  return _packSvg(svg, options)
}
