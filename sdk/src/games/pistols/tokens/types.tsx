export type SvgRenderOptions = {
  includeMimeType?: boolean,
  encodeBase64?: boolean,
};

export const _packSvg = (svg: string, options: SvgRenderOptions): string => {
  if (options.includeMimeType) {
    // return `data:image/svg+xml;utf8,${encodeURI(svg)}`
    return `data:image/svg+xml;utf8,${svg
      .replaceAll('#', '%23')
      .replaceAll('"', '&quot;')
      }`
  }
  return svg
}
