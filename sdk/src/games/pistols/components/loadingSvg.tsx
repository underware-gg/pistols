import { encodeSvg } from "../tokens/types";
import { COLORS } from "../constants/colors";

export const loadingSvg = encodeSvg(`
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' width='771' height='1080' viewBox='-1 -1 20 20'>
  <style>text{fill:${COLORS.BRIGHT};font-size:1px;font-family:'EB Garamond',serif;}.BG{fill:#0000;}</style>
  <g>
    <rect class='BG' x='-1' y='-1' width='20' height='20' />
    <text x='0' y='1'>Loading...</text>
  </g>
</svg>
`, { includeMimeType: true });

export const renderingSvg = encodeSvg(`
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' width='771' height='1080' viewBox='-1 -1 20 20'>
  <style>text{fill:${COLORS.BRIGHT};font-size:1px;font-family:'EB Garamond',serif;}.BG{fill:#0000;}</style>
  <g>
    <rect class='BG' x='-1' y='-1' width='20' height='20' />
    <text x='0' y='1'>Rendering...</text>
  </g>
</svg>
`, { includeMimeType: true });

export const errorSvg = encodeSvg(`
<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' width='771' height='1080' viewBox='-1 -1 20 20'>
  <style>text{fill:${COLORS.IMPORTANT};font-size:1px;font-family:'EB Garamond',serif;}.BG{fill:#0000;}</style>
  <g>
    <rect class='BG' x='-1' y='-1' width='20' height='20' />
    <text x='0' y='1'>Error rendering token</text>
  </g>
</svg>
`, { includeMimeType: true });

