uniform vec3 color;
uniform float time;
uniform float waveStrength;
uniform float waveSpeed;
uniform vec2 windDirection;
uniform sampler2D tDiffuse;
uniform sampler2D tDudv;

varying vec4 vUv;

#include <logdepthbuf_pars_fragment>

void main() {
    #include <logdepthbuf_fragment>

    vec2 distortedUv = texture2D( tDudv, vec2( vUv.x + windDirection.x * time * waveSpeed, vUv.y ) ).rg * waveStrength;
    distortedUv = vUv.xy + vec2( distortedUv.x, distortedUv.y + windDirection.y * time * waveSpeed );
    vec2 distortion = ( texture2D( tDudv, distortedUv ).rg * 2.0 - 1.0 ) * waveStrength;

    vec4 uv = vec4( vUv );
    uv.xy += distortion;

    vec4 base = texture2DProj( tDiffuse, uv );

    gl_FragColor = vec4( mix( base.rgb, color, 0.8 ), 1.0 );
    // gl_FragColor = vec4(vUv.xy, 0.0, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}