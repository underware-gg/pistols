varying vec2 vUv;

precision highp float;
precision highp int;
precision highp sampler2D;

// constants
uniform sampler2D uMask;
uniform sampler2D uTexture;
uniform vec2 uResolution;

// varying
uniform vec3 uExcludedColor;
uniform int uSamples; //from 2 to 35

const int LOD = 1;
const int sLOD = 1 << LOD;
const float BASE_OFFSET = 1.0;

float PI = 3.14159265359;

// For blur - sample texture with offset
vec4 sampleTexture(vec2 uv, vec2 multiplier, float strength, vec2 pixelMultiplier) {
  float offset = BASE_OFFSET * strength;
  vec2 scale = mix(1.0, 2.0, strength) * multiplier;
  vec2 halfpixel = scale * 0.5 * pixelMultiplier * offset;

  return texture2D(uTexture, uv + halfpixel);
}

// Downsample for dual Kawase blur with alpha-weighted blending
vec4 downsample(vec2 uv, vec2 multiplier, float blurStrength) {
  // Sample positions
  vec4 center = sampleTexture(uv, multiplier, blurStrength, vec2(0.0));
  vec4 corners[4];
  corners[0] = sampleTexture(uv, multiplier, blurStrength, vec2(-1.0, -1.0));
  corners[1] = sampleTexture(uv, multiplier, blurStrength, vec2(1.0, 1.0));
  corners[2] = sampleTexture(uv, multiplier, blurStrength, vec2(1.0, -1.0));
  corners[3] = sampleTexture(uv, multiplier, blurStrength, vec2(-1.0, 1.0));
  
  // Alpha-weighted sum
  vec4 sum = center * center.a * 4.0;
  float alphaSum = center.a * 4.0;
  
  for (int i = 0; i < 4; i++) {
    sum += corners[i] * corners[i].a;
    alphaSum += corners[i].a;
  }
  
  // Avoid division by zero
  alphaSum = max(0.0001, alphaSum);
  
  // Normalize
  sum.rgb /= alphaSum;
  sum.a = alphaSum / 8.0;
  
  return sum;
}

// Upsample for dual Kawase blur with alpha-weighted blending
vec4 upsample(vec2 uv, vec2 multiplier, float blurStrength) {
  // Sample positions (cross pattern with corners)
  vec4 samples[8];
  samples[0] = sampleTexture(uv, multiplier, blurStrength, vec2(-2.0, 0.0));
  samples[1] = sampleTexture(uv, multiplier, blurStrength, vec2(-1.0, 1.0));
  samples[2] = sampleTexture(uv, multiplier, blurStrength, vec2(0.0, 2.0));
  samples[3] = sampleTexture(uv, multiplier, blurStrength, vec2(1.0, 1.0));
  samples[4] = sampleTexture(uv, multiplier, blurStrength, vec2(2.0, 0.0));
  samples[5] = sampleTexture(uv, multiplier, blurStrength, vec2(1.0, -1.0));
  samples[6] = sampleTexture(uv, multiplier, blurStrength, vec2(0.0, -2.0));
  samples[7] = sampleTexture(uv, multiplier, blurStrength, vec2(-1.0, -1.0));
  
  // Weights (corners have weight 2)
  float weights[8] = float[8](1.0, 2.0, 1.0, 2.0, 1.0, 2.0, 1.0, 2.0);
  
  // Alpha-weighted sum
  vec4 sum = vec4(0.0);
  float alphaSum = 0.0;
  
  for (int i = 0; i < 8; i++) {
    sum += samples[i] * samples[i].a * weights[i];
    alphaSum += samples[i].a * weights[i];
  }
  
  // Avoid division by zero
  alphaSum = max(0.0001, alphaSum);
  
  // Normalize
  sum.rgb /= alphaSum;
  sum.a = alphaSum / 12.0;
  
  return sum;
}

vec4 applyBlur(vec2 uv, vec4 allMasks) {
  // Check if excluded or if blur is not needed
  bool excluded = (allMasks.a > 0.0 && allMasks.rgb == uExcludedColor);
  float blurStrength = 0.0;
  
  if (uSamples > 1 && !excluded) {
    blurStrength = max(0.0, float(uSamples - 1) / 20.0);
  }
  
  // Skip blur if not needed
  if (uSamples <= 1 || excluded) {
    return texture2D(uTexture, uv);
  }
  
  // Apply dual Kawase blur
  vec2 pixelSize = 1.0 / uResolution;
  
  // Initial downsample
  vec4 result = downsample(uv, pixelSize, blurStrength);
  
  // Extra blur passes for stronger blur
  if (blurStrength > 0.2) {
    result = downsample(uv, pixelSize * 2.0, blurStrength);
    result = upsample(uv, pixelSize * 2.0, blurStrength);
  }
  
  // Final upsample
  result = upsample(uv, pixelSize, blurStrength);

  return result;
}

vec4 sampleAll(vec2 uv) {
  vec4 result;
  vec4 allMasks = texture2D(uMask, uv);

  result = applyBlur(uv, allMasks);

  return result;
}

void main() {
  gl_FragColor = sampleAll(vUv);
}
