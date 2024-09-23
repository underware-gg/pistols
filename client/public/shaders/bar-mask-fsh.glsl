varying vec2 vUv;

// constants
uniform sampler2D uMask;
uniform vec3 uHighlightColor;
uniform float uHighlightOpacity;

// varying
uniform float uTime;
uniform vec3 uPickedColor;

void main()	{
  vec3 color = vec3(0.0, 0.0, 0.0);
  float alpha = 0.0;

  vec4 mask_value = texture2D(uMask, vUv);

  if (mask_value.a > 0.0
      && mask_value.r == uPickedColor.r
      && mask_value.g == uPickedColor.g
      && mask_value.b == uPickedColor.b
  ) {
    // color = uPickedColor;
    color = uHighlightColor;
    alpha = uHighlightOpacity;
  }

  gl_FragColor = vec4( color, alpha );
  // gl_FragColor = vec4( mask_value ); // debug mask
}
