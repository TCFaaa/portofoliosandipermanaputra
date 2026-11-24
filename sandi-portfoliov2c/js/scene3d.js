// PHASE 4 — Scene 3D (Three.js): knot wireframe di belakang foto hero, partikel melayang,
// dan bentuk geometri yang bergerak mengikuti scroll serta kursor. Warna mengikuti tema aktif.
// Jika Three.js gagal dimuat, WebGL tidak tersedia, atau reduced motion aktif, scene dilewati.
(() => {
  const THREE = window.THREE;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!THREE || reduceMotion) return;

  const root = document.documentElement;
  const small = () => window.innerWidth < 800;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const canvas = document.createElement("canvas");
  canvas.id = "scene3d";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small(), powerPreference: "low-power" });
  } catch (error) {
    return;
  }
  document.body.prepend(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1 : 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 8);
  const VISIBLE_H = 2 * Math.tan(THREE.MathUtils.degToRad(25)) * 8; // tinggi dunia yang terlihat pada z = 0

  // ---------- Warna & material (mengikuti tema) ----------
  const palette = { a: new THREE.Color(), b: new THREE.Color() };
  const tracked = [];
  const track = (material, key, opacity) => { tracked.push({ material, key, opacity }); return material; };
  const wire = (key, opacity) => track(new THREE.MeshBasicMaterial({
    color: 0xffffff, wireframe: true, transparent: true, opacity, depthWrite: false
  }), key, opacity);

  // ---------- Objek hero (menempel pada foto profil) ----------
  const hero = new THREE.Group();
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.27, small() ? 64 : 150, small() ? 6 : 12, 2, 3), wire("a", 0.5));
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), wire("b", 0.65));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 8, 180), track(new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false
  }), "b", 0.55));
  halo.rotation.x = Math.PI / 2.3;
  hero.add(knot, core, halo);
  scene.add(hero);

  // ---------- Partikel ----------
  const count = small() ? 160 : 900;
  const positions = new Float32Array(count * 3);
  const mix = new Float32Array(count);
  const colorArray = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = -9 + Math.random() * 12;
    mix[i] = Math.random();
  }
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
  const points = new THREE.Points(pointsGeometry, track(new THREE.PointsMaterial({
    size: small() ? 0.07 : 0.055, vertexColors: true, transparent: true, opacity: 0.75,
    depthWrite: false, sizeAttenuation: true
  }), null, 0.75));
  scene.add(points);

  // ---------- Bentuk melayang di tepi halaman (satu per area section) ----------
  const shapeDefs = [
    { geo: new THREE.OctahedronGeometry(1), frac: 0.17, side: -1, size: 110, par: 0.85, key: "b" },
    { geo: new THREE.IcosahedronGeometry(1, 0), frac: 0.30, side: 1, size: 130, par: 0.92, key: "a" },
    { geo: new THREE.BoxGeometry(1.4, 1.4, 1.4), frac: 0.46, side: -1, size: 100, par: 0.8, key: "a" },
    { geo: new THREE.TorusGeometry(0.9, 0.3, 10, 24), frac: 0.60, side: 1, size: 120, par: 0.9, key: "b" },
    { geo: new THREE.TetrahedronGeometry(1.2), frac: 0.76, side: -1, size: 110, par: 0.85, key: "b" },
    { geo: new THREE.DodecahedronGeometry(1), frac: 0.90, side: 1, size: 120, par: 0.95, key: "a" }
  ].slice(0, small() ? 2 : 6);
  const shapes = shapeDefs.map((def, i) => {
    const mesh = new THREE.Mesh(def.geo, wire(def.key, 0.3));
    mesh.rotation.set(i * 0.7, i * 1.1, 0);
    scene.add(mesh);
    return { ...def, mesh, spin: 0.18 + (i % 3) * 0.07 };
  });

  // ---------- Warna sesuai tema ----------
  const cssColor = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  const updateColors = () => {
    palette.a.set(cssColor("--accent", "#9b7bff"));
    palette.b.set(cssColor("--accent-2", "#35d8e8"));
    const k = root.dataset.theme === "light" ? 0.8 : 1;
    tracked.forEach(({ material, key, opacity }) => {
      if (key) material.color.copy(palette[key]);
      material.opacity = opacity * k;
    });
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tmp.copy(palette.a).lerp(palette.b, mix[i]);
      colorArray[i * 3] = tmp.r; colorArray[i * 3 + 1] = tmp.g; colorArray[i * 3 + 2] = tmp.b;
    }
    pointsGeometry.attributes.color.needsUpdate = true;
  };
  updateColors();
  new MutationObserver(updateColors).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- Ukuran & posisi acuan ----------
  const visual = document.querySelector(".hero__visual");
  let vw = window.innerWidth, vh = window.innerHeight, docH = 1;
  let heroAnchor = { cx: vw * 0.7, cyPage: vh * 0.45, size: 360 };
  const measure = () => {
    vw = window.innerWidth; vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    docH = Math.max(document.documentElement.scrollHeight, vh + 1);
    if (visual) {
      const r = visual.getBoundingClientRect();
      heroAnchor = { cx: r.left + r.width / 2, cyPage: r.top + window.scrollY + r.height / 2, size: Math.max(r.width, 260) };
    }
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", () => setTimeout(measure, 500));

  // ---------- Input ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) {
    window.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      mouse.tx = (event.clientX / vw) * 2 - 1;
      mouse.ty = (event.clientY / vh) * 2 - 1;
    }, { passive: true });
  }

  // ---------- Loop ----------
  let last = performance.now();
  let lastScroll = window.scrollY;
  let boost = 0;
  let running = false;
  let lastDraw = 0;
  let revealed = false;

  const frame = (now) => {
    if (!running) return;
    requestAnimationFrame(frame);
    if (small() && now - lastDraw < 30) return; // HP: batasi ~30 fps agar CPU/GPU tidak panas
    lastDraw = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const scrollY = window.scrollY;
    boost = Math.max(boost * 0.94, Math.min(Math.abs(scrollY - lastScroll) * 0.012, 2.5));
    lastScroll = scrollY;
    const wpp = VISIBLE_H / vh; // satuan dunia per piksel layar
    const progress = clamp(scrollY / Math.max(docH - vh, 1), 0, 1);

    mouse.x = lerp(mouse.x, mouse.tx, 0.06);
    mouse.y = lerp(mouse.y, mouse.ty, 0.06);
    camera.position.x = mouse.x * 0.35;
    camera.position.y = -mouse.y * 0.25;
    camera.lookAt(0, 0, 0);

    // Hero: menempel pada foto, berputar, condong ke kursor, berputar lebih cepat saat scroll.
    const heroScreenY = heroAnchor.cyPage - scrollY;
    const heroVisible = heroScreenY > -heroAnchor.size && heroScreenY < vh + heroAnchor.size;
    hero.visible = heroVisible;
    if (heroVisible) {
      hero.position.set((heroAnchor.cx - vw / 2) * wpp, -(heroScreenY - vh / 2) * wpp, -0.5);
      hero.scale.setScalar(heroAnchor.size * wpp * 0.5);
      hero.rotation.x = lerp(hero.rotation.x, mouse.y * 0.5, 0.08);
      hero.rotation.y = lerp(hero.rotation.y, mouse.x * 0.7, 0.08);
      knot.rotation.y += dt * (0.28 + boost * 0.9);
      knot.rotation.x += dt * (0.12 + boost * 0.4);
      core.rotation.y -= dt * (0.5 + boost);
      core.rotation.x += dt * 0.3;
      halo.rotation.z += dt * (0.15 + boost * 0.3);
      const pulse = 1 + Math.sin(now * 0.0016) * 0.035;
      core.scale.setScalar(pulse);
    }

    // Partikel: drift lambat + parallax scroll.
    points.rotation.y += dt * (0.015 + boost * 0.03);
    points.position.y = progress * 10;
    points.position.x = mouse.x * -0.4;

    // Bentuk melayang: mengikuti posisi section dengan kecepatan parallax berbeda.
    shapes.forEach((shape, i) => {
      const sy = shape.frac * docH - scrollY * shape.par - (1 - shape.par) * vh * 0.5;
      const onScreen = sy > -200 && sy < vh + 200;
      shape.mesh.visible = onScreen;
      if (!onScreen) return;
      const sx = vw * (0.5 + shape.side * (small() ? 0.4 : 0.44)) + Math.sin(now * 0.0006 + i) * 14;
      const bob = Math.sin(now * 0.0009 + i * 1.7) * 12;
      shape.mesh.position.set((sx - vw / 2) * wpp, -(sy + bob - vh / 2) * wpp, -1 - (i % 3) * 0.6);
      shape.mesh.scale.setScalar((shape.size * wpp) / 2);
      shape.mesh.rotation.x += dt * (shape.spin + boost * 0.5);
      shape.mesh.rotation.y += dt * (shape.spin * 1.3 + boost * 0.7);
    });

    renderer.render(scene, camera);
    if (!revealed) { revealed = true; canvas.classList.add("is-ready"); root.classList.add("scene-on"); }
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else start();
  });
  if (!document.hidden) start();

  window.addEventListener("webglcontextlost", (event) => { event.preventDefault(); running = false; canvas.classList.remove("is-ready"); root.classList.remove("scene-on"); });
})();
