uniform sampler2D uTexture;
uniform vec3 uBloomColor;
uniform float uBloomStrength;
uniform float uMaxDistance;
varying vec2 vUv;

void main() {
    // Discard transparent pixels
    vec4 texColor = texture2D(uTexture, vUv);
    if (texColor.a < 0.5) discard;

    gl_FragColor = vec4(uBloomColor * uBloomStrength, 1.0);
}