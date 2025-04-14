import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';


class ShaderManager {
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
  ShaderManager.shaderCode['HIGHLIGHT'] = {
    vsh: await loadShader('/shaders/highlight-effect-vsh.glsl'),
    fsh: await loadShader('/shaders/highlight-effect-fsh.glsl'),
  };
  ShaderManager.shaderCode['BAR_MASK'] = {
    vsh: await loadShader('/shaders/bar-mask-vsh.glsl'),
    fsh: await loadShader('/shaders/bar-mask-fsh.glsl'),
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
}
