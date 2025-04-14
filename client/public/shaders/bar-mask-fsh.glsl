varying vec2 vUv;

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

vec4 loadMask(int index, vec2 uv, vec4 currentMask) {
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

  return currentMask;
}

void sampleAllMasks(in vec2 uvs[7], out int index, out vec4 allMasks) {
  vec4 result = texture2D(uTextures[0], uvs[0]);
  result.a *= uHiddenOpacities[0];
  index = 0;

  allMasks = loadMask(0, uvs[0], allMasks);

  if (uTexturesSize > 1) {
    vec4 tex = texture2D(uTextures[1], uvs[1]);
    tex.a *= uHiddenOpacities[1];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 1;
      if (!uOpaque[1]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(1, uvs[1], allMasks);
  }
  if (uTexturesSize > 2) {
    vec4 tex = texture2D(uTextures[2], uvs[2]);
    tex.a *= uHiddenOpacities[2];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 2;
      if (!uOpaque[2]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(2, uvs[2], allMasks);
  }
  if (uTexturesSize > 3) {
    vec4 tex = texture2D(uTextures[3], uvs[3]);
    tex.a *= uHiddenOpacities[3];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 3;
      if (!uOpaque[3]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(3, uvs[3], allMasks);
  }
  if (uTexturesSize > 4) {
    vec4 tex = texture2D(uTextures[4], uvs[4]);
    tex.a *= uHiddenOpacities[4];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 4;
      if (!uOpaque[4]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(4, uvs[4], allMasks);
  }
  if (uTexturesSize > 5) {
    vec4 tex = texture2D(uTextures[5], uvs[5]);
    tex.a *= uHiddenOpacities[5];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 5;
      if (!uOpaque[5]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(5, uvs[5], allMasks);
  }
  if (uTexturesSize > 6) {
    vec4 tex = texture2D(uTextures[6], uvs[6]);
    tex.a *= uHiddenOpacities[6];
    result = mix(result, tex, tex.a);

    if (tex.a > 0.0) {
      index = 6;
      if (!uOpaque[6]) {
        allMasks *= (1.0 - tex.a);
      }
    }

    allMasks = loadMask(6, uvs[6], allMasks);
  }
}

vec4 sampleTexture(sampler2D texSampler, vec2 uv, vec2 multiplier, float strength, vec2 pixelMultiplier, float opacity) {
  float offset = BASE_OFFSET * strength;
  vec2 scale = mix(1.0, 2.0, strength) * multiplier;
  vec2 halfpixel = scale * 0.5 * pixelMultiplier * offset;

  vec4 tex = texture2D(texSampler, uv + halfpixel);
  tex.a *= opacity;

  float darkFactor = max(0.1, 1.0 - (strength * 0.4));
  tex.rgb *= darkFactor;

  return tex;
}
  
vec4 sampleAllTextures(sampler2D textures[7], vec2 uvs[7], vec2 multiplier, float strengths[7], vec2 pixelMultiplier, vec4 allMasks, int index) {    
  vec4 result = sampleTexture(textures[0], uvs[0], multiplier, strengths[0], pixelMultiplier, uHiddenOpacities[0]);

  if (uTexturesSize > 1 && index >= 1) {
    vec4 tex = sampleTexture(textures[1], uvs[1], multiplier, strengths[1], pixelMultiplier, uHiddenOpacities[1]);
    result = mix(result, tex, tex.a);
  }
  if (uTexturesSize > 2 && index >= 2) {
    vec4 tex = sampleTexture(textures[2], uvs[2], multiplier, strengths[2], pixelMultiplier, uHiddenOpacities[2]);
    result = mix(result, tex, tex.a);
  }
  if (uTexturesSize > 3 && index >= 3) {
    vec4 tex = sampleTexture(textures[3], uvs[3], multiplier, strengths[3], pixelMultiplier, uHiddenOpacities[3]);
    result = mix(result, tex, tex.a);
  }
  if (uTexturesSize > 4 && index >= 4) {
    vec4 tex = sampleTexture(textures[4], uvs[4], multiplier, strengths[4], pixelMultiplier, uHiddenOpacities[4]);
    result = mix(result, tex, tex.a);
  }
  if (uTexturesSize > 5 && index >= 5) {
    vec4 tex = sampleTexture(textures[5], uvs[5], multiplier, strengths[5], pixelMultiplier, uHiddenOpacities[5]);
    result = mix(result, tex, tex.a);
  }
  if (uTexturesSize > 6 && index >= 6) {
    vec4 tex = sampleTexture(textures[6], uvs[6], multiplier, strengths[6], pixelMultiplier, uHiddenOpacities[6]);
    result = mix(result, tex, tex.a);
  }
  
  // Check if selected or excluded based on mask color
  bool selected = (allMasks.a > 0.0 && allMasks.rgb == uPickedColor);
  
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

  result.rgb = linearToSRGB(result.rgb);

  // Apply highlight
  if (uClickable) {
    float finalHighlight = max(highlightAmount, glowAlpha);
    result.rgb = mix(result.rgb, uHighlightColor, finalHighlight * allMasks.a);
  }
  
  return result;
}

// modified duel Kawase blur - https://www.shadertoy.com/view/3td3W8

vec4 downsampleCombined(sampler2D textures[7], vec2 uvs[7], vec2 multiplier, float strengths[7], vec4 allMasks, int index) {
  vec4 sum = sampleAllTextures(textures, uvs, multiplier, strengths, vec2(0.0), allMasks, index) * 4.0;
  
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(-1.0, -1.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(1.0, 1.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(1.0, -1.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(-1.0, 1.0), allMasks, index);
  
  return sum / 8.0;
}

// More efficient upsampling with unrolled implementation
vec4 upsampleCombined(sampler2D textures[7], vec2 uvs[7], vec2 multiplier, float strengths[7], vec4 allMasks, int index) {
  vec4 sum = sampleAllTextures(textures, uvs, multiplier, strengths, vec2(-2.0, 0.0), allMasks, index);
  
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(-1.0, 1.0), allMasks, index) * 2.0;
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(0.0, 2.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(1.0, 1.0), allMasks, index) * 2.0;
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(2.0, 0.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(1.0, -1.0), allMasks, index) * 2.0;
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(0.0, -2.0), allMasks, index);
  sum += sampleAllTextures(textures, uvs, multiplier, strengths, vec2(-1.0, -1.0), allMasks, index) * 2.0;
  
  return sum / 12.0;
}

vec4 blur(vec2 U[7], vec2 scale, vec4 allMasks, int index) {
  bool allSamplesNoBlur = false;
  float blurStrengths[7];

  bool excluded = (allMasks.a > 0.0 && allMasks.rgb == uExcludedColor);
  
  for (int i = 0; i < uTexturesSize; i++) {
    if (uSamples[i] > 1 && !excluded) {
      blurStrengths[i] = max(0.0, float(uSamples[i] - 1) / 16.0);
    } else {
      blurStrengths[i] = 0.0;
    }
  }
  
  // Only check if the current index needs blur
  if (index >= 0 && index < uTexturesSize) {
    allSamplesNoBlur = uSamples[index] <= 1 && allMasks.a > 0.99;
  }
  
  if (allSamplesNoBlur) {
    return sampleAllTextures(uTextures, U, scale, blurStrengths, vec2(0.0), allMasks, index);
  }

  vec4 color = downsampleCombined(uTextures, U, scale, blurStrengths, allMasks, index);
  
  // Check if any layer needs extra passes - unrolled
  bool needsExtraPass = false;
  for (int i = 0; i < uTexturesSize; i++) {
    if (blurStrengths[i] > 0.2) {
      needsExtraPass = true;
      break;
    }
  }
  
  if (needsExtraPass) {
    color = downsampleCombined(uTextures, U, scale * 2.0, blurStrengths, allMasks, index);
    color = upsampleCombined(uTextures, U, scale * 2.0, blurStrengths, allMasks, index);
  }

  color = upsampleCombined(uTextures, U, scale, blurStrengths, allMasks, index);
    
  return color;
}

void main() {
  vec2 shiftedUv = vUv + vec2(uShiftAmount, 0.0);
  shiftedUv.x = mod(shiftedUv.x, 1.0);

  vec2 shiftedUvs[7];
  for(int i = 0; i < 7; i++) {
    float layerShift = getLayerShiftForIndex(i);
    vec2 combinedShift = vec2(uShiftAmount + layerShift, 0.0);
    shiftedUvs[i] = vUv + combinedShift + getShiftForIndex(i);
    shiftedUvs[i].x = mod(shiftedUvs[i].x, 1.0);
  }
  
  vec2 ps = 1.0 / uResolution;

  int index = -1;
  vec4 allMasks = vec4(0.0);
  sampleAllMasks(shiftedUvs, index, allMasks);
  
  // Apply blur effect based on uSamples
  gl_FragColor = blur(shiftedUvs, ps, allMasks, index);
}
