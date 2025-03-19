import * as THREE from 'three';
import * as shaders from './shaders.tsx'
import { _gui, _statsEnabled } from './game.tsx';

const GRASS_PATCH_SIZE_LENGTH = 0.5;
const GRASS_PATCH_SIZE_DEPTH = 0.51;
const GRASS_WIDTH = 0.012;
const GRASS_HEIGHT = 0.1;
const MAX_GRASS_GROWTH = 0.2;
const NUM_GRASS = (32) * 5;
const GRASS_SEGMENTS_HIGH = 6;
const GRASS_VERTICES_HIGH = (GRASS_SEGMENTS_HIGH + 1) * 2;

export class Grass extends THREE.Object3D {

  private totalTime = 0.0;
  private lastTime = 0.0;
  private windUpdateFPS = 8;
  private geometryHigh: THREE.InstancedBufferGeometry;
  private materialHigh: shaders.ShaderMaterial;
  private depthMaterial: shaders.ShaderMaterial;
  private mesh: THREE.InstancedMesh;

  private grassDebugObject = {
    baseColor: '#655d06',
    tipColor: '#bbc624'
  }

  constructor(params: { height: number; offset: number; heightmap: any; dims: any; transforms: any; growth: number }) {
    super();

    this.geometryHigh = this.createGrassGeometry(GRASS_SEGMENTS_HIGH, params.transforms);

    this.materialHigh = this.createGrassMaterial(
      "GRASS",
      {
        segments: GRASS_SEGMENTS_HIGH,
        vertices: GRASS_VERTICES_HIGH,
        height: params.height,
        offset: params.offset,
        heightmap: params.heightmap,
        dims: params.dims,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        alphaTest: 0.5,
        growth: params.growth
      }
    );

    this.depthMaterial = this.createGrassMaterial(
      "GRASS_SHADOW",
      {
        segments: GRASS_SEGMENTS_HIGH,
        vertices: GRASS_VERTICES_HIGH,
        height: params.height,
        offset: params.offset,
        heightmap: params.heightmap,
        dims: params.dims,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        alphaTest: 0.5,
        growth: params.growth
      }
    );

    this.mesh = this.createMesh(this.geometryHigh, this.materialHigh, this.depthMaterial, params.transforms);
    this.add(this.mesh);

    if (_statsEnabled) {
      this.setupGUI();
    }
  }

  private createIrregularEllipse(numPoints: number, radiusX: number, radiusZ: number, perturbationScale: number) {
    const points = [];
    for (let i = 0; i < numPoints; ++i) {
      const angle = (i / numPoints) * Math.PI * 2;
      const perturbation = (Math.random() - 0.5) * perturbationScale;
      const x = (radiusX + perturbation) * Math.cos(angle);
      const z = (radiusZ + perturbation) * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }

    points.push(points[0]);

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;

    return curve;
  }

  private isInsideIrregularEllipse(x: number, z: number, offsetX: number, offsetZ: number, shapePoints: THREE.Vector3[]) {
    let inside = false;

    for (let i = 0, j = shapePoints.length - 1; i < shapePoints.length; j = i++) {
      const xi = shapePoints[i].x + offsetX, zi = shapePoints[i].z + offsetZ;
      const xj = shapePoints[j].x + offsetX, zj = shapePoints[j].z + offsetZ;

      const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private createGrassGeometry(segments: number, transforms: any[]) {
    const VERTICES = (segments + 1) * 2;
    const indices = [];
    for (let i = 0; i < segments; ++i) {
      const vi = i * 2;
      indices.push(
        vi + 0, vi + 1, vi + 2,
        vi + 2, vi + 1, vi + 3,
        VERTICES + vi + 2, VERTICES + vi + 1, VERTICES + vi + 0,
        VERTICES + vi + 3, VERTICES + vi + 1, VERTICES + vi + 2
      );
    }

    const numPoints = 20;
    const perturbationScale = (GRASS_PATCH_SIZE_LENGTH > GRASS_PATCH_SIZE_DEPTH ? GRASS_PATCH_SIZE_LENGTH : GRASS_PATCH_SIZE_DEPTH) * 0.5;

    const vertID = new Uint8Array(VERTICES * 2);
    for (let i = 0; i < VERTICES * 2; ++i) {
      vertID[i] = i;
    }

    const offsets = [];

    const positions = transforms.map((transform: { decompose: (arg0: THREE.Vector3, arg1: THREE.Quaternion, arg2: THREE.Vector3) => void; }) => {
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      transform.decompose(position, rotation, scale);
      return position;
    });

    transforms.forEach((transform: any, transformIndex: number) => {
      const position = positions[transformIndex];
      const irregularEllipsePoints = this.createIrregularEllipse(numPoints, GRASS_PATCH_SIZE_LENGTH, GRASS_PATCH_SIZE_DEPTH, perturbationScale);
      const shapePoints = irregularEllipsePoints.getPoints(numPoints);

      while (offsets.length < (transformIndex + 1) * NUM_GRASS * 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random());
        const perturbation = 0.1 * (Math.random() - 0.5);
        const x = GRASS_PATCH_SIZE_LENGTH * (radius + perturbation) * Math.cos(angle) + position.x;
        const z = GRASS_PATCH_SIZE_DEPTH * (radius + perturbation) * Math.sin(angle) + position.z;

        if (this.isInsideIrregularEllipse(x, z, position.x, position.z, shapePoints)) {
          offsets.push(x, 0, z);
        }
      }
    });

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = transforms.length * NUM_GRASS;
    geo.setAttribute('vertIndex', new THREE.Uint8BufferAttribute(vertID, 1));
    geo.setAttribute('position', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1 + (GRASS_PATCH_SIZE_LENGTH > GRASS_PATCH_SIZE_DEPTH ? GRASS_PATCH_SIZE_LENGTH : GRASS_PATCH_SIZE_DEPTH) * 2);
    return geo;
  }

  private createGrassMaterial(name: string, params: { segments?: number; vertices?: number; height: number; offset: number; heightmap: any; dims: any; transparent?: boolean; depthWrite?: boolean; depthTest?: boolean; alphaTest?: number; growth?: number }) {
    let material = new shaders.ShaderMaterial(name, {})
    material.setUniformValue('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT + (MAX_GRASS_GROWTH * params.growth)));
    material.setUniformValue('grassParams', new THREE.Vector4(GRASS_SEGMENTS_HIGH, GRASS_VERTICES_HIGH, params.height, params.offset));
    material.setUniformValue('heightmap', params.heightmap);
    material.setUniformValue('heightParams', new THREE.Vector4(params.dims, 0, 0, 0))
    material.setUniformValue('windDirection', new THREE.Vector3(0.0, 0.0, -1.0))
    material.setUniformValue('windStrength', 8)
    material.setUniformValue('windSpeed', 1.0)
    material.setUniformValue('gradientOffset', 1.9)
    material.setUniformValue('baseColor', new THREE.Color(this.grassDebugObject.baseColor))
    material.setUniformValue('tipColor', new THREE.Color(this.grassDebugObject.tipColor))
    material.setUniformValue('opacity', 1.0)

    return material;
  }

  private createMesh(geometry: THREE.InstancedBufferGeometry, material: any, depthMaterial: THREE.Material, transforms: any[]) {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length * NUM_GRASS);

    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;

    if (depthMaterial) {
      mesh.customDepthMaterial = depthMaterial;
    }

    return mesh;
  }

  private setupGUI() {
    let grassFolder = _gui.addFolder("GrassFolder");
    grassFolder
      .add(this, 'windUpdateFPS')
      .name('windUpdateFPS')
      .min(0).max(60).step(1);
    grassFolder
      .add(this.materialHigh.getUniforms()['grassSize'].value, 'x')
      .name('grassSize - x')
      .min(0.0).max(0.2).step(0.0001);
    grassFolder
      .add(this.materialHigh.getUniforms()['grassSize'].value, 'y')
      .name('grassSize - y')
      .min(0.0).max(1).step(0.0001);
    grassFolder
      .add(this.materialHigh.getUniforms()['grassParams'].value, 'z')
      .name('grassParams - z')
      .min(-2).max(2).step(0.0001);
    grassFolder
      .add(this.materialHigh.getUniforms()['grassParams'].value, 'w')
      .name('grassParams - w')
      .min(-2).max(2).step(0.0001);
    grassFolder
      .add(this.materialHigh.getUniforms()['windDirection'].value, 'x')
      .name('windDirection - x')
      .min(-1.0).max(1.0).step(0.01);
    grassFolder
      .add(this.materialHigh.getUniforms()['windDirection'].value, 'z')
      .name('windDirection - z')
      .min(-1.0).max(1.0).step(0.01);
    grassFolder
      .add(this.materialHigh.getUniforms()['windStrength'], 'value')
      .name('windStrength')
      .min(0.0).max(15.0).step(0.1);
    grassFolder
      .add(this.materialHigh.getUniforms()['windSpeed'], 'value')
      .name('windSpeed')
      .min(0.0).max(3.0).step(0.01);
    grassFolder
      .add(this.materialHigh.getUniforms()['gradientOffset'], 'value')
      .name('gradientOffset')
      .min(0.0).max(10.0).step(0.01);
    grassFolder
      .addColor(this.grassDebugObject, 'baseColor')
      .onChange(() => {
        this.materialHigh.setUniformValue('baseColor', new THREE.Color(this.grassDebugObject.baseColor))
      })
      .name('baseColor');
    grassFolder
      .addColor(this.grassDebugObject, 'tipColor')
      .onChange(() => {
        this.materialHigh.setUniformValue('tipColor', new THREE.Color(this.grassDebugObject.tipColor))
      })
      .name('tipColor');
  }

  public addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  public update(timeElapsed: number) {
    this.totalTime += timeElapsed;
    this.lastTime += timeElapsed;
    if (this.lastTime >= 1 / this.windUpdateFPS) {
      this.materialHigh.setUniformValue('time', this.totalTime);
      if (this.depthMaterial) {
        this.depthMaterial.setUniformValue('time', this.totalTime);
      }

      this.lastTime = 0;
    }
  }

  public growGrass(height: number) {
    this.materialHigh.setUniformValue('grassSize', new THREE.Vector2(GRASS_WIDTH, height));
    this.depthMaterial.setUniformValue('grassSize', new THREE.Vector2(GRASS_WIDTH, height));
  }

  public getGrassHeight() {
    return this.materialHigh.getUniforms()['grassSize'].value
  }

  public setWind(strength: number, speed: number) {
    this.materialHigh.setUniformValue('windStrength', strength)
    this.materialHigh.setUniformValue('windSpeed', speed)

    this.depthMaterial.setUniformValue('windStrength', strength)
    this.depthMaterial.setUniformValue('windSpeed', speed)
  }

  public setGrassGrowth(growth: number) {
    this.materialHigh.setUniformValue('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT + (MAX_GRASS_GROWTH * growth)));
    this.depthMaterial.setUniformValue('grassSize', new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT + (MAX_GRASS_GROWTH * growth)));
  }

  public getWind() {
    return {
      strength: this.materialHigh.getUniforms()['windStrength'].value,
      speed: this.materialHigh.getUniforms()['windSpeed'].value
    }
  }

  public setDirection(direction: number) {
    this.materialHigh.setUniformValue('windDirection', new THREE.Vector3(0.0, 0.0, direction))
    this.depthMaterial.setUniformValue('windDirection', new THREE.Vector3(0.0, 0.0, direction))
  }

  public dispose() {
    this.geometryHigh.dispose();

    this.materialHigh.dispose();
    this.depthMaterial.dispose();

    this.removeFromParent();
  }
}
