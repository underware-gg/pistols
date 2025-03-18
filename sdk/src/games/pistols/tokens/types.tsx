import * as constants from '../generated/constants'


export const STAR = '&#11088;' // ⭐️
export const PISTOL = '&#x1F52B;' // 🔫

export const COLOR_DARK = '#200';
export const COLOR_SHADOW = '#2008';
export const COLOR_TITLE = '#e88e34'; //#e88e34
export const COLOR_LIGHT = '#fffb';

// const card_square_url = `/textures/cards/card_front_brown.png`
export const card_cross = `/textures/cards/card_disabled.png`
export const ArchetypeCardUrl: Record<constants.Archetype, string> = {
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

export const _getProfile = (profile_type: constants.ProfileType, profile_id: number) => {
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


//--------------------------------
// renderer
//
export type SvgRenderOptions = {
  includeMimeType?: boolean,
  encodeBase64?: boolean,
};

export const _packSvg = (svg: string, options: SvgRenderOptions): string => {
  let lines = svg.split('\n');
  lines = lines.map(l => l.trim());
  lines = lines.filter(l => l.length > 0);
  lines = lines.filter(l => !l.startsWith('<!--'));
  lines = lines.filter(l => !l.startsWith('//'));
  const _svg = lines.join('');
  if (options.includeMimeType) {
    // return `data:image/svg+xml;utf8,${encodeURI(svg)}`
    return `data:image/svg+xml;utf8,${_svg
      .replaceAll('#', '%23')
      .replaceAll('"', '&quot;')
      }`
  }
  return _svg
}
