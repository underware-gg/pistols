varying vec2 vUv;

// constants
uniform int uMasksSize;
uniform sampler2D uMasks[7];
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacityShimmer;
uniform float uHighlightOpacitySelected;
uniform float uHiddenOpacity;
uniform bool uOpaque;

// varying
uniform float uTime;
uniform vec3 uPickedColor;
uniform vec3 uExcludedColor;
uniform bool uClickable;
uniform int uSamples; //from 2 to 35
uniform float uDarkStrength; // from 0.0 to 1.0
uniform vec2 uShiftAmount;

const int LOD = 1;
const int sLOD = 1 << LOD;
const float BASE_OFFSET = 1.0;

float PI = 3.14159265359;

vec4 loadMask(vec2 uv) {
  vec4 currentMask = vec4(0.0);
  if (uMasksSize > 0) {
    vec4 m = texture2D(uMasks[0], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 1) {
    vec4 m = texture2D(uMasks[1], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 2) {
    vec4 m = texture2D(uMasks[2], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 3) {
    vec4 m = texture2D(uMasks[3], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 4) {
    vec4 m = texture2D(uMasks[4], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 5) {
    vec4 m = texture2D(uMasks[5], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  if (uMasksSize > 6) {
    vec4 m = texture2D(uMasks[6], uv);
    currentMask = mix(currentMask, m, m.a);
  }
  return currentMask;
}

vec4 sampleAll(vec2 uv) {
  vec4 allMasks = loadMask(uv);

  vec4 result = texture2D(uTexture, uv);

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

  result.a *= uHiddenOpacity;

  result.rgb = linearToSRGB(result.rgb);

  // Apply highlight
  if (uClickable) {
    float finalHighlight = max(highlightAmount, glowAlpha);
    result.rgb = mix(result.rgb, uHighlightColor, finalHighlight * allMasks.a);
  }

  return result;
}

void main() {
  vec2 shiftedUv = vUv + uShiftAmount;
  shiftedUv.x = mod(shiftedUv.x, 1.0);
  
  gl_FragColor = sampleAll(shiftedUv);
}
