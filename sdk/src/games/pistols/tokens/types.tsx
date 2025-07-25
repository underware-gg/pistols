import { encodeBase64 } from '../../../utils/misc/decoder';
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


//--------------------------------
// renderer
//
export type SvgRenderOptions = {
  includeMimeType?: boolean,
  encodeBase64?: boolean,
};

export const encodeSvg = (svg: string, options: SvgRenderOptions): string => {
  let lines = svg.split('\n');
  lines = lines.map(l => l.trim());
  lines = lines.filter(l => l.length > 0);
  lines = lines.filter(l => !l.startsWith('<!--'));
  lines = lines.filter(l => !l.startsWith('//'));
  const _svg_data = lines.join('');
  if (options.includeMimeType) {
    if (options.encodeBase64) {
      return encodeBase64(_svg_data, 'svg');
    }
    const _utf8_data = _svg_data
      .replaceAll('#', '%23')
      .replaceAll('"', '&quot;');
    return `data:image/svg+xml;utf8,${_utf8_data}`;
  }
  return _svg_data
}
