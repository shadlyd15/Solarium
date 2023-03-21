import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/controls/OrbitControls.js';

function main(planetData) {

// Create an object to store the key states
const keyState = {
  w: false,
  s: false,
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};


// Event listeners for keydown and keyup events
document.addEventListener('keydown', (event) => {
  if (keyState.hasOwnProperty(event.key)) {
    keyState[event.key] = true;
  }
});

document.addEventListener('keyup', (event) => {
  if (keyState.hasOwnProperty(event.key)) {
    keyState[event.key] = false;
  }
});

function updateCameraPosition(camera) {
  const speed = 0.5; // Adjust this value to control the movement speed

  if (keyState.ArrowUp) {
    camera.position.y -= speed;
  }
  if (keyState.ArrowDown) {
    camera.position.y += speed;
  }
  if (keyState.ArrowLeft) {
    camera.rotation.y -= speed * 0.1;
  }
  if (keyState.ArrowRight) {
    camera.rotation.y += speed * 0.1;
  }
  if (keyState.w) {
    camera.rotation.x += speed * 0.1;
  }
  if (keyState.s) {
    camera.rotation.x -= speed * 0.1;
  }
}

  const gui = new dat.GUI();
  const earth = planetData.find(planet => planet.name == 'Earth');

  let ringsVisible = true;
  const orbitRingControl = {
    'Orbit Rings': function () {
      ringsVisible = !ringsVisible;
      toggleOrbitRingsVisibility(ringsVisible);
    }
  };
  gui.add(orbitRingControl, 'Orbit Rings');


  let labelsVisible = true;

  const labelControl = {
    'Labels': function () {
      labelsVisible = !labelsVisible;
      toggleLabelsVisibility(labelsVisible);
    }
  };
  gui.add(labelControl, 'Labels');


  const sunButton = {
    'Go to Sun': function () {
      camera.position.set(0, 1200, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };
  gui.add(sunButton, 'Go to Sun');

  // Add speed control slider
  const speedControl = {
    'Speed': 1
  };
  gui.add(speedControl, 'Speed', 0.0, 25, 0.1);



  for (let i = 0; i < planetData.length; i++) {
    const planet = planetData[i];
    const button = {
      [planet.name]: function () {
        const planetObject = planets.find(({ planet: p }) => p.name === planet.name).planet;
        const planetRadius = planetObject.geometry.parameters.radius;
        camera.position.copy(planetObject.position.clone().add(new THREE.Vector3(0, planetRadius * 1.5, -planetRadius * 3)));
        camera.lookAt(planetObject.position);
        controls.target.copy(planetObject.position);
        controls.update();
      }
    };

    // gui.add(button, planet.name);
    gui.add(button, planet.name).onChange(function () {
      if (button[planet.name]) {
        moveToPlanet(planet.name);
      }
    });
  }

  function toggleOrbitRingsVisibility(visible) {
    scene.traverse((object) => {
      if (object instanceof THREE.Line) {
        object.visible = visible;
      }
    });
  }

  const canvas = document.querySelector('#universe');
  const renderer = new THREE.WebGLRenderer({canvas, preserveDrawingBuffer: true});

  function createTextTexture(text, fontSize, fontColor) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px`;
  const textWidth = context.measureText(text).width;
  canvas.width = 1.2*textWidth;
  canvas.height = 1.2*fontSize;
  context.font = `${fontSize}px`;
  context.fillStyle = fontColor;
  context.fillText(text, 0, fontSize);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createLabel(text, size, color) {
  const textTexture = createTextTexture(text, size, color);
  const spriteMaterial = new THREE.SpriteMaterial({ map: textTexture });
  const sprite = new THREE.Sprite(spriteMaterial);
  return sprite;
}


  const fov = 60; // Change field of view to 60
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 2500; // Change far clipping plane to 1000
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.x = 0;
  camera.position.y = 1200;
  camera.position.z = 0; // Move the camera back to see the whole solar system


  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  const scene = new THREE.Scene();

  const color = 0xFFFFFF;
  const intensity = 0.1;
  const light = new THREE.PointLight(color, intensity, 1000);
  light.position.set(0, 0, 0);
  scene.add(light);

  const sunTexture = new THREE.TextureLoader().load('./images/textures/sun/sunmap.jpg');
  const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
  const sunGeometry = new THREE.SphereGeometry(3, 64, 64);
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);


  // Add point light source at Sun's position
  const pointLight = new THREE.PointLight(0xffffff, 1, 0);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambientLight);


  const scale_radius = 100;

  const planets = planetData.map(({ name, texturePath, radius, distance, satellites }) => {
    const planetTexture = new THREE.TextureLoader().load(texturePath);
    const material = new THREE.MeshPhongMaterial({ map: planetTexture });
    const geometry = new THREE.SphereGeometry(scale_radius * radius, 64,  64);
    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = distance;
    planet.scale.set(0.1, 0.1, 0.1);
    planet.name = name;

    const satelliteObjects = satellites ? satellites.map((satelliteData) => {
          const satelliteTexture = new THREE.TextureLoader().load(satelliteData.texturePath);
          const material = new THREE.MeshPhongMaterial();
          const geometry = new THREE.SphereGeometry( satelliteData.radius * scale_radius, 8, 8 );
          const satellite = new THREE.Mesh(geometry, material);
          satellite.scale.set(0.1, 0.1, 0.1);
          satellite.name = satelliteData.name;

          satellite.position.set( Math.cos(Math.random() * Math.PI * 2) * satelliteData.distance, 0, Math.sin(Math.random() * Math.PI * 2) * satelliteData.distance );
          const satelliteLabel = createLabel(satellite.name, 18, '#ffffff');
          satelliteLabel.position.set(0, satellite.geometry.parameters.radius * scale_radius * 0.1 + 1, 0);
          satelliteLabel.name = 'label';
          satellite.add(satelliteLabel);
          satelliteLabel.visible = true;

          return { satellite, radius: satelliteData.radius, distance: satelliteData.distance };
        }) : [];

    satelliteObjects.forEach(({ satellite }) => {
      scene.add(satellite);
    });

    const planetLabel = createLabel(name, 18, '#ffffff');
    planetLabel.position.set(0, radius * scale_radius * 0.1 + 2, 0);
    planet.add(planetLabel);
    planetLabel.visible = true;

    return {
      planet,
      radius,
      distance,
      satellites: satelliteObjects,
      planetLabel,
      satelliteLabels: satelliteObjects.map(({ satellite }) => satellite.getObjectByName('label')),
    };
  });

let cameraMoving = false;
let activeTargetName = '';

async function moveToPlanet(targetName) {
  if (cameraMoving) return;
  cameraMoving = true;

  activeTargetName = targetName;

  const targetPlanet = planets.find(({ planet: p }) => p.name === targetName).planet;
  const targetPosition = targetPlanet.position.clone().add(new THREE.Vector3(0, targetPlanet.geometry.parameters.radius * 1.5, -targetPlanet.geometry.parameters.radius * 3));

  const startPosition = camera.position.clone();
  const distance = startPosition.distanceTo(targetPosition);

  const duration = 3000; // 5 seconds
  const start = performance.now();

  const audio = new Audio('./audio/reached.wav');

  function moveCamera(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);

    camera.position.lerpVectors(startPosition, targetPosition, progress);
    camera.lookAt(targetPlanet.position);
    controls.target.copy(targetPlanet.position);
    controls.update();

    // check if the active target has changed
    if (activeTargetName !== targetName) {
      cameraMoving = false;
      return;
    }

    if (progress < 1) {
      requestAnimationFrame(moveCamera);
    } else {
      audio.play();
      cameraMoving = false;
    }
  }

  requestAnimationFrame(moveCamera);
}


function toggleLabelsVisibility(visible) {
  planets.forEach(({ planetLabel, satelliteLabels }) => {
    planetLabel.visible = visible;
    satelliteLabels.forEach((satelliteLabel) => {
      if (satelliteLabel) {
        satelliteLabel.visible = visible;
      }
    });
  });
}

controls.target.set(0, 0, 0);
controls.update();

const saturnData = {
  ringTexturePath: './images/textures/planets/2k_saturn.jpg',
  ringInnerRadius: 70 * 0.120,
  ringOuterRadius: 70 * 0.275,
};

function createOrbitRing(innerRadius, outerRadius, color, segments, lineWidth) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
  const material = new THREE.LineBasicMaterial({ color, linewidth: lineWidth });
  const ring = new THREE.Line(geometry, material);
  ring.rotation.x = Math.PI / 2; // Rotate the ring to be perpendicular to the plane of the solar system
  return ring;
}

function createRing(innerRadius, outerRadius, texturePath) {
  const ringTexture = new THREE.TextureLoader().load(texturePath);
  const ringMaterial = new THREE.MeshPhongMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);

  ring.rotation.x = Math.PI / 2.1; // Rotate the ring to be perpendicular to the planet's rotation axis
  return ring;
}

planets.forEach(({ planet, radius, distance, satellites }, index) => {
  // Create the orbit ring with a different color for each planet
  const orbitRingColor = new THREE.Color(0xffffff - index * 0x101010);
  const orbitRing = createOrbitRing(distance, distance, orbitRingColor, 250, 0.5);
  scene.add(orbitRing);

  // Add the planet and its satellites
  planet.position.x = distance;
  planet.scale.set(0.1, 0.1, 0.1);
  if (planet.name.search('Saturn') != -1) {
    console.log("Putting ring on it");
    const saturnRing = createRing(saturnData.ringInnerRadius + 3, saturnData.ringOuterRadius, saturnData.ringTexturePath);
    planet.add(saturnRing);
  }

  scene.add(planet);
});

  {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './images/skybox/right.png',
      './images/skybox/left.png',
      './images/skybox/top.png',
      './images/skybox/bottom.png',
      './images/skybox/front.png',
      './images/skybox/back.png',
    ]);
    scene.background = texture;
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }


// Add this function to create a random meteor
function createMeteor() {
  const geometry = new THREE.SphereGeometry(0.01, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color: 0xffa500 }); // Orange color
  const meteor = new THREE.Mesh(geometry, material);
  meteor.position.set(Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25);
  meteor.velocity = new THREE.Vector3(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
  return meteor;
}

// Add this function to remove a meteor from the scene
function removeMeteor(meteor) {
  scene.remove(meteor);
}

// Add this function to update the meteor's position based on its velocity
function updateMeteorPosition(meteor) {
  meteor.position.add(meteor.velocity);
}

// Modify the 'spawnAndDestroyMeteor' function to store the created meteors
let meteors = [];
function spawnAndDestroyMeteor() {
  const meteor = createMeteor();
  scene.add(meteor);
  meteors.push(meteor);
  const vanishTime = Math.random() * 500 + 3000; // Random time between 3 and 8 seconds
  setTimeout(() => {
    removeMeteor(meteor);
    meteors = meteors.filter(m => m !== meteor);
  }, vanishTime);
}


// Modify the 'render' function to call 'spawnAndDestroyMeteor' periodically
let meteorSpawnCounter = 0;

toggleOrbitRingsVisibility(ringsVisible);

function render(time) {
  time *= 0.01 * speedControl.Speed;  // convert time to seconds

  // Increment the counter and spawn a meteor every 200 frames
  meteorSpawnCounter++;
  if (meteorSpawnCounter >= 500) {
    meteorSpawnCounter = 0;
    spawnAndDestroyMeteor();
  }

  // Update the meteor's positions
  meteors.forEach(updateMeteorPosition);

  // Update the camera's position based on the arrow keys
  updateCameraPosition(camera);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  planets.forEach(({ planet, radius, distance, satellites }) => {
    const planetAngle = time * 0.01 / (distance);
    planet.position.set(
      Math.cos(planetAngle) * distance,
      0,
      Math.sin(planetAngle) * distance,
    );
    planet.rotation.y += 0.01;

    satellites.forEach(({ satellite, radius, distance }) => {
      const satelliteAngle = time * 0.01 / (distance);
      satellite.position.set(
        planet.position.x + Math.cos(satelliteAngle) * distance * 10,
        0,
        planet.position.z + Math.sin(satelliteAngle) * distance * 10,
      );
      satellite.rotation.y += 0.01;
    });
  });

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

  requestAnimationFrame(render);
}

async function loadPlanetData() {
  const response = await fetch('./planetData.json');
  const planetData = await response.json();
  main(planetData);
}

loadPlanetData();
