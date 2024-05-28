uniform mat4 textureMatrix;
uniform sampler2D tDudv;
uniform float time;
uniform float waterStrength;
uniform float waterSpeed;
varying vec4 vUv;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
    vUv = textureMatrix * vec4(position, 1.0);
    
    vec2 uv = position.xy;
    vec2 distortion = texture2D(tDudv, uv + vec2(time * waterSpeed, 0.0)).rg;
    distortion = (distortion * 2.0 - 1.0) * waterStrength;  // Map to -1 to 1 range

    vec3 newPosition = position + vec3(distortion.xy, 0.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    
    #include <logdepthbuf_vertex>
}