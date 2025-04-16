varying vec2 vUv;

precision highp float;
precision highp int;
precision highp sampler2D;

// constants
uniform int uMasksSize;
uniform sampler2D uMasks[7];
uniform int uMasksRenderOrder[7];
uniform int uTexturesSize;
uniform sampler2D uTextures[7];
uniform int uTexturesRenderOrder[7];
uniform vec2 uResolution;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacityShimmer;
uniform float uHighlightOpacitySelected;
uniform float uHiddenOpacities[7];
uniform bool uOpaque[7];

// varying
uniform float uTime;
uniform vec3 uPickedColor;
uniform vec3 uExcludedColor;
uniform bool uClickable;
uniform int uSamples[7]; //from 2 to 35
uniform float uDarkStrength; // from 0.0 to 1.0
uniform float uShiftAmount; // from 0.0 to 1.0
uniform float uShiftAmountLayer[7]; // per-layer shift amount

//If it works it aint stupid...
uniform vec2 uTextureShift0;
uniform vec2 uTextureShift1;
uniform vec2 uTextureShift2;
uniform vec2 uTextureShift3;
uniform vec2 uTextureShift4;
uniform vec2 uTextureShift5;
uniform vec2 uTextureShift6;
uniform float uRandomShift0;
uniform float uRandomShift1;
uniform float uRandomShift2;
uniform float uRandomShift3;
uniform float uRandomShift4;
uniform float uRandomShift5;
uniform float uRandomShift6;

const int LOD = 1;
const int sLOD = 1 << LOD;
const float BASE_OFFSET = 1.0;

float PI = 3.14159265359;

vec2 getShiftForIndex(int index) {
  if (index == 0) return uTextureShift0 + uRandomShift0;
  if (index == 1) return uTextureShift1 + uRandomShift1;
  if (index == 2) return uTextureShift2 + uRandomShift2;
  if (index == 3) return uTextureShift3 + uRandomShift3;
  if (index == 4) return uTextureShift4 + uRandomShift4;
  if (index == 5) return uTextureShift5 + uRandomShift5;
  if (index == 6) return uTextureShift6 + uRandomShift6;
  return vec2(0.0);
}

float getLayerShiftForIndex(int index) {
  if (index == 0) return uShiftAmountLayer[0];
  if (index == 1) return uShiftAmountLayer[1];
  if (index == 2) return uShiftAmountLayer[2];
  if (index == 3) return uShiftAmountLayer[3];
  if (index == 4) return uShiftAmountLayer[4];
  if (index == 5) return uShiftAmountLayer[5];
  if (index == 6) return uShiftAmountLayer[6];
  return 0.0;
}

void loadMask(int index, vec2 uv, inout vec4 currentMask) {
  int order;
  if (index == 0) order = uTexturesRenderOrder[0];
  if (index == 1) order = uTexturesRenderOrder[1];
  if (index == 2) order = uTexturesRenderOrder[2];
  if (index == 3) order = uTexturesRenderOrder[3];
  if (index == 4) order = uTexturesRenderOrder[4];
  if (index == 5) order = uTexturesRenderOrder[5];
  if (index == 6) order = uTexturesRenderOrder[6];

  if (uMasksSize > 0 && uMasksRenderOrder[0] == order) {
    vec4 m = texture2D(uMasks[0], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 1 && uMasksRenderOrder[1] == order) {
    vec4 m = texture2D(uMasks[1], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 2 && uMasksRenderOrder[2] == order) {
    vec4 m = texture2D(uMasks[2], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 3 && uMasksRenderOrder[3] == order) {
    vec4 m = texture2D(uMasks[3], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 4 && uMasksRenderOrder[4] == order) {
    vec4 m = texture2D(uMasks[4], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 5 && uMasksRenderOrder[5] == order) {
    vec4 m = texture2D(uMasks[5], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 6 && uMasksRenderOrder[6] == order) {
    vec4 m = texture2D(uMasks[6], uv);
    currentMask = mix(currentMask, m, m.a);
  }
}

void sampleTexture(sampler2D texSampler, vec2 uv, float opacity, bool opaque, inout vec4 result, inout vec4 allMasks) {
  vec4 tex = texture2D(texSampler, uv);
  tex.a *= opacity;

  if (tex.a > 0.0 && !opaque) {
    allMasks *= (1.0 - tex.a);
  }

  // Premultiplied alpha blending for better transparency handling
  vec4 premultipliedTex = vec4(tex.rgb * tex.a, tex.a);
  
  // If result has no opacity yet, just use the texture directly
  if (result.a < 0.001) {
    result = premultipliedTex;
  } else {
    // Combine using premultiplied alpha for proper transparency
    result.rgb = premultipliedTex.rgb + result.rgb * (1.0 - premultipliedTex.a);
    result.a = premultipliedTex.a + result.a * (1.0 - premultipliedTex.a);
  }
}

vec4 sampleAll(vec2 uvs[7]) {
  vec4 allMasks = vec4(0.0);
  vec4 result = vec4(0.0);

  sampleTexture(uTextures[0], uvs[0], uHiddenOpacities[0], uOpaque[0], result, allMasks);
  loadMask(0, uvs[0], allMasks);

  if (uTexturesSize > 1) {
    sampleTexture(uTextures[1], uvs[1], uHiddenOpacities[1], uOpaque[1], result, allMasks);
    loadMask(1, uvs[1], allMasks);
  }
  if (uTexturesSize > 2) {
    sampleTexture(uTextures[2], uvs[2], uHiddenOpacities[2], uOpaque[2], result, allMasks);
    loadMask(2, uvs[2], allMasks);
  }
  if (uTexturesSize > 3) {
    sampleTexture(uTextures[3], uvs[3], uHiddenOpacities[3], uOpaque[3], result, allMasks);
    loadMask(3, uvs[3], allMasks);
  }
  if (uTexturesSize > 4) {
    sampleTexture(uTextures[4], uvs[4], uHiddenOpacities[4], uOpaque[4], result, allMasks);
    loadMask(4, uvs[4], allMasks);
  }
  if (uTexturesSize > 5) {
    sampleTexture(uTextures[5], uvs[5], uHiddenOpacities[5], uOpaque[5], result, allMasks);
    loadMask(5, uvs[5], allMasks);
  }
  if (uTexturesSize > 6) {
    sampleTexture(uTextures[6], uvs[6], uHiddenOpacities[6], uOpaque[6], result, allMasks);
    loadMask(6, uvs[6], allMasks);
  }

  // Check if selected or excluded based on mask color
  bool selected = (allMasks.a > 0.0 && allMasks.rgb == uPickedColor);
  bool excluded = (allMasks.a > 0.0 && allMasks.rgb == uExcludedColor);
  
  // Apply glow effect
  float glowAlpha = 0.0;
  if (allMasks.a > 0.0) {
    glowAlpha = (sin(clamp(mod((uTime * 2.0 + vUv.y * 2.0), 8.0), 0.0, 1.0) * PI * 2.0));
    glowAlpha *= (uHighlightOpacityShimmer * 0.5) * allMasks.a;
  }
  
  float highlightAmount = 0.0;
  if (selected && uClickable) {
    highlightAmount = uHighlightOpacitySelected;
  }

  if (!excluded) {
    float darkFactor = max(0.1, 1.0 - uDarkStrength);
    result.rgb *= darkFactor;
  }

  result.rgb = linearToSRGB(result.rgb);

  // Apply highlight
  if (uClickable) {
    float finalHighlight = max(highlightAmount, glowAlpha);
    result.rgb = mix(result.rgb, uHighlightColor, finalHighlight * allMasks.a);
  }

  return result;
}

void main() {
  // vec2 shiftedUv = vUv + vec2(uShiftAmount, 0.0);
  // shiftedUv.x = mod(shiftedUv.x, 1.0);

  vec2 shiftedUvs[7];
  for(int i = 0; i < 7; i++) {
    float layerShift = getLayerShiftForIndex(i);
    vec2 combinedShift = vec2(uShiftAmount + layerShift, 0.0);
    shiftedUvs[i] = vUv + combinedShift + getShiftForIndex(i);
    shiftedUvs[i].x = mod(shiftedUvs[i].x, 1.0);
  }
  
  gl_FragColor = sampleAll(shiftedUvs);
}
