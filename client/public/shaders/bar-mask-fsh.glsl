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
uniform int uSamples; //from 2 to 35
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

int MAX_ELEMENTS = 7;

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
  
  // Final result
  vec4 result = vec4(0.0);
  
  // Masks for highlighting
  vec4 allMasks = vec4(0.0);
  
  // Process textures from back to front
  vec2 tex0Uv = shiftedUvs[0];
  vec4 tex0 = uTexturesSize > 0 ? texture2D(uTextures[0], tex0Uv) : vec4(0.0);
  tex0.a *= uHiddenOpacities[0];
  result = tex0;
  
  // Check for masks matching texture 0
  if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[0], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[1], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[2], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[3], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[4], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[5], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[0]) {
    vec4 m = texture2D(uMasks[6], tex0Uv);
    allMasks = mix(allMasks, m, m.a);
  }
  
  // Texture 1
  vec2 tex1Uv = shiftedUvs[1];
  if (uTexturesSize > 1) {
    vec4 tex1 = texture2D(uTextures[1], tex1Uv);
    tex1.a *= uHiddenOpacities[1];
    
    // Clear mask where texture 1 covers it, but only if not opaque
    if (tex1.a > 0.0 && !uOpaque[1]) {
      allMasks *= (1.0 - tex1.a);
    }
    
    result = mix(result, tex1, tex1.a);
    
    // Check for masks matching texture 1
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[0], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[1], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[2], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[3], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[4], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[5], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[1]) {
      vec4 m = texture2D(uMasks[6], tex1Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }
  
  // Texture 2
  vec2 tex2Uv = shiftedUvs[2];
  if (uTexturesSize > 2) {
    vec4 tex2 = texture2D(uTextures[2], tex2Uv);
    tex2.a *= uHiddenOpacities[2];
    
    // Clear mask where texture 2 covers it, but only if not opaque
    if (tex2.a > 0.0 && !uOpaque[2]) {
      allMasks *= (1.0 - tex2.a);
    }
    
    result = mix(result, tex2, tex2.a);
    
    // Check for masks matching texture 2
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[0], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[1], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[2], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[3], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[4], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[5], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[2]) {
      vec4 m = texture2D(uMasks[6], tex2Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }
  
  // Texture 3
  vec2 tex3Uv = shiftedUvs[3];
  if (uTexturesSize > 3) {
    vec4 tex3 = texture2D(uTextures[3], tex3Uv);
    tex3.a *= uHiddenOpacities[3];
    
    // Clear mask where texture 3 covers it, but only if not opaque
    if (tex3.a > 0.0 && !uOpaque[3]) {
      allMasks *= (1.0 - tex3.a);
    }
    
    result = mix(result, tex3, tex3.a);
    
    // Check for masks matching texture 3
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[0], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[1], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[2], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[3], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[4], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[5], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[3]) {
      vec4 m = texture2D(uMasks[6], tex3Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }
  
  // Texture 4
  vec2 tex4Uv = shiftedUvs[4];
  if (uTexturesSize > 4) {
    vec4 tex4 = texture2D(uTextures[4], tex4Uv);
    tex4.a *= uHiddenOpacities[4];
    
    // Clear mask where texture 4 covers it, but only if not opaque
    if (tex4.a > 0.0 && !uOpaque[4]) {
      allMasks *= (1.0 - tex4.a);
    }
    
    result = mix(result, tex4, tex4.a);
    
    // Check for masks matching texture 4
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[0], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[1], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[2], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[3], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[4], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[5], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[4]) {
      vec4 m = texture2D(uMasks[6], tex4Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }
  
  // Texture 5
  vec2 tex5Uv = shiftedUvs[5];
  if (uTexturesSize > 5) {
    vec4 tex5 = texture2D(uTextures[5], tex5Uv);
    tex5.a *= uHiddenOpacities[5];
    
    // Clear mask where texture 5 covers it, but only if not opaque
    if (tex5.a > 0.0 && !uOpaque[5]) {
      allMasks *= (1.0 - tex5.a);
    }
    
    result = mix(result, tex5, tex5.a);
    
    // Check for masks matching texture 5
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[0], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[1], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[2], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[3], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[4], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[5], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[5]) {
      vec4 m = texture2D(uMasks[6], tex5Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }
  
  // Texture 6
  vec2 tex6Uv = shiftedUvs[6];
  if (uTexturesSize > 6) {
    vec4 tex6 = texture2D(uTextures[6], tex6Uv);
    tex6.a *= uHiddenOpacities[6];
    
    // Clear mask where texture 6 covers it, but only if not opaque
    if (tex6.a > 0.0 && !uOpaque[6]) {
      allMasks *= (1.0 - tex6.a);
    }
    
    result = mix(result, tex6, tex6.a);
    
    // Check for masks matching texture 6
    if (uMasksSize > 0 && uMasksRenderOrder[0] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[0], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 1 && uMasksRenderOrder[1] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[1], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 2 && uMasksRenderOrder[2] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[2], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 3 && uMasksRenderOrder[3] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[3], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 4 && uMasksRenderOrder[4] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[4], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 5 && uMasksRenderOrder[5] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[5], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
    if (uMasksSize > 6 && uMasksRenderOrder[6] == uTexturesRenderOrder[6]) {
      vec4 m = texture2D(uMasks[6], tex6Uv);
      allMasks = mix(allMasks, m, m.a);
    }
  }

  // gl_FragColor = result;
  // return;
  
  // Apply blur effect based on uSamples
  vec4 blurredResult = blur(uTexturesSize, uTextures, shiftedUvs, ps, uSamples);
  
  // Apply darkening based on blur amount
  float darkFactor = mix(0.4, 1.0, 1.0 - ((float(uSamples) - 1.0) / 34.0));
  blurredResult.rgb *= darkFactor;
  
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

  result.rgb = linearToSRGB(result.rgb);
  blurredResult.rgb = linearToSRGB(blurredResult.rgb);
  
  // Apply highlight
  if (uClickable) {
    float finalHighlight = max(highlightAmount, glowAlpha);
    result.rgb = mix(result.rgb, uHighlightColor, finalHighlight * allMasks.a);
    blurredResult.rgb = mix(blurredResult.rgb, uHighlightColor, finalHighlight * allMasks.a);
  }
  
  // Final output
  if (excluded && result.a > 0.0) {
    gl_FragColor = result;
  } else if (uSamples > 3) {
    gl_FragColor = blurredResult;
  } else {
    gl_FragColor = result;
  }
}
