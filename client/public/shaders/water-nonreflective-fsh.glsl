varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform sampler2D tDudv;
uniform sampler2D waterMap;
uniform vec3 colorShallow;
uniform vec3 colorDeep;
uniform float time;
uniform vec2 windDirection;
uniform float waterStrength;
uniform float waterSpeed;
uniform float waveStrength;
uniform float waveSpeed;

const float shininess = 120.0;
const vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
const vec3 specularColor = vec3(1.0, 1.0, 1.0);

void main() {
  // Flip UVs along x-axis to match reflective water
  vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
  
  // Sample depth map with flipped UVs
  vec4 waterInfo = texture2D(waterMap, flippedUv);
  
  // Skip water areas that are too dark (optional)
  if (all(lessThan(waterInfo.rgb, vec3(0.05)))) {
    discard;
  }

  // Determine base water color
  vec3 enhancedColor;
  float distortionKoef = 1.0;
  if (waterInfo.r > waterInfo.g) {
    enhancedColor = colorDeep * 1.5;
  } else {
    enhancedColor = colorShallow * 1.5;
  }

  // Create distortion effect with flipped UVs
  vec2 distortedUv = texture2D(tDudv, vec2(flippedUv.x + windDirection.x * time * waveSpeed, flippedUv.y)).rg * waveStrength;
  distortedUv = flippedUv.xy + vec2(distortedUv.x, distortedUv.y + windDirection.y * time * waveSpeed);
  distortedUv *= distortionKoef;
  vec2 distortion = (texture2D(tDudv, distortedUv).rg * 2.0 - 1.0) * waveStrength;

  // Basic lighting
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  
  // Perturb normal for reflections
  vec3 perturbedNormal = normalize(vNormal + vec3(distortion.x, 0.0, distortion.y) * 0.5);
  
  // Calculate specular reflection
  vec3 halfwayDir = normalize(lightDir + vViewDir);
  float specular = pow(max(dot(perturbedNormal, halfwayDir), 0.0), shininess);
  
  // Enhanced Fresnel effect for edge highlights and environment reflection
  float fresnel = pow(1.0 - max(dot(perturbedNormal, vViewDir), 0.0), 5.0);
  
  // Simulate environment reflection using view direction and perturbed normal
  vec3 reflectDir = reflect(-vViewDir, perturbedNormal);
  vec3 envReflection = vec3(0.7, 0.8, 0.9); // Sky-like color
  
  // Darken reflection when looking down at water
  float verticalFactor = abs(reflectDir.y);
  envReflection = mix(envReflection, vec3(0.3, 0.4, 0.5), verticalFactor);
  
  // Final color with enhanced reflection
  vec3 finalColor = enhancedColor * (diffuse * 0.5 + 0.5) +     // Diffuse lighting
                   specularColor * specular * 0.7 +             // Specular highlights (increased)
                   envReflection * fresnel * 0.5;               // Environment reflection
  
  gl_FragColor = vec4(finalColor, 1.0);
}