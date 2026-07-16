/* =========================================================
   VILLA MISKHOR — hero 3D motion graphic
   Low-poly wireframe massif (Ai-Petri silhouette) + drifting
   particle field (sea sparkle). Pure decorative motion layer.
   ========================================================= */
import * as THREE from "three";

const canvas = document.querySelector(".hero__canvas");
if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.4, 9.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* ---- ridge line: layered low-poly mountain silhouettes (Ai-Petri massif) ---- */
  function makeRidge(z, color, amplitude, seed, opacity) {
    const points = 40;
    const width = 26;
    const geo = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width - width / 2;
      const y =
        Math.sin(i * 0.7 + seed) * amplitude * 0.6 +
        Math.sin(i * 0.35 + seed * 2) * amplitude +
        Math.cos(i * 1.3 + seed) * amplitude * 0.25;
      positions.push(x, y, 0);
      positions.push(x, -6, 0);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const indices = [];
    for (let i = 0; i < points; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      indices.push(a, b, c, b, d, c);
    }
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    return mesh;
  }

  const ridgeFar = makeRidge(-6, 0xc9b79a, 1.6, 1, 0.22);
  const ridgeMid = makeRidge(-3, 0xc26a3f, 2.1, 4, 0.32);
  const ridgeNear = makeRidge(-0.5, 0xf4efe6, 2.6, 8, 0.4);
  scene.add(ridgeFar, ridgeMid, ridgeNear);

  /* ---- particle field: sea sparkle / drifting dust ---- */
  const particleCount = 240;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 24;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10 - 1;
    pPos[i * 3 + 2] = Math.random() * 8 - 4;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xf4efe6, size: 0.028, transparent: true, opacity: 0.55 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  let targetX = 0, targetY = 0;
  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (1.4 - targetY - camera.position.y) * 0.02;
    camera.lookAt(0, 0.4, -2);

    particles.rotation.y = t * 0.015;
    ridgeNear.position.y = Math.sin(t * 0.12) * 0.05;
    ridgeMid.position.y = Math.sin(t * 0.09 + 1) * 0.06;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
