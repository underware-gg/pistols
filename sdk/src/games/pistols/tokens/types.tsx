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
