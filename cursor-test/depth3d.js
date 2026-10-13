/* depth3d.js — neon hero scene.
   Three.js is loaded only on a fine-pointer desktop, after first paint.
   Phones, coarse pointers, save-data, very low memory, and reduced motion
   keep the CSS hero (gradient, grid, soft colour fields) and do not start WebGL.
   Keep these counts in sync with the homepage fallback check in fx.js. */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SMALL = matchMedia("(max-width: 760px)").matches;
const TOUCH = matchMedia("(pointer: coarse)").matches;
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const SAVE = !!(navigator.connection && navigator.connection.saveData);
const LOW = SAVE || (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2);
const WEBGL = !RM && !SMALL && !TOUCH && !LOW;
const MAX_DPR = 1.5;
const MAX_PIXELS = 1600000;

const mk = (cls) => {
  const d = document.createElement("div");
  d.className = cls;
  d.setAttribute("aria-hidden", "true");
  document.body.appendChild(d);
  return d;
};
mk("d3-mesh");
["a", "b", "c"].forEach((c) => mk("d3-blob " + c));

const hero = document.querySelector(".hero");
if (hero && !WEBGL) hero.classList.add("d3-fallback");

if (hero && WEBGL) {
  const start = () => {
    import("https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js")
      .then((THREE) => mount(THREE, hero))
      .catch(() => hero.classList.add("d3-fallback"));
  };
  const kick = () => {
    if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 250);
  };
  if (document.readyState === "complete") kick();
  else addEventListener("load", kick, { once: true });
}

function pixelRatio(w, h) {
  const raw = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const area = Math.max(1, w * h);
  if (area * raw * raw <= MAX_PIXELS) return raw;
  return Math.max(1, Math.min(raw, Math.sqrt(MAX_PIXELS / area)));
}

function mount(THREE, hero) {
  const canvas = document.createElement("canvas");
  canvas.id = "d3-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch (e) {
    canvas.remove();
    hero.classList.add("d3-fallback");
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03141f, 0.045);
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  cam.position.set(0, 0, 12);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.PointLight(0x2ef2d6, 60, 36);
  key.position.set(3, 6, 6);
  const fill = new THREE.PointLight(0xff6fb5, 36, 36);
  fill.position.set(-6, -2, 5);
  scene.add(key, fill);

  const tc = document.createElement("canvas");
  tc.width = tc.height = 32;
  const g = tc.getContext("2d");
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const glow = new THREE.CanvasTexture(tc);

  const pal = [new THREE.Color(0x2ef2d6), new THREE.Color(0xff6fb5), new THREE.Color(0x8b7cff)];
  const N = 1400;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const arm = i % 3;
    const rad = Math.pow(Math.random(), 0.6) * 14;
    const ang = (arm / 3) * Math.PI * 2 + rad * 0.45;
    const spread = 0.9;
    pos[i * 3] = Math.cos(ang) * rad + (Math.random() - 0.5) * spread * rad * 0.35;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6 * (1 - rad / 16) + (Math.random() - 0.5) * 0.6;
    pos[i * 3 + 2] = Math.sin(ang) * rad + (Math.random() - 0.5) * spread * rad * 0.35;
    const c = pal[arm].clone().lerp(new THREE.Color(0xffffff), Math.max(0, 1 - rad / 3) * 0.7);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const galaxy = new THREE.Points(pg, new THREE.PointsMaterial({
    size: 0.18,
    map: glow,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  galaxy.rotation.x = 0.9;
  galaxy.position.set(3, -0.5, -6);
  scene.add(galaxy);

  const M = 240;
  const sp = new Float32Array(M * 3);
  for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 50;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const dust = new THREE.Points(sg, new THREE.PointsMaterial({
    size: 0.1,
    map: glow,
    color: 0xcffff7,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  const hg = new THREE.Group();
  scene.add(hg);
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.42, 72, 10),
    new THREE.MeshStandardMaterial({
      color: 0x0e6e6a,
      metalness: 0.75,
      roughness: 0.22,
      emissive: 0x0a3d4a,
      emissiveIntensity: 0.55,
    })
  );
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.05, 1),
    new THREE.MeshBasicMaterial({ color: 0x2ef2d6, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const rings = [0xff6fb5, 0x2ef2d6, 0x8b7cff].map((c, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(3.7 + i * 0.5, 0.028, 6, 80),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    m.rotation.set(1.1 + i * 0.4, i * 0.6, 0);
    hg.add(m);
    return m;
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow,
    color: 0x2ef2d6,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  halo.scale.setScalar(6.5);
  hg.add(halo, knot, shell);

  const shapes = [
    new THREE.OctahedronGeometry(0.45),
    new THREE.TetrahedronGeometry(0.5),
    new THREE.BoxGeometry(0.55, 0.55, 0.55),
    new THREE.IcosahedronGeometry(0.4, 0),
  ];
  const floats = [];
  for (let i = 0; i < 8; i++) {
    const c = pal[i % 3];
    const mesh = new THREE.Mesh(
      shapes[i % 4],
      new THREE.MeshBasicMaterial({
        color: c,
        wireframe: i % 2 === 1,
        transparent: i % 2 === 1,
        opacity: i % 2 === 1 ? 0.7 : 1,
      })
    );
    const depth = Math.random();
    const x = (Math.random() - 0.5) * 24;
    const y = (Math.random() - 0.5) * 12;
    mesh.position.set(x, y, -2 - depth * 12 + 4);
    mesh.userData = { d: 1.4 - depth, s: 0.3 + Math.random() * 0.8, o: Math.random() * 6.28, x, y };
    mesh.scale.setScalar(0.7 + Math.random());
    scene.add(mesh);
    floats.push(mesh);
  }

  function size() {
    const w = hero.clientWidth;
    const h = hero.clientHeight || 1;
    renderer.setPixelRatio(pixelRatio(w, h));
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    hg.position.set(4.2, 0.2, 0);
  }
  size();
  addEventListener("resize", size);

  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (FINE) {
    addEventListener("pointermove", (e) => {
      tmx = e.clientX / innerWidth - 0.5;
      tmy = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }

  let visible = true;
  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    const t = clock.getElapsedTime();
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    const sy = Math.min(scrollY / innerHeight, 1.2);
    knot.rotation.set(t * 0.22 + my, t * 0.32 + mx * 1.4, 0);
    shell.rotation.set(-t * 0.08, -t * 0.12 + mx, 0);
    for (let i = 0; i < rings.length; i++) rings[i].rotation.z = t * (0.25 + i * 0.12) * (i % 2 ? -1 : 1);
    halo.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.05;
    galaxy.rotation.y = t * 0.04;
    dust.rotation.y = t * 0.01 + mx * 0.15;
    for (let i = 0; i < floats.length; i++) {
      const mesh = floats[i];
      const u = mesh.userData;
      mesh.rotation.x += 0.01 * u.s;
      mesh.rotation.y += 0.014 * u.s;
      mesh.position.y = u.y + Math.sin(t * u.s + u.o) * 0.45 + sy * u.d * 3;
      mesh.position.x = u.x - mx * u.d * 1.1;
    }
    key.position.x = 5 + Math.sin(t) * 1.5;
    cam.position.x += (mx * 1.8 - cam.position.x) * 0.05;
    cam.position.y += (-my * 1.2 - cam.position.y) * 0.05;
    cam.position.z = 12 + sy * 3;
    cam.lookAt(0, 0, -2);
    renderer.render(scene, cam);
  }

  function startLoop() {
    if (running || document.hidden || !visible) return;
    running = true;
    renderer.setAnimationLoop(frame);
  }
  function stopLoop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }

  new IntersectionObserver(([entry]) => {
    visible = !!entry && entry.isIntersecting;
    if (visible) startLoop();
    else stopLoop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stopLoop();
    hero.classList.add("d3-fallback");
  });

  hero.classList.add("d3-live");
  document.documentElement.classList.add("d3-on");
  startLoop();
}
