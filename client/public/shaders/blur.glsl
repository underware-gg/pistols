const int LOD = 1;
const int sLOD = 1 << LOD;

float PI = 3.14159265359;

float gaussian(vec2 i, int samples) {
  float sigma = float(samples) * .25;
  return exp( -.5* dot(i/=sigma,i) ) / ( 2.0 * PI * sigma*sigma );
}

vec4 blur(sampler2D sp[5], vec2 U[5], vec2 scale, int samples) {
  vec4 O = vec4(0);  
  int s = max(samples / sLOD, 1);
  
  for ( int i = 0; i < s*s; i++ ) {
    vec2 d = vec2(i%s, i/s)*float(sLOD) - float(samples)/2.;
    vec4 texColor = textureLod( sp[0], U[0] + scale * d, float(LOD) );

    texColor = mix(texColor, textureLod( sp[1], U[1] + scale * d, float(LOD) ), 1.0 - texColor.a);
    texColor = mix(texColor, textureLod( sp[2], U[2] + scale * d, float(LOD) ), 1.0 - texColor.a);
    texColor = mix(texColor, textureLod( sp[3], U[3] + scale * d, float(LOD) ), 1.0 - texColor.a);
    texColor = mix(texColor, textureLod( sp[4], U[4] + scale * d, float(LOD) ), 1.0 - texColor.a);

    texColor.rgb = linearToSRGB(texColor.rgb);
    O += gaussian(d, samples) * texColor;
  }
  
  return O / O.a;
}