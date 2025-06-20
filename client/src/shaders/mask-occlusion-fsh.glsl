varying vec2 vUv;

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uTexture;
uniform bool uOpaque;

void main() {
  // If the layer is opaque, make everything transparent
  if (uOpaque) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // Sample the texture
  vec4 texColor = texture2D(uTexture, vUv);
  
  // If there's anything there (alpha > 0), output black with full alpha
  // Otherwise output transparent
  if (texColor.a > 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
} 