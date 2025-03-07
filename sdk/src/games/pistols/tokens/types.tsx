
export type SvgRenderOptions = {
  includeMimeType?: boolean,
  encodeBase64?: boolean,
};

export const _packSvg = (svg: string, options: SvgRenderOptions): string => {
  if (options.includeMimeType) {
    return `data:image/svg+xml,${svg}`
  }
  return svg
}
