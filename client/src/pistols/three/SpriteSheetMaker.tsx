import * as THREE from 'three'

export class SpriteSheet {
  textures = []
  material = null

  constructor(SHEET) {
    for (let f = 1; f <= SHEET.frameCount ; ++f ) {
      const frameNumber = ('000' + f.toString()).slice(-2)
      const path = `${SHEET.path}/frame_${frameNumber}.png`
      // console.log(path)
      const tex = new THREE.TextureLoader().load(path)
      this.textures.push(tex)
    }
    this.material = this.makeMaterial()
  }

  makeMaterial() {
    return new THREE.MeshBasicMaterial({
      map: this.textures[0],
      transparent: true,
      side: THREE.DoubleSide,
    })
  }
}

export class Actor {
  sheet: SpriteSheet = null
  material: THREE.MeshBasicMaterial = null
  mesh: THREE.Mesh = null

  constructor(spriteSheet: SpriteSheet, width:number, height:number, flipped: boolean) {
    this.sheet = spriteSheet

    const geometry = new THREE.PlaneGeometry(width, height)
    this.material = this.sheet.makeMaterial()

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.set(0, 0, 1)

    if (flipped) {
      this.mesh.rotation.set(0, Math.PI, 0)
    }
  }
}

