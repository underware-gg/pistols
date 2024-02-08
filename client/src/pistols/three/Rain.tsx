import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'



// Inspired by @senbaku
// https://twitter.com/senbaku/status/1473548401019355140
// and etudes
// https://boytchev.github.io/etudes/threejs/ghosts-in-the-rain.html

const N = 3000; // number of snowflakes
const G = THREE.MathUtils.randInt(5, 11); // number of ghosts
const R = 50; // radius of ghost
const R2 = R * R;
var M = 0; // actual number of snowflakes


export class Rain extends THREE.Object3D {
  constructor() {
    super()

    // generate snowflake texture
    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(15, 15, 2, 15, 15, 15);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    var snowflakeTexture = new THREE.CanvasTexture(canvas);

    var snowflakes = new THREE.BufferGeometry();
    var speeds = [];
    var vertices = []
    for (var i = 0; i < N; i++) {
      // snowflakes.vertices.push(new THREE.Vector3(THREE.MathUtils.randFloatSpread(150), -0.6 * window.innerHeight, 0));
      vertices.push(THREE.MathUtils.randFloatSpread(150));
      vertices.push(-0.6 * window.innerHeight);
      vertices.push(0);
      speeds.push(new THREE.Vector3(THREE.MathUtils.randFloat(-20, 20), -100, 0));
    }

    var material = new THREE.PointsMaterial({
      color: 0xa0a0ff,
      size: 4,
      map: snowflakeTexture,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    var snow = new THREE.Points(snowflakes, material);
    this.add(snow);


  }

  reset() {
  }

  animate(time) {
  }
}

/*

// construct and setup the scene

// var renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: false, antialias: true, preserveDrawingBuffer: true });
// renderer.setClearColor(0, 1);
// renderer.autoClear = false;
// renderer.autoClearColor = false;
// renderer.setAnimationLoop(animate);
// document.body.appendChild(renderer.domElement);
// document.body.style.margin = 0;
// document.body.style.overflow = 'hidden';

// var scene = new THREE.Scene();
//				scene.background = new THREE.Color( 'black' );

// var camera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -1000, 1000);
// camera.position.set(0, 0, 100);
// camera.lookAt(scene.position);

var clock = new THREE.Clock(true);


// construct a ground and snowflakes



// create ghosts

var ghosts = [];
var ghostsEyes = [];
var white = new THREE.MeshBasicMaterial({ color: 0x303060 }),
  eye = new THREE.CircleGeometry(8, 32);

for (var i = 0; i < G; i++) {
  var eye1 = new THREE.Mesh(eye, white),
    eye2 = new THREE.Mesh(eye, white);

  eye1.position.x = 14;
  eye2.position.x = -14;

  var ghost = new THREE.Group();
  ghost.add(eye1, eye2);
  ghost.position.set(
    THREE.MathUtils.randFloatSpread(0.8 * window.innerWidth),
    THREE.MathUtils.randFloatSpread(0.7 * window.innerHeight),
    0);
  ghost.rand1 = Math.random() * 100;
  ghost.rand2 = Math.random() * 100;

  ghostsEyes.push(ghost);
  ghosts.push(ghost.position);

  this.add(ghost);
}


var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.1, depthWrite: false }));



// animation loop
var v = new THREE.Vector3();

renderer.clearColor();

function animate() {
  var dTime = clock.getDelta(),
    time = clock.getElapsedTime();

  if (M < N) M += 5;

  // move each snowflake
  for (var i = 0; i < M; i++) {
    // move down a snowflake
    var pos = snowflakes.vertices[i];
    pos.addScaledVector(speeds[i], dTime);

    // acceleration
    if (speeds[i].y > -600 - (i % 600)) speeds[i].y -= 5;
    //speeds[i].x -= THREE.MathUtils.randFloat(-0.1,0.1);

    // recycle 
    if (pos.y < -window.innerHeight / 2) {
      pos.y = window.innerHeight / 2 + THREE.MathUtils.randFloat(0, 100);
      pos.x = (THREE.MathUtils.randFloatSpread(window.innerWidth) + THREE.MathUtils.randFloatSpread(window.innerWidth) + THREE.MathUtils.randFloatSpread(window.innerWidth)) / 3;
      speeds[i].set(THREE.MathUtils.randFloat(-20, 20), -400, 0);
    }

    // check for ghosts collission
    for (var g = 0; g < G; g++)
      if (pos.x < ghosts[g].x + R)
        if (pos.x > ghosts[g].x - R)
          if (pos.y > ghosts[g].y)
            if (pos.y < ghosts[g].y + R)
              if (pos.distanceToSquared(ghosts[g]) < R2) {
                v.subVectors(pos, ghosts[g]).setLength(R).add(ghosts[g]);
                speeds[i].x = THREE.MathUtils.randFloat(-100, 100) + 50 * Math.sign(v.x);
                speeds[i].y = THREE.MathUtils.randFloat(10, 160);
                pos.set(v.x, v.y, v.z);
                v.subVectors(pos, ghosts[g]);

              }
  }

  snowflakes.verticesNeedUpdate = true;

  for (var g = 0; g < G; g++) {
    ghostsEyes[g].visible = Math.sin(g / 2 + 3 * time) > -0.8;
    ghostsEyes[g].position.y += THREE.MathUtils.randFloat(-1, 1);
  }

  renderer.render(plane, camera);
  renderer.render(scene, camera);
}

*/
