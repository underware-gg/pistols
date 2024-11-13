varying vec2 vUv;

// constants
uniform sampler2D uMask;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacity;

// varying
uniform float uTime;
uniform vec3 uPickedColor;

float PI = 3.14159265359;

void main()	{
  float alpha = 0.0;

  vec4 maskColor = vec4(0);
  vec4 mask_value = texture2D(uMask, vUv);
  if (mask_value.a > 0.0
      && mask_value.r == uPickedColor.r
      && mask_value.g == uPickedColor.g
      && mask_value.b == uPickedColor.b
  ) {
    alpha = uHighlightOpacity;
  }

  float glowAlpha = (sin(clamp(mod((uTime * 2.0 + vUv.y * 2.0), 8.0), 0.0, 1.0) * PI * 2.0));
  glowAlpha *= (uHighlightOpacity * 0.5) * mask_value.a;

  gl_FragColor = vec4( uHighlightColor, max( alpha, glowAlpha) );
  // gl_FragColor = vec4( mask_value ); // debug mask
  // gl_FragColor = vec4( glowColor, mask_value.a);
}
