varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-modelViewPosition.xyz);
  
  gl_Position = projectionMatrix * modelViewPosition;
}