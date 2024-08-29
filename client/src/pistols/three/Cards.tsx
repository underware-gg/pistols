import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import TWEEN, { Group, Tween } from '@tweenjs/tween.js'
import { CardTextureName } from '../data/assets'
import { ASPECT } from './game'
import { ShaderMaterial } from './shaders'

const CARD_WIDTH = 0.27
const CARD_HEIGHT = 0.38
const ANIMATION_DURATION = 600

const SPECIAL_SLIDE_IN_DURATION = 1000
const SPECIAL_SLIDE_PAUSE_DURATION = 1700
const SPECIAL_SLIDE_OUT_DURATION = 300

const X_OFFSET = 0.15
const TARGET_RADIUS = 2
const START_RADIUS = 3
const CIRCLE_CUTOUT = Math.PI / 16
const GLOBAL_ROTATION = Math.PI / 18

const X_SCALE = 1
const Y_SCALE = 2

interface OriginalCardState {
  positionX: number;
  positionY: number;
  rotation: number;
}

interface CardUserMetadata {
  rotationAmount: number,
  isSpecialAnimationInProgress: boolean,
  isHighlighted: boolean
}

export class CardMesh extends THREE.Mesh {
  public currentAnimations: {
    position: Tween<any>,
    rotation: Tween<any>,
    scale: Tween<any>,
  }

  public metadata: CardUserMetadata
  private isIdlePlaying = false
  private originalPosition: THREE.Vector3

  private bloomMesh: THREE.Mesh

  constructor(frontTexture: THREE.Texture, backTexture: THREE.Texture) {
    // Create front and back geometries
    const frontGeometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT)
    const backGeometry = frontGeometry.clone().rotateY(Math.PI)

    // Merge geometries
    const mergedGeometry = mergeGeometries([frontGeometry, backGeometry], false)
    mergedGeometry.addGroup(0, frontGeometry.index.count, 0);
    mergedGeometry.addGroup(frontGeometry.index.count, backGeometry.index.count, 1);

    // Create materials
    const materials = [
      new THREE.MeshBasicMaterial({ map: frontTexture, alphaTest: 0.5, transparent: true, opacity: 0, depthTest: false }),
      new THREE.MeshBasicMaterial({ map: backTexture, alphaTest: 0.5, transparent: true, opacity: 0, depthTest: false })
    ]

    super(mergedGeometry, materials)
    this.name = "Card"

    const bloomGeometry = frontGeometry.clone();

    const scale = 0.05
    const heightScale = CARD_WIDTH / CARD_HEIGHT * scale
    bloomGeometry.scale(1 + scale, 1 + heightScale, 1 + scale);

    const bloomMaterial = new ShaderMaterial("HIGHLIGHT", {
      transparent: true,
      depthTest: false,
      alphaTest: 0.5,
    })
    bloomMaterial.setUniformValue('uTexture', frontTexture)
    bloomMaterial.setUniformValue('uBloomStrength', 1.35)
    bloomMaterial.setUniformValue('uBloomColor', new THREE.Color('#F0EAD6'))

    this.bloomMesh = new THREE.Mesh(bloomGeometry, bloomMaterial)
    
    this.bloomMesh.visible = false
    this.bloomMesh.renderOrder = -1
    this.add(this.bloomMesh)

    this.currentAnimations = {
      position: null,
      rotation: null,
      scale: null
    }

    this.metadata = {
      rotationAmount: 0,
      isSpecialAnimationInProgress: false,
      isHighlighted: false
    }
  }

  public resetCardAnimations() {
    this.currentAnimations.position?.stop()
    this.currentAnimations.position = null
    this.currentAnimations.rotation?.stop()
    this.currentAnimations.rotation = null
    this.currentAnimations.scale?.stop()
    this.currentAnimations.scale = null
    
    if(this.isIdlePlaying) {
      this.isIdlePlaying = false
      this.position.x = this.originalPosition.x
      this.position.y = this.originalPosition.y
    }
  }

  public playIdle(range: number = 0.01) {
    this.resetCardAnimations()

    this.isIdlePlaying = true
    this.originalPosition = this.position

    this.animateIdle(range)
  }

  private animateIdle(range: number) {
    const startRange = (-range / 2)

    const newTarget = {
      x: [
        this.originalPosition.x + (startRange + Math.random() * range), 
        this.originalPosition.x + (startRange + Math.random() * range), 
        this.originalPosition.x + (startRange + Math.random() * range), 
        this.originalPosition.x + (startRange + Math.random() * range), 
        this.originalPosition.x
      ], 
      y: [
        this.originalPosition.y + (startRange + Math.random() * range), 
        this.originalPosition.y + (startRange + Math.random() * range), 
        this.originalPosition.y + (startRange + Math.random() * range), 
        this.originalPosition.y + (startRange + Math.random() * range), 
        this.originalPosition.y
      ], 
    }

    const duration = (1 + Math.random()) * 3000

    this.currentAnimations.position = new TWEEN.Tween(this.position)
      .to(newTarget, duration)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .onComplete(() => { 
          this.animateIdle(range)
      })
      .start()
  }

  public createDataElement() {
    //TODO
  }

  public dispose() {
    this.resetCardAnimations()

    this.geometry.dispose();
    (this.material[0] as THREE.MeshBasicMaterial).map?.dispose();
    (this.material[0] as THREE.MeshBasicMaterial).dispose();
    (this.material[1] as THREE.MeshBasicMaterial).map?.dispose();
    (this.material[1] as THREE.MeshBasicMaterial).dispose();
    this.removeFromParent()
  }

  public changeCardFace(texture: THREE.Texture) {
    this.material[0].map = texture
  }

  public highlightCard() {
    this.metadata.isHighlighted = true
    this.bloomMesh.visible = true
  }

  public removeHighlight() {
    this.metadata.isHighlighted = false
    this.bloomMesh.visible = false
  }

}

export class Card extends THREE.Group { //This is a group that serves as a wrapper for the card mesh for better and easier animation handling
  
  public userAnimations: {
    position: Tween<any>,
    rotation: Tween<any>,
    scale: Tween<any>,
  }

  public card: CardMesh
  
  constructor(frontTexture: THREE.Texture, backTexture: THREE.Texture) {
    super()

    this.card = new CardMesh(frontTexture, backTexture)
    this.card.position.set(0, CARD_HEIGHT * 0.5, 0)

    this.add(this.card)

    this.userAnimations = {
      position: null,
      rotation: null,
      scale: null
    }
  }

  public resetCardAnimations() {
    this.userAnimations.position?.stop()
    this.userAnimations.position = null
    this.userAnimations.rotation?.stop()
    this.userAnimations.rotation = null
    this.userAnimations.scale?.stop()
    this.userAnimations.scale = null

    this.card.resetCardAnimations()
  }

  public generateCardRandomRotation(force: boolean = false) {
    if (this.card.metadata.rotationAmount == 0 || force) {
      const randomRotation = ( -0.05 + Math.random() * 0.1)
      this.card.metadata.rotationAmount = randomRotation
    }
  }

  public getCardRandomRotation() {
    return this.card.metadata.rotationAmount
  }

  public updateCardFace(cardFace: THREE.Texture) {
    this.card.changeCardFace(cardFace)
  }

  public playIdle() {
    this.card.playIdle()
  }

  public isHighlighted() {
    return this.card.metadata.isHighlighted
  }

  public highlightCard() {
    this.card.highlightCard()
  }

  public removeHighlight() {
    this.card.removeHighlight()
  }

  public fadeIn() {
    new TWEEN.Tween(this.card.material[0])
      .to({ opacity: 1 }, ANIMATION_DURATION * 0.8)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
    new TWEEN.Tween(this.card.material[1])
      .to({ opacity: 1 }, ANIMATION_DURATION * 0.8)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }

  public rotateToCardFront(isLeft: boolean, spins: number = 0, duration: number = ANIMATION_DURATION) {
    this.card.currentAnimations.rotation = new TWEEN.Tween(this.card.rotation)
      .to({ y: (isLeft ? -1 : 1) * (Math.PI + (Math.PI * 2 * spins)) }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => {
        this.card.rotation.set(0, Math.PI, 0)
      })
      .start()
  }

  public rotateToCardBack(isLeft: boolean, spins: number = 0, duration: number = ANIMATION_DURATION) {
    this.card.currentAnimations.rotation = new TWEEN.Tween(this.card.rotation)
      .to({ y: (isLeft ? -1 : 1) * (0 + (Math.PI * 2 * spins)) }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => {
        this.card.rotation.set(0, 0, 0)
      })
      .start()
  }

}

export class CardsHand extends THREE.Group {
  public isExpanded: Boolean = false
  public isAnimatingExpand: Boolean = false

  public areDetailsShown: Boolean = false
  public isAnimatingDetails: Boolean = false

  private cardAssets: THREE.Texture[]
  private camera: THREE.PerspectiveCamera

  private currentSceneCards: THREE.Group = new THREE.Group() //Cards currently above duelists
  
  private isLeft = false
  private isCombining = false

  private cameraBounds: {
    left: number,
    right: number,
    top: number,
    bottom: number,
  }

  private objectName: string
  private originalCardStates: OriginalCardState[] = []
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, scenePosition: THREE.Vector3, cardAssets: THREE.Texture[], isLeft: boolean, name: string) {
    super()

    this.camera = camera
    this.cardAssets = cardAssets
    this.isLeft = isLeft
    this.objectName = name

    this.currentSceneCards.position.copy(scenePosition)
    this.currentSceneCards.position.x += (this.isLeft ? X_OFFSET : -X_OFFSET)
    this.currentSceneCards.position.y -= (CARD_HEIGHT * 0.5)
    this.currentSceneCards.rotateZ((2 * Math.PI + (isLeft ? -1 : 1) * GLOBAL_ROTATION) % ( 2 * Math.PI))

    this.calculateCameraBounds(-3)

    scene.add(this.currentSceneCards)
  }

  //TODO recalculate when screen resizes?
  //TODO make z a const of -3 as a normal input
  private calculateCameraBounds(z: number) {
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(z)
    const width = height * this.camera.aspect

    this.cameraBounds = {
      left: -width / 2,
      right: width / 2,
      top: height / 2,
      bottom: -height / 2,
    }
  }

  public expandHand() {
    if (this.isAnimatingExpand) return

    this.isExpanded = true
    this.isAnimatingExpand = true

    this.children.forEach((cardWrapper: Card, index: number) => {
      if (cardWrapper instanceof Card && !cardWrapper.isHighlighted()) {
        cardWrapper.highlightCard()
        const card = cardWrapper.card

        const targetPosition = card.position.y + CARD_HEIGHT * 0.4
        card.currentAnimations.position = new TWEEN.Tween(card.position)
          .to({ y: targetPosition }, ANIMATION_DURATION / 2)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onComplete(() => {
            card.playIdle(0.006)
          })
          .start()

        const targetScale = card.scale.clone().addScalar(0.2)
        card.currentAnimations.scale = new TWEEN.Tween(card.scale)
          .to(targetScale, ANIMATION_DURATION / 2)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start() 
        }
    })

    setTimeout(() => {
      this.isAnimatingExpand = false
    }, (ANIMATION_DURATION / 2) + 10)
  }

  public collapseHand() {
    if (this.isAnimatingExpand || !this.isExpanded) return

    this.isExpanded = false
    this.isAnimatingExpand = true

    this.children.forEach((cardWrapper: Card) => {
      cardWrapper?.resetCardAnimations()
      cardWrapper.removeHighlight()
      const card = cardWrapper.card

      const targetPosition = card.position.y - CARD_HEIGHT * 0.4
      card.currentAnimations.position = new TWEEN.Tween(card.position)
        .to({ y: targetPosition }, ANIMATION_DURATION / 2)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()

      const targetScale = card.scale.clone().addScalar(-0.2)
      card.currentAnimations.scale = new TWEEN.Tween(card.scale)
        .to(targetScale, ANIMATION_DURATION / 2)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()
    })

    setTimeout(() => {
      this.isAnimatingExpand = false
    }, (ANIMATION_DURATION / 2) + 10)
  }

  public sendCardsToBack() {
    this.children.forEach((child, index) => {
      child.renderOrder = 0
      child.children[0].renderOrder = index
    })
  }

  public sendCardsToFront() {
    this.children.forEach((child, index) => {
      child.renderOrder = 103 + index
      child.children[0].renderOrder = 0
    })
  }

  public showHandDetails() {
    if (this.isAnimatingDetails) return
    
    this.areDetailsShown = true
    this.isAnimatingDetails = true
    this.renderOrder += 600

    this.children.forEach((cardWrapper: Card, index: number) => {
      this.originalCardStates[index] = {
        positionX: cardWrapper.position.x,
        positionY: cardWrapper.position.y,
        rotation: cardWrapper.rotation.z
      };

      cardWrapper.removeHighlight()

      const row = Math.floor(index / 5)
      const col = index % 5

      const targetX = this.cameraBounds.left + (col + 0.5) * (this.cameraBounds.right - this.cameraBounds.left) / 5
      const targetY = this.cameraBounds.top - (row + 0.5) * (this.cameraBounds.top - this.cameraBounds.bottom) / 2 - (CARD_HEIGHT * 0.4)

      new TWEEN.Tween(cardWrapper.rotation)
        .delay((this.children.length - (index + 1)) * (ANIMATION_DURATION / 4))
        .to({ z: this.isLeft ? Math.PI : -Math.PI }, ANIMATION_DURATION / 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()

      new TWEEN.Tween(cardWrapper.position)
        .delay((this.children.length - (index + 1)) * (ANIMATION_DURATION / 4))
        .to({ x: targetX, y: targetY }, ANIMATION_DURATION)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
        })
        .start()
    })

    setTimeout(() => {
      this.isAnimatingDetails = false
    }, this.children.length * (ANIMATION_DURATION / 4) + ANIMATION_DURATION)
  }

  public hideHandDetails() {
    if (this.isAnimatingDetails) return

    this.areDetailsShown = false
    this.isAnimatingDetails = true

    this.children.forEach((cardWrapper: THREE.Group, index: number) => {
      const card = cardWrapper.children[0] as CardMesh
      const originalState = this.originalCardStates[index]

      new TWEEN.Tween(cardWrapper.rotation)
        .delay((index + 1) * (ANIMATION_DURATION / 4) + ANIMATION_DURATION / 2)
        .to({z: originalState.rotation}, ANIMATION_DURATION / 2)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()

      new TWEEN.Tween(cardWrapper.position)
        .to({ x: originalState.positionX, y: originalState.positionY }, ANIMATION_DURATION)
        .delay((index + 1) * (ANIMATION_DURATION / 4))
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()

    });

    setTimeout(() => {
      this.isAnimatingDetails = false
      this.renderOrder -= 600
    }, this.children.length * (ANIMATION_DURATION / 4) + ANIMATION_DURATION)
  }

  private animateCardPosition(newCardObject: Card, specialCard: CardTextureName = null) { 
    if (this.isCombining) return

    const currentCardsSize = this.currentSceneCards.children.length
    const part = CIRCLE_CUTOUT / (currentCardsSize + 1)
    
    for (let i = 0; i < currentCardsSize; i++) {
      const card = this.currentSceneCards.children[i] as Card;

      const angle = (Math.PI / 2) - (CIRCLE_CUTOUT / 2) + ((currentCardsSize - i) * part)
      const x = TARGET_RADIUS * Math.cos(angle) * X_SCALE * (this.isLeft ? -1 : 1)
      const y = TARGET_RADIUS * Math.sin(angle) - Y_SCALE

      card.generateCardRandomRotation()

      const targetRotation = (((Math.floor(currentCardsSize / 2) * part) - ((currentCardsSize % 2 == 0 && i >= Math.floor(currentCardsSize / 2) ? (i + 1) : i) * part)) * 5 + card.getCardRandomRotation()) * (this.isLeft ? 1 : -1)
      const targetLocalPosition = new THREE.Vector3(x, y, i * -0.001);

      if (newCardObject && card === newCardObject) { 
        card.position.set(START_RADIUS * Math.cos(angle) * 2 * (this.isLeft ? -1 : 1), START_RADIUS * Math.sin(angle) - Y_SCALE, card.position.z)

        const animateCardToTarget = (spins: number) => {
          card.resetCardAnimations()

          card.userAnimations.position = new TWEEN.Tween(card.position)
            .to(targetLocalPosition, ANIMATION_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
              card.playIdle()
            })
            .start()

          card.rotation.set(0, 0, 0)
          card.userAnimations.rotation = new TWEEN.Tween(card.rotation)
            .to({z: -targetRotation}, ANIMATION_DURATION * 0.9)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()

          card.rotateToCardFront(this.isLeft)

          card.userAnimations.scale = new TWEEN.Tween(card.scale)
            .to({x: 1, y: 1, z: 1}, ANIMATION_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
        }

        if (specialCard) {
          let hasUpdated = false

          this.camera.attach(card)

          const oldOrder = card.renderOrder
          card.renderOrder = 800 + (this.isLeft ? -1 : 1)
          
          const targetStartPosition = new THREE.Vector3(this.isLeft ? 0.20 : -0.20, CARD_HEIGHT * 1.5, -1.5)
          const targetCameraPosition = new THREE.Vector3(this.isLeft ? 0.13 : -0.13, -CARD_HEIGHT * 0.3, -1.5)
          const targetSlidePosition = new THREE.Vector3(this.isLeft ? 0.10 : -0.10, -CARD_HEIGHT * 0.7, -1.5)
          const targetExitPosition = new THREE.Vector3(this.isLeft ? 0.03 : -0.03, -CARD_HEIGHT * 2, -1.5)
          
          card.position.copy(targetStartPosition)
          card.rotation.set(0, (this.isLeft ? -1 : 1) * Math.PI, (this.isLeft ? -1 : 1) * Math.PI / 32)
          card.scale.set(1, 1, 1)

          card.userAnimations.rotation = new TWEEN.Tween(card.rotation)
            .to({y : 0}, SPECIAL_SLIDE_IN_DURATION)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()

          card.userAnimations.position = new TWEEN.Tween(card.position)
            .to(targetCameraPosition, SPECIAL_SLIDE_IN_DURATION)
            .easing(TWEEN.Easing.Quadratic.In)
            .onComplete(() => {
              card.userAnimations.position = new TWEEN.Tween(card.position)
                .to(targetSlidePosition, SPECIAL_SLIDE_PAUSE_DURATION)
                .onUpdate((obj, elapsedTime) => {
                  if (!hasUpdated && elapsedTime > 0.5) {
                    hasUpdated = true
                    card.updateCardFace(this.cardAssets[specialCard])
                  }
                })
                .onComplete(() => {
                  card.userAnimations.position = new TWEEN.Tween(card.position)
                    .to(targetExitPosition, SPECIAL_SLIDE_OUT_DURATION)
                    
                    .onComplete(() => {
                      this.currentSceneCards.attach(card)
                      
                      card.renderOrder = oldOrder
                      card.rotation.set(0, (this.isLeft ? -1 : 1) * Math.PI, (this.isLeft ? -1 : 1) * (Math.PI / 32 + GLOBAL_ROTATION))

                      animateCardToTarget(1)
                    })
                    .start()
                })
                .start()
            })
            .start()
        } else {
          animateCardToTarget(0)
        }

        card.fadeIn()
      } else {
        setTimeout(() => {
          card.resetCardAnimations()

          card.userAnimations.position = new TWEEN.Tween(card.position)
            .to(targetLocalPosition, ANIMATION_DURATION * 1.2)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(() => {
              card.playIdle()
            })
            .start()
          card.userAnimations.rotation = new TWEEN.Tween(card.rotation)
            .to({ z: -targetRotation }, ANIMATION_DURATION * 1.2)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()

        }, specialCard ? SPECIAL_SLIDE_IN_DURATION + SPECIAL_SLIDE_PAUSE_DURATION + SPECIAL_SLIDE_OUT_DURATION : 0)
      }
    }
  }

  private filterCards(group: THREE.Group) {
    const cardsToPosition = group.children.slice()

    cardsToPosition.forEach((card: Card, index) => {
      if (true) { //TODO only cards that display data pass here
        this.attach(card)
        if (card.rotation.z < 0 && this.isLeft) {
          card.rotation.set(card.rotation.x, card.rotation.y, card.rotation.z + (2 * Math.PI))
        } else if (card.rotation.z > 0 && !this.isLeft) {
          card.rotation.set(card.rotation.x, card.rotation.y, card.rotation.z - (2 * Math.PI))
        }
        
        card.renderOrder = 101 + this.children.length
        
        const targetRotation = card.rotation.z + (this.isLeft ? 1 : -1) * ((Math.PI / 16 * (index)) % (2 * Math.PI))
        
        //add back if we dont want a messy hand
        // card.userAnimations.rotation = new TWEEN.Tween(card.rotation)
        //   .to({z: 0}, 100 * (index + 1))
        //   .easing(TWEEN.Easing.Quadratic.Out)
        //   .start()

        new TWEEN.Tween(card.rotation)
          .to({z: targetRotation}, 250 * index)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()
      }
    })

    group.clear()
    group.removeFromParent()

    if (this.isExpanded) {
      this.expandHand()
    }
  }

  public addCardToScene(cardName: CardTextureName, specialCard: CardTextureName = null) {
    const backTexture = this.cardAssets[CardTextureName.card_back]
    const frontTexture = this.cardAssets[cardName]

    const card = new Card(frontTexture, backTexture)
    card.renderOrder = this.currentSceneCards.children.length
    
    this.currentSceneCards.add(card)
    
    this.animateCardPosition(card, specialCard)
  }

  public combineCards() {
    if (this.name != this.objectName) {
      this.name = this.objectName
      this.camera.add(this)
    }

    this.isCombining = true
    const group = new THREE.Group()
    group.position.copy(this.currentSceneCards.position)
    group.quaternion.copy(this.currentSceneCards.quaternion)
    group.scale.copy(this.currentSceneCards.scale)
    this.attach(group)

    const collapseDuration = 550
    const moveDuration = 1200

    const deltaY = this.currentSceneCards.children.reduce((sum, card) => sum + card.position.y, 0) / this.currentSceneCards.children.length
    
    const targetPosition = new THREE.Vector3(this.isLeft ? -0.45 : 0.45, -CARD_HEIGHT * 0.65, -3)
    const targetRotation = ((-Math.PI / 16) + Math.PI / 16 * (this.children.length - 1)) % (2 * Math.PI)

    const currentCards = this.currentSceneCards.children.slice()
    currentCards.forEach((card: Card, index) => {
      card.resetCardAnimations()
      card.renderOrder = 500 + index
      group.add(card)

      const middlePosition = new THREE.Vector3(0, deltaY, card.position.z);

      // const resetTween = new TWEEN.Tween(card.position)
      //   .to({x: 0, y: 0, z: 0}, moveDuration - (collapseDuration * 0.3))
      //   .easing(TWEEN.Easing.Quadratic.InOut)

      const collapseTween = new TWEEN.Tween(card.position)
        .to(middlePosition, collapseDuration)
        .easing(TWEEN.Easing.Back.In || TWEEN.Easing.Quadratic.Out)
        // .onComplete(() => {
        //   resetTween.start()
        // })

      const rotateBack = new TWEEN.Tween(card.rotation)
        .to({ z: ((-Math.PI / 64) + (Math.random() * (Math.PI / 32))) }, collapseDuration)
        .easing(TWEEN.Easing.Back.In || TWEEN.Easing.Quadratic.Out)

      collapseTween.start()
      rotateBack.start()
    });

    this.isCombining = false

    const moveTween = new TWEEN.Tween(group.position)
      .delay(collapseDuration * 0.7)
      .to(targetPosition, moveDuration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onComplete(() => {
        this.filterCards(group)
      })

    const rotate = new TWEEN.Tween(group.rotation)
      .delay(collapseDuration * 0.8)
      .to({ z: this.isLeft ? Math.PI + targetRotation : -Math.PI - targetRotation }, moveDuration - collapseDuration * 0.1)
      .easing(TWEEN.Easing.Quadratic.InOut)
    const rotateCards = new TWEEN.Tween(group.rotation)
      .delay(collapseDuration * 0.8)
      .to({ y: (1 * Math.PI * 2 * (this.isLeft ? 1 : -1)) }, moveDuration - collapseDuration * 0.1)
      .onComplete(() => {
        setTimeout(() => {
          group.rotation.set(0, Math.PI, group.rotation.z + Math.PI)
        }, 10)
      })
      .easing(TWEEN.Easing.Quadratic.Out)

    const scale = new TWEEN.Tween(group.scale)
      .delay(collapseDuration * 0.8)
      .to({ x: 0.45, y: 0.45, z: 0.45 }, moveDuration - collapseDuration * 0.1)
      .easing(TWEEN.Easing.Quadratic.InOut)
    
    moveTween.start()
    rotateCards.start()
    rotate.start()
    scale.start()
  }

  public update(newScenePositionX: number) {
    if (Math.abs(newScenePositionX - (this.currentSceneCards.position.x - (this.isLeft ? X_OFFSET : -X_OFFSET))) > 0.001) {
      this.currentSceneCards.position.x = newScenePositionX + (this.isLeft ? X_OFFSET : -X_OFFSET)

      const normalizedX = (Math.abs(newScenePositionX) - 0.5) / 3.02
      const newScale = 1 + (normalizedX * 2)
      const initialHeight = this.currentSceneCards.scale.y
      
      this.currentSceneCards.scale.set(newScale, newScale, newScale)
      
      const heightChange = this.currentSceneCards.scale.y - initialHeight; 

      this.currentSceneCards.position.y += heightChange / 2; 

    }
  }

  public resetCards() {
    this.currentSceneCards.clear()
    this.clear()
  }

  public dispose() { //TODO refactor all dispose functions, game.tsx should handle disposing of all meshes and materials with a recursive function, all other classes need to just clear ther variables and data as needed after that
    this.currentSceneCards.clear()
    this.clear()
  }

}
