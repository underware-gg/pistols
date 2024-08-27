uniform vec3 colorShallow;
uniform vec3 colorDeep;
uniform float time;
uniform float waveStrength;
uniform float waveSpeed;
uniform vec2 windDirection;
uniform sampler2D tDiffuse;
uniform sampler2D tDudv;
uniform sampler2D waterMap;

varying vec4 vUv;
varying vec2 vTexture;

#include <logdepthbuf_pars_fragment>

void main() {
    #include <logdepthbuf_fragment>

    vec4 waterInfo = texture2D(waterMap, vTexture);
    if (all(lessThan(waterInfo.rgb, vec3(0.05)))) {
        discard;
    }

    vec3 enhancedColor;
    float distortionKoef;
    if (waterInfo.r > waterInfo.g) {
        enhancedColor = colorDeep * 1.5;
        distortionKoef = 1.0;
    } else if (waterInfo.g > waterInfo.r) {
        enhancedColor = colorShallow * 1.5;
        distortionKoef = 1.0;
    }

    vec2 distortedUv = texture2D( tDudv, vec2( vUv.x + windDirection.x * time * waveSpeed, vUv.y ) ).rg * waveStrength;
    distortedUv = vUv.xy + vec2( distortedUv.x, distortedUv.y + windDirection.y * time * waveSpeed );
    distortedUv *= distortionKoef;
    vec2 distortion = ( texture2D( tDudv, distortedUv ).rg * 2.0 - 1.0 ) * waveStrength;

    vec4 uv = vec4( vUv );
    uv.xy += distortion;

    vec4 base = texture2DProj( tDiffuse, uv );

    vec3 finalColor = mix(base.rgb, enhancedColor, 0.7);
    // finalColor = (finalColor - 0.5) * 1.12 + 0.5;

    gl_FragColor = vec4(finalColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
