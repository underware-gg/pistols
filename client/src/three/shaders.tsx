import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// Import global shaders that get prepended to all shaders
import commonGlsl from '../shaders/common.glsl'
import noiseGlsl from '../shaders/noise.glsl'

// Import individual shader files
import grassVsh from '../shaders/grass-model-vsh.glsl'
import grassFsh from '../shaders/grass-model-fsh.glsl'
import waterVsh from '../shaders/water-model-vsh.glsl'
import waterFsh from '../shaders/water-model-fsh.glsl'
import waterNonreflectiveVsh from '../shaders/water-nonreflective-vsh.glsl'
import waterNonreflectiveFsh from '../shaders/water-nonreflective-fsh.glsl'
import highlightVsh from '../shaders/highlight-effect-vsh.glsl'
import highlightFsh from '../shaders/highlight-effect-fsh.glsl'
import interactibleMaskBlurVsh from '../shaders/interactible-mask-blur-vsh.glsl'
import interactibleMaskBlurFsh from '../shaders/interactible-mask-blur-fsh.glsl'
import interactibleMaskVsh from '../shaders/interactible-mask-vsh.glsl'
import interactibleMaskFsh from '../shaders/interactible-mask-fsh.glsl'
import interactibleTextureFsh from '../shaders/interactible-texture-fsh.glsl'
import textureBlurVsh from '../shaders/texture-blur-vsh.glsl'
import textureBlurFsh from '../shaders/texture-blur-fsh.glsl'
import maskOcclusionVsh from '../shaders/mask-occlusion-vsh.glsl'
import maskOcclusionFsh from '../shaders/mask-occlusion-fsh.glsl'

export class ShaderManager {
  static shaderCode = {};
};

// Recreate your original global shader concatenation system
export function loadShaders() {
  // Build global shader code exactly like your original system
  const globalShadersCode = [commonGlsl, noiseGlsl];
  
  const loadShader = (shaderCode: string) => {
    let result = '';
    for (let i = 0; i < globalShadersCode.length; ++i) {
      result += globalShadersCode[i] + '\n';
    }
    return result + '\n' + shaderCode;
  }

  // Build shader code exactly like your original system
  ShaderManager.shaderCode['GRASS'] = {
    vsh: loadShader(grassVsh),
    fsh: loadShader(grassFsh),
  };
  ShaderManager.shaderCode['GRASS_SHADOW'] = {
    vsh: loadShader(grassVsh),
    fsh: THREE.ShaderLib.shadow.fragmentShader,
  };
  ShaderManager.shaderCode['WATER'] = {
    vsh: loadShader(waterVsh),
    fsh: loadShader(waterFsh),
  };
  ShaderManager.shaderCode['WATER_NONREFLECTIVE'] = {
    vsh: loadShader(waterNonreflectiveVsh),
    fsh: loadShader(waterNonreflectiveFsh),
  };
  ShaderManager.shaderCode['HIGHLIGHT'] = {
    vsh: loadShader(highlightVsh),
    fsh: loadShader(highlightFsh),
  };
  ShaderManager.shaderCode['INTERACTIBLE_MASK_BLUR'] = {
    vsh: loadShader(interactibleMaskBlurVsh),
    fsh: loadShader(interactibleMaskBlurFsh),
  };
  ShaderManager.shaderCode['INTERACTIBLE_MASK'] = {
    vsh: loadShader(interactibleMaskVsh),
    fsh: loadShader(interactibleMaskFsh),
  };
  ShaderManager.shaderCode['INTERACTIBLE_TEXTURE'] = {
    vsh: loadShader(interactibleMaskVsh),
    fsh: loadShader(interactibleTextureFsh),
  };
  ShaderManager.shaderCode['TEXTURE_BLUR'] = {
    vsh: loadShader(textureBlurVsh),
    fsh: loadShader(textureBlurFsh),
  };
  ShaderManager.shaderCode['MASK_OCCLUSION'] = {
    vsh: loadShader(maskOcclusionVsh),
    fsh: loadShader(maskOcclusionFsh),
  };
}

export class ShaderMaterial extends THREE.ShaderMaterial {

  constructor(shaderType, parameters) {
    parameters.vertexShader = ShaderManager.shaderCode[shaderType].vsh;
    parameters.fragmentShader = ShaderManager.shaderCode[shaderType].fsh;

    super(parameters);

    this.uniforms.time = { value: 0.0 };
    
    this.customProgramCacheKey = function() {
      return shaderType;
    };
  }

  setUniformValue(name, value) {
    this.uniforms[name] = { value: value };
  }

  getUniforms() {
    return this.uniforms
  }
};

export class ReflectorMaterial extends Reflector {

  constructor(shaderType, geometry, parameters) {
    super(geometry, parameters);

    (this.material as ShaderMaterial).fragmentShader = ShaderManager.shaderCode[shaderType].fsh;
    (this.material as ShaderMaterial).vertexShader = ShaderManager.shaderCode[shaderType].vsh;

    this.setUniformValue('time', 0.0)
  }

  setUniformValue(name, value) {
    (this.material as ShaderMaterial).uniforms[name] = { value: value };
  }

  getUniforms() {
    return (this.material as ShaderMaterial).uniforms
  }

  dispose() {
    if (this.material) {
      (this.material as ShaderMaterial).dispose();
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    // Call parent dispose method which handles the render target
    super.dispose();
  }
}

export class NonReflectorMaterial extends THREE.Mesh {

  constructor(shaderType, geometry) {
    // Create a ShaderMaterial with the specified shader
    const material = new ShaderMaterial(shaderType, {
      uniforms: {
        time: { value: 0.0 },
        waterStrength: { value: 0.04 },
        waterSpeed: { value: 0.03 },
        waveStrength: { value: 0.04 },
        waveSpeed: { value: 0.05 },
        windDirection: { value: new THREE.Vector2(1.0, 0.0) },
        tDudv: { value: null },
        waterMap: { value: null },
        colorDeep: { value: new THREE.Color(0x35595e) },
        colorShallow: { value: new THREE.Color(0x597f86) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Add customProgramCacheKey to fix shader compilation
    material.customProgramCacheKey = function() {
      return 'NonReflectorMaterial-' + shaderType;
    };
    
    super(geometry, material);
  }

  setUniformValue(name, value) {
    (this.material as ShaderMaterial).uniforms[name] = { value: value };
  }

  getUniforms() {
    return (this.material as ShaderMaterial).uniforms
  }

  dispose() {
    if (this.material) {
      (this.material as ShaderMaterial).dispose();
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
  }
}

