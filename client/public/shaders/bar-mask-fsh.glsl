varying vec2 vUv;

// constants
uniform int uMasksSize;
uniform sampler2D uMasks[5];
uniform int uMasksRenderOrder[5];
uniform int uTexturesSize;
uniform sampler2D uTextures[5];
uniform int uTexturesRenderOrder[5];
uniform vec2 uResolution;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacity;
uniform float uHiddenOpacities[5];

// varying
uniform float uTime;
uniform vec3 uPickedColor;
uniform vec3 uExcludedColor;
uniform bool uClickable;
uniform int uSamples; //from 2 to 35
uniform float uShiftAmount; // from 0.0 to 1.0

//If it works it aint stupid...
uniform vec2 uTextureShift0;
uniform vec2 uTextureShift1;
uniform vec2 uTextureShift2;
uniform vec2 uTextureShift3;
uniform vec2 uTextureShift4;
uniform float uRandomShift0;
uniform float uRandomShift1;
uniform float uRandomShift2;
uniform float uRandomShift3;
uniform float uRandomShift4;

int MAX_ELEMENTS = 5;

int findFirstUsed(sampler2D elements[5], vec2 uvs[5]) {
  if (texture2D(elements[0], uvs[0]).a > 0.0) return 0;
  if (texture2D(elements[1], uvs[1]).a > 0.0) return 1;
  if (texture2D(elements[2], uvs[2]).a > 0.0) return 2;
  if (texture2D(elements[3], uvs[3]).a > 0.0) return 3;
  if (texture2D(elements[4], uvs[4]).a > 0.0) return 4;
  
  return -1;
}

vec2 findShift(int index) {
  if (index == 0) return uTextureShift0 + uRandomShift0;
  if (index == 1) return uTextureShift1 + uRandomShift1;
  if (index == 2) return uTextureShift2 + uRandomShift2;
  if (index == 3) return uTextureShift3 + uRandomShift3;
  if (index == 4) return uTextureShift4 + uRandomShift4;
  
  return vec2(0.0);
}

vec2 findMaskUv(int maskRenderOrder, vec2 shiftedUvs[5]) {
  if (maskRenderOrder == uTexturesRenderOrder[0]) {
    return shiftedUvs[0];
  } else if (maskRenderOrder == uTexturesRenderOrder[1]) {
    return shiftedUvs[1];
  } else if (maskRenderOrder == uTexturesRenderOrder[2]) {
    return shiftedUvs[2];
  } else if (maskRenderOrder == uTexturesRenderOrder[3]) {
    return shiftedUvs[3];
  } else if (maskRenderOrder == uTexturesRenderOrder[4]) {
    return shiftedUvs[4];
  }
  return vec2(0.0);
}

void main() {
  vec2 shiftedUv = vUv + vec2(uShiftAmount, 0.0);
  shiftedUv.x = mod(shiftedUv.x, 1.0);
  
  float alpha = 0.0;

  // Calculate all texture parallax shifts and shifted UVs
  vec2 shiftedUvs[5];
  for(int i = 0; i < 5; i++) {
    shiftedUvs[i] = shiftedUv + findShift(i);
  }

  int usedTexture = findFirstUsed(uTextures, shiftedUvs);
  int usedMask = findFirstUsed(uMasks, shiftedUvs);

  if (usedTexture == -1) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  vec2 ps = 1.0 / uResolution;
  vec4 blurTex = blur(uTexturesSize, uTextures, shiftedUvs, ps, uSamples);
  vec4 texColor;
  vec4 maskValue = vec4(0.0);
  vec2 maskUv = vec2(0.0);

  int maskOrder;

  // Get mask order from used mask index
  if (usedMask == 0) {
    maskOrder = uMasksRenderOrder[0];
  } else if (usedMask == 1) {
    maskOrder = uMasksRenderOrder[1];
  } else if (usedMask == 2) {
    maskOrder = uMasksRenderOrder[2]; 
  } else if (usedMask == 3) {
    maskOrder = uMasksRenderOrder[3];
  } else if (usedMask == 4) {
    maskOrder = uMasksRenderOrder[4];
  } else {
    maskOrder = 5;
  }

  // Find texture UVs for each mask based on render order
  vec2 maskUvs[5];
  maskUvs[0] = findMaskUv(uMasksRenderOrder[0], shiftedUvs);
  maskUvs[1] = findMaskUv(uMasksRenderOrder[1], shiftedUvs);
  maskUvs[2] = findMaskUv(uMasksRenderOrder[2], shiftedUvs);
  maskUvs[3] = findMaskUv(uMasksRenderOrder[3], shiftedUvs);
  maskUvs[4] = findMaskUv(uMasksRenderOrder[4], shiftedUvs);

  // Sample masks using the matched UVs
  if (uMasksSize > 0) maskValue = texture2D(uMasks[0], maskUvs[0]);
  if (uMasksSize > 1) maskValue = mix(maskValue, texture2D(uMasks[1], maskUvs[1]), 1.0 - maskValue.a);
  if (uMasksSize > 2) maskValue = mix(maskValue, texture2D(uMasks[2], maskUvs[2]), 1.0 - maskValue.a);
  if (uMasksSize > 3) maskValue = mix(maskValue, texture2D(uMasks[3], maskUvs[3]), 1.0 - maskValue.a);
  if (uMasksSize > 4) maskValue = mix(maskValue, texture2D(uMasks[4], maskUvs[4]), 1.0 - maskValue.a);

  // Find texture with matching render order and use its UV
  if (uTexturesRenderOrder[0] == maskOrder) {
    maskUv = shiftedUvs[0];
  } else if (uTexturesRenderOrder[1] == maskOrder) {
    maskUv = shiftedUvs[1];
  } else if (uTexturesRenderOrder[2] == maskOrder) {
    maskUv = shiftedUvs[2];
  } else if (uTexturesRenderOrder[3] == maskOrder) {
    maskUv = shiftedUvs[3];
  } else if (uTexturesRenderOrder[4] == maskOrder) {
    maskUv = shiftedUvs[4];
  }

  if (usedTexture == 0) {
    texColor = texture2D(uTextures[0], shiftedUvs[0]);
  } else if (usedTexture == 1 && uTexturesSize > 1) {
    texColor = texture2D(uTextures[1], shiftedUvs[1]);
  } else if (usedTexture == 2 && uTexturesSize > 2) {
    texColor = texture2D(uTextures[2], shiftedUvs[2]);
  } else if (usedTexture == 3 && uTexturesSize > 3) {
    texColor = texture2D(uTextures[3], shiftedUvs[3]);
  } else if (usedTexture == 4 && uTexturesSize > 4) {
    texColor = texture2D(uTextures[4], shiftedUvs[4]);
  }

  vec4 combinedTex = vec4(0.0);
  if (uHiddenOpacities[0] == 1.0) combinedTex = texture2D(uTextures[0], shiftedUvs[0]);
  if (uHiddenOpacities[1] == 1.0) combinedTex = mix(combinedTex, texture2D(uTextures[1], shiftedUvs[1]), 1.0 - combinedTex.a);
  if (uHiddenOpacities[2] == 1.0) combinedTex = mix(combinedTex, texture2D(uTextures[2], shiftedUvs[2]), 1.0 - combinedTex.a);
  if (uHiddenOpacities[3] == 1.0) combinedTex = mix(combinedTex, texture2D(uTextures[3], shiftedUvs[3]), 1.0 - combinedTex.a);
  if (uHiddenOpacities[4] == 1.0) combinedTex = mix(combinedTex, texture2D(uTextures[4], shiftedUvs[4]), 1.0 - combinedTex.a);

  // gl_FragColor = texture2D(uTextures[0], shiftedUvs[0]);
  // return;
  // Hide item
  bool hide = false;
  if (usedTexture == 0) {
    if (uHiddenOpacities[0] < 1.0) {
      hide = true;
    }
    texColor = mix(texColor, combinedTex, 1.0 - uHiddenOpacities[0]);
    blurTex = mix(blurTex, combinedTex, 1.0 - uHiddenOpacities[0]);
  } else if (usedTexture == 1) {
    if (uHiddenOpacities[1] < 1.0) {
      hide = true;
    }
    texColor = mix(texColor, combinedTex, 1.0 - uHiddenOpacities[1]);
    blurTex = mix(blurTex, combinedTex, 1.0 - uHiddenOpacities[1]);
  } else if (usedTexture == 2) {
    if (uHiddenOpacities[2] < 1.0) {
      hide = true;
    }
    texColor = mix(texColor, combinedTex, 1.0 - uHiddenOpacities[2]);
    blurTex = mix(blurTex, combinedTex, 1.0 - uHiddenOpacities[2]);
  } else if (usedTexture == 3) {
    if (uHiddenOpacities[3] < 1.0) {
      hide = true;
    }
    texColor = mix(texColor, combinedTex, 1.0 - uHiddenOpacities[3]);
    blurTex = mix(blurTex, combinedTex, 1.0 - uHiddenOpacities[3]);
  } else if (usedTexture == 4) {
    if (uHiddenOpacities[4] < 1.0) {
      hide = true;
    }
    texColor = mix(texColor, combinedTex, 1.0 - uHiddenOpacities[4]);
    blurTex = mix(blurTex, combinedTex, 1.0 - uHiddenOpacities[4]);
  }

  vec4 combinedTexNoMask = vec4(0.0);
  if (uTexturesSize > 0 && uTexturesRenderOrder[0] < maskOrder) {
    combinedTexNoMask = texture2D(uTextures[0], shiftedUvs[0]);
  }
  if (uTexturesSize > 1 && uTexturesRenderOrder[1] < maskOrder) {
    combinedTexNoMask = mix(combinedTexNoMask, texture2D(uTextures[1], shiftedUvs[1]), 1.0 - combinedTexNoMask.a);
  }
  if (uTexturesSize > 2 && uTexturesRenderOrder[2] < maskOrder) {
    combinedTexNoMask = mix(combinedTexNoMask, texture2D(uTextures[2], shiftedUvs[2]), 1.0 - combinedTexNoMask.a);
  }
  if (uTexturesSize > 3 && uTexturesRenderOrder[3] < maskOrder) {
    combinedTexNoMask = mix(combinedTexNoMask, texture2D(uTextures[3], shiftedUvs[3]), 1.0 - combinedTexNoMask.a);
  }
  if (uTexturesSize > 4 && uTexturesRenderOrder[4] < maskOrder) {
    combinedTexNoMask = mix(combinedTexNoMask, texture2D(uTextures[4], shiftedUvs[4]), 1.0 - combinedTexNoMask.a);
  }

  // bool selected = maskValue.a > 0.0;
  bool selected = (maskValue.a > 0.0 && maskValue.rgb == uPickedColor);
  bool excluded = (maskValue.a > 0.0 && maskValue.rgb == uExcludedColor);

  float glowAlpha = 0.0;
  if (combinedTexNoMask.a == 0.0) {
    glowAlpha = (sin(clamp(mod((uTime * 2.0 + maskUv.y * 2.0), 8.0), 0.0, 1.0) * PI * 2.0));
    glowAlpha *= (uHighlightOpacity * 0.5) * maskValue.a;
  }

  if (selected && uClickable && combinedTexNoMask.a == 0.0) {
    alpha = uHighlightOpacity;
  }
  // Darken the blurred texture by multiplying RGB values
  float darkFactor = 1.0;
  if ((uExcludedColor != vec3(0.0) && !excluded) || combinedTexNoMask.a != 0.0) {
    float t = 1.0 - ((float(uSamples) - 1.0) / 34.0); // Map uSamples from [1,35] to [1,0]
    darkFactor = mix(0.4, 1.0, t);
  }
  blurTex.rgb *= darkFactor;

  blurTex.rgb = linearToSRGB(blurTex.rgb);
  texColor.rgb = linearToSRGB(texColor.rgb);

  if (uClickable && !hide) {
    blurTex = mix(blurTex, vec4(uHighlightColor, 1.0), max(alpha, glowAlpha));
    texColor = vec4(mix(texColor.rgb, uHighlightColor, max(alpha, glowAlpha)), texColor.a);
  }

  if (excluded && combinedTexNoMask.a == 0.0) {
    gl_FragColor = texColor;
  } else {
    gl_FragColor = blurTex;
  }

  //Test mask
  // gl_FragColor = mix(blurTex, maskValue, 0.5);
  // gl_FragColor = maskValue;
}
