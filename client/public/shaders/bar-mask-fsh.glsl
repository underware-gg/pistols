varying vec2 vUv;

// constants
uniform sampler2D uMask;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacity;

// varying
uniform float uTime;
uniform vec3 uPickedColor;
uniform vec3 uExcludedColor;
uniform bool uClickable;
uniform int uSamples; //from 2 to 35
uniform float uShiftAmount; // from 0.0 to 1.0

const int LOD = 1;
const int sLOD = 1 << LOD;

float PI = 3.14159265359;

#define pow2(x) (x * x)

bool isLessThanOrEqual(vec3 a, vec3 b) {
  return (a.x <= b.x) && (a.y <= b.y) && (a.z <= b.z);
}

vec3 linearToSRGB(vec3 color) {
    return isLessThanOrEqual(color, vec3(0.0031308)) ? (color * 12.92) : (pow(color, vec3(1.0 / 2.4)) * 1.055 - 0.055);
}

float gaussian(vec2 i) {
  float sigma = float(uSamples) * .25;
  return exp( -.5* dot(i/=sigma,i) ) / ( 2.0 * PI * sigma*sigma );
}

vec4 blur(sampler2D sp, vec2 U, vec2 scale) {
  vec4 O = vec4(0);  
  int s = max(uSamples / sLOD, 1);
  
  for ( int i = 0; i < s*s; i++ ) {
    vec2 d = vec2(i%s, i/s)*float(sLOD) - float(uSamples)/2.;
    vec4 texColor = textureLod( sp, U + scale * d , float(LOD) );
    texColor.rgb = linearToSRGB(texColor.rgb);
    O += gaussian(d) * texColor;
  }
  
  return O / O.a;
}

void main() {
  vec2 shiftedUv = vUv + vec2(uShiftAmount, 0.0);
  shiftedUv.x = mod(shiftedUv.x, 1.0);
  
  float alpha = 0.0;
  vec4 maskValue = texture2D(uMask, shiftedUv);
  bool selected = (maskValue.a > 0.0 && maskValue.rgb == uPickedColor);
  bool excluded = (maskValue.a > 0.0 && maskValue.rgb == uExcludedColor);
  vec4 bgColor;

  float glowAlpha = (sin(clamp(mod((uTime * 2.0 + shiftedUv.y * 2.0), 8.0), 0.0, 1.0) * PI * 2.0));
  glowAlpha *= (uHighlightOpacity * 0.5) * maskValue.a;

  if (selected && uClickable) {
    alpha = uHighlightOpacity;
  }

  vec2 ps = 1.0 / uResolution;
  vec4 blurTex = blur(uTexture, shiftedUv, ps);
  // Darken the blurred texture by multiplying RGB values
  float darkFactor = 1.0;
  if (uExcludedColor != vec3(0.0) && !excluded) {
    float t = 1.0 - ((float(uSamples) - 1.0) / 34.0); // Map uSamples from [1,35] to [1,0]
    darkFactor = mix(0.4, 1.0, t);
  }
  blurTex.rgb *= darkFactor;

  vec4 texColor = texture2D(uTexture, shiftedUv);
  texColor.rgb = linearToSRGB(texColor.rgb);

  if (uClickable) {
    blurTex = mix(blurTex, vec4(uHighlightColor, 1.0), max(alpha, glowAlpha));
    texColor = vec4(mix(texColor.rgb, uHighlightColor, max(alpha, glowAlpha)), texColor.a);
  }

  if (excluded) {
    gl_FragColor = texColor;
  } else {
    gl_FragColor = blurTex;
  }

  //Test mask
  // gl_FragColor = mix(texColor, maskValue, 0.5);
}