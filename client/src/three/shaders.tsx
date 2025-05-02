import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';


export class ShaderManager {
  static shaderCode = {};
};

export async function loadShaders() {
  const loadText = async (url) => {
    const d = await fetch(url);
    return await d.text();
  };

  const globalShaders = [
    'common.glsl',
    'noise.glsl',
  ];

  const globalShadersCode = [];
  for (let i = 0; i < globalShaders.length; ++i) {
    globalShadersCode.push(await loadText('/shaders/' + globalShaders[i]));
  }

  const loadShader = async (url) => {
    const d = await fetch(url);
    let shaderCode = '';
    for (let i = 0; i < globalShadersCode.length; ++i) {
      shaderCode += globalShadersCode[i] + '\n';
    }
    return shaderCode + '\n' + await d.text();
  }

  ShaderManager.shaderCode['GRASS'] = {
    vsh: await loadShader('/shaders/grass-model-vsh.glsl'),
    fsh: await loadShader('/shaders/grass-model-fsh.glsl'),
  };
  ShaderManager.shaderCode['GRASS_SHADOW'] = {
    vsh: await loadShader('/shaders/grass-model-vsh.glsl'),
    fsh: THREE.ShaderLib.shadow.fragmentShader,
  };
  ShaderManager.shaderCode['WATER'] = {
    vsh: await loadShader('/shaders/water-model-vsh.glsl'),
    fsh: await loadShader('/shaders/water-model-fsh.glsl'),
  };
  ShaderManager.shaderCode['WATER_NONREFLECTIVE'] = {
    vsh: await loadShader('/shaders/water-nonreflective-vsh.glsl'),
    fsh: await loadShader('/shaders/water-nonreflective-fsh.glsl'),
  };
  ShaderManager.shaderCode['HIGHLIGHT'] = {
    vsh: await loadShader('/shaders/highlight-effect-vsh.glsl'),
    fsh: await loadShader('/shaders/highlight-effect-fsh.glsl'),
  };
  ShaderManager.shaderCode['INTERACTIBLE_MASK_BLUR'] = {
    vsh: await loadShader('/shaders/interactible-mask-blur-vsh.glsl'),
    fsh: await loadShader('/shaders/interactible-mask-blur-fsh.glsl'),
  };
  ShaderManager.shaderCode['INTERACTIBLE_MASK'] = {
    vsh: await loadShader('/shaders/interactible-mask-vsh.glsl'),
    fsh: await loadShader('/shaders/interactible-mask-fsh.glsl'),
  };
  ShaderManager.shaderCode['INTERACTIBLE_TEXTURE'] = {
    vsh: await loadShader('/shaders/interactible-mask-vsh.glsl'),
    fsh: await loadShader('/shaders/interactible-texture-fsh.glsl'),
  };
  ShaderManager.shaderCode['TEXTURE_BLUR'] = {
    vsh: await loadShader('/shaders/texture-blur-vsh.glsl'),
    fsh: await loadShader('/shaders/texture-blur-fsh.glsl'),
  };
  ShaderManager.shaderCode['MASK_OCCLUSION'] = {
    vsh: await loadShader('/shaders/mask-occlusion-vsh.glsl'),
    fsh: await loadShader('/shaders/mask-occlusion-fsh.glsl'),
  };
}


export class ShaderMaterial extends THREE.ShaderMaterial {

  constructor(shaderType, parameters) {
    parameters.vertexShader = ShaderManager.shaderCode[shaderType].vsh;
    parameters.fragmentShader = ShaderManager.shaderCode[shaderType].fsh;

    super(parameters);

    this.uniforms.time = { value: 0.0 };
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

