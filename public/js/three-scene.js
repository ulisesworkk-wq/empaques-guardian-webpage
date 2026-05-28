/* =====================================================================
   ESCENA 3D — Three.js scroll-driven
   Réplica del concepto "Cargando frames..." de Ultrapac:
   un objeto 3D rota/cambia conforme avanzas en el scroll dentro de la sección.
   ===================================================================== */

import * as THREE from 'three';

const container = document.getElementById('threeCanvas');
if (container) initScene();

function initScene() {
  // ============== Setup básico ==============
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060606, 5, 15);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x060606, 1);
  container.appendChild(renderer.domElement);

  // ============== Iluminación ==============
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 5, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc9a66b, 0.6);
  fillLight.position.set(-5, 2, 3);
  scene.add(fillLight);

  const rim = new THREE.DirectionalLight(0x4d5c3a, 0.8);
  rim.position.set(0, -3, -5);
  scene.add(rim);

  // ============== Objeto 3D principal ==============
  // (Cambia esto por tu modelo real con GLTFLoader cuando lo tengas:
  //  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  //  const loader = new GLTFLoader();
  //  loader.load('/models/tu-producto.glb', gltf => scene.add(gltf.scene));)

  const productGroup = new THREE.Group();

  // Forma "tipo bolsa pouch" creada con geometría procedural
  const bagGeometry = new THREE.BoxGeometry(1.4, 2, 0.3, 8, 12, 2);
  // Deformamos un poco los vértices para darle look orgánico
  const positions = bagGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    if (Math.abs(z) > 0.1) {
      positions.setZ(i, z + Math.sin(y * 2) * 0.05 + Math.cos(x * 3) * 0.04);
    }
  }
  bagGeometry.computeVertexNormals();

  const bagMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd8c9a8,
    metalness: 0.2,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2
  });
  const bag = new THREE.Mesh(bagGeometry, bagMaterial);
  productGroup.add(bag);

  // Detalle: zipper (línea horizontal)
  const zipperGeo = new THREE.TorusGeometry(0.6, 0.025, 8, 50, Math.PI);
  const zipperMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });
  const zipper = new THREE.Mesh(zipperGeo, zipperMat);
  zipper.position.y = 0.7;
  zipper.rotation.x = Math.PI / 2;
  zipper.scale.set(1.2, 1, 0.3);
  productGroup.add(zipper);

  scene.add(productGroup);

  // Plano sutil con grid de partículas detrás
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 200;
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    particlePos[i] = (Math.random() - 0.5) * 20;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xc9a66b, size: 0.02, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ============== Scroll-driven animation ==============
  // Calculamos progreso (0 → 1) según la posición de scroll DENTRO de la sección 3D
  const section = document.querySelector('.three-section');
  const progressBar = document.getElementById('frameProgress');
  const progressLabel = document.getElementById('framePercent');

  let currentProgress = 0;
  let targetProgress = 0;

  function updateScrollProgress() {
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const sectionHeight = section.offsetHeight;
    const viewportH = window.innerHeight;
    // Empieza cuando la sección entra en viewport, termina cuando sale por arriba
    const scrolled = -rect.top;
    const total = sectionHeight - viewportH;
    targetProgress = Math.max(0, Math.min(1, scrolled / total));
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ============== Loop ==============
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth lerp del progress para fluidez
    currentProgress += (targetProgress - currentProgress) * 0.08;

    // El producto rota según el scroll
    productGroup.rotation.y = currentProgress * Math.PI * 2;
    productGroup.rotation.x = Math.sin(currentProgress * Math.PI) * 0.3;

    // Movimiento sutil de respiro
    productGroup.position.y = Math.sin(t * 0.6) * 0.05;

    // Cámara hace un dolly-zoom según progreso
    camera.position.z = 5 - currentProgress * 1.2;

    // Particles rotan lento
    particles.rotation.y = t * 0.05;

    // Update barra de progreso
    if (progressBar)  progressBar.style.width = `${currentProgress * 100}%`;
    if (progressLabel) progressLabel.textContent = `${Math.round(currentProgress * 100)}%`;

    renderer.render(scene, camera);
  }
  animate();

  // ============== Resize ==============
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
