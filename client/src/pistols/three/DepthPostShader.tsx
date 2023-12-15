/**
 * RGB Shift Shader
 * Shifts red and blue channels from center in opposite directions
 * Ported from https://web.archive.org/web/20090820185047/http://kriss.cx/tom/2009/05/rgb-shift/
 * by Tom Butterworth / https://web.archive.org/web/20090810054752/http://kriss.cx/tom/
 *
 * amount: shift distance (1 is width of input)
 * angle: shift angle in radians
 */

const DepthPostShader = {

  name: 'DepthPostShader',

  uniforms: {
    // 'tDiffuse': { value: null },
    // 'amount': { value: 0.005 },
    // 'angle': { value: 0.0 }
  },

  vertexShader: /* glsl */`
			uniform sampler2D tDiffuse;
			varying float vAspect;
			varying vec2 vUv;
			void main() {
        vec2 texSize = vec2(textureSize(tDiffuse, 0));
        vAspect = texSize.x / texSize.y;
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,

  fragmentShader: /* glsl */`

      #include <common>
      #include <packing>

			varying vec2 vUv;
			varying float vAspect;

			uniform sampler2D tDiffuse;
			uniform sampler2D tDepth;
			uniform sampler2D tPalette;
      uniform float uPalette;
      uniform bool uLightness;
      uniform float uNoiseAmount;
      uniform float uNoiseSize;
      uniform float uTime;
			uniform float uCameraNear;
			uniform float uCameraFar;
			uniform float uCameraFov;
      uniform float uGamma;
      uniform float uColorCount;
      uniform float uDither;
      uniform float uDitherSize;
      uniform float uBayer;

			float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, uCameraNear, uCameraFar );
				float depth = viewZToOrthographicDepth( viewZ, uCameraNear, uCameraFar );
				// warp depth from frustum to camera position
				float a1 = (coord.x - 0.5) * uCameraFov;
				// float a2 = (coord.y - 0.5) * uCameraFov * vAspect;
				depth = 1.0 - ((1.0 - depth) * cos(a1));
				// depth = 1.0 - ((1.0 - depth) * cos(a2));
				return depth;
			}

      #define apply_gamma(a,g)		( (a) > 0.0 ? pow( (a), (1.0/(g)) ) : (a) )

      vec3 apply_dither(vec3 color) {
        vec2 pixelSize = 1.0 / vec2(textureSize(tDiffuse, 0));
        float a = floor(mod(vUv.x / pixelSize.x, uDitherSize));
        float b = floor(mod(vUv.y / pixelSize.y, uDitherSize));
        float c = mod(a + b, uDitherSize);
        vec3 result = vec3(
          (round(color.r * uColorCount + uDither) / uColorCount) * c,
          (round(color.g * uColorCount + uDither) / uColorCount) * c,
          (round(color.b * uColorCount + uDither) / uColorCount) * c
        );
        c = 1.0 - c;
        result.r += (round(color.r * uColorCount - uDither) / uColorCount) * c;
        result.g += (round(color.g * uColorCount - uDither) / uColorCount) * c;
        result.b += (round(color.b * uColorCount - uDither) / uColorCount) * c;
        return result;
      }


      // https://www.shadertoy.com/view/7sfXDn
      float Bayer2(vec2 a) {
        a = floor(a);
        return fract(a.x / 2. + a.y * a.y * .75);
      }
      #define Bayer4(a)   (Bayer2 (.5 *(a)) * .25 + Bayer2(a))
      #define Bayer8(a)   (Bayer4 (.5 *(a)) * .25 + Bayer2(a))
      #define Bayer16(a)  (Bayer8 (.5 *(a)) * .25 + Bayer2(a))
      #define Bayer32(a)  (Bayer16(.5 *(a)) * .25 + Bayer2(a))
      #define Bayer64(a)  (Bayer32(.5 *(a)) * .25 + Bayer2(a))
      vec3 apply_dither_bayer(vec3 color) {
        vec2 frag = vUv * vec2(textureSize(tDiffuse, 0)) * uBayer;
        float dithering = (Bayer64(frag * 0.25) * 2.0 - 1.0) * 0.5;
        float d = color.g + dithering;
        return 1.0 - vec3(d < 0.5);
      }

      // from:
      // https://thebookofshaders.com/11/
      // 2D Noise based on Morgan McGuire @morgan3d
      // https://www.shadertoy.com/view/4dS3Wd
      float random (in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))* 43758.5453123); }
      float apply_noise (float value) {
        vec2 st = vUv * uNoiseSize + mod(uTime * 300.0, 1000.0);
        st.x *= vAspect;
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);
        float n = mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        n = 1.0 - n * uNoiseAmount;
        return value * n;
      }

      vec3 apply_palette(vec3 color, float intensity) {
        if (uPalette > 0.0) {
          vec3 albedo = texture2D(tPalette, vec2(intensity, 0.0) ).rgb;
          if (uLightness) {
            vec3 back = texture2D(tPalette, vec2(0.0, 0.0) ).rgb;
            return (albedo * color) + (back * (1.0- color));
          } else {
            return color * albedo;
          }
        } else if (uLightness) {
          return 1.0 - color;
        }
        return color;
      }

			void main() {
				//vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
				float depth = readDepth( tDepth, vUv );
        depth = apply_gamma(depth, uGamma);
        depth = 1.0 - depth;

        // save depth value
        float intensity = depth;

        // apply noise
        if (uNoiseAmount > 0.0) {
          depth = apply_noise(depth);
        }

        // result
        vec3 color = vec3( depth );

        // color reduction + dither
        if(uColorCount > 0.0) {
          color = apply_dither(color);
        }

        // another dither
        if (uBayer > 0.0) {
          color = apply_dither_bayer(color);
        }

        // palette
        color = apply_palette(color, intensity);

				gl_FragColor.rgb = color;
				gl_FragColor.a = 1.0;
			}

		`

};

export { DepthPostShader }
