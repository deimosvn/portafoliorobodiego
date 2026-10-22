// Dibujos 3D en estilo de plano técnico: celda robótica del hero, modelos CAD con vista explosionada y visor CAD.
(function blueprint() {
  const T = window.THREE;
  if (!T) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tok = n => getComputedStyle(root).getPropertyValue(n).trim();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const clamp01 = v => clamp(v, 0, 1);
  const ease = s => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2);
  const easeOut = s => 1 - Math.pow(1 - s, 3);
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const pad = n => String(n).padStart(2, '0');
  const mm = v => Math.round(v).toLocaleString((window.i18n && window.i18n.locale) || 'es-MX');
  const tr = (s, v) => (window.i18n ? window.i18n.tr(s, v) : s);

  /* ---------- material de plano: relleno del azul del papel + aristas blancas ---------- */
  const off = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const MAT = {
    fill: new T.MeshBasicMaterial({ color: 0x1f56b4, ...off }),
    fillLight: new T.MeshBasicMaterial({ color: 0x4a7fd8, ...off }),
    fillWhite: new T.MeshBasicMaterial({ color: 0xffffff, ...off }),
    line: new T.LineBasicMaterial({ color: 0xffffff }),
    lineBlue: new T.LineBasicMaterial({ color: 0x1f56b4 }),
    mid: new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
    faint: new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.17 }),
    dim: new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }),
  };
  function syncBlue() {
    const c = new T.Color(tok('--blue') || '#1f56b4');
    MAT.fill.color.copy(c);
    MAT.lineBlue.color.copy(c);
    MAT.fillLight.color.copy(c).lerp(new T.Color(0xffffff), 0.2);
  }
  syncBlue();
  const repaint = [];
  const onTheme = () => { syncBlue(); repaint.forEach(f => f()); };
  new MutationObserver(onTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);

  const B = (w, h, d) => new T.BoxGeometry(w, h, d);
  const C = (rt, rb, h, s = 14) => new T.CylinderGeometry(rt, rb, h, s);
  function part(geo, x = 0, y = 0, z = 0, fill = MAT.fill, line = MAT.line, angle = 20) {
    const m = new T.Mesh(geo, fill);
    m.position.set(x, y, z);
    m.add(new T.LineSegments(new T.EdgesGeometry(geo, angle), line));
    return m;
  }
  const alongX = m => { m.rotation.z = Math.PI / 2; return m; };
  const alongZ = m => { m.rotation.x = Math.PI / 2; return m; };
  function beam(a, b, t, z) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const m = part(B(Math.hypot(dx, dy), t, t), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
    m.rotation.z = Math.atan2(dy, dx);
    return m;
  }
  function ring(r, y, mat = MAT.line, seg = 48) {
    const pts = [];
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    return new T.Line(new T.BufferGeometry().setFromPoints(pts), mat);
  }
  function lines(p, mat = MAT.line) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    return new T.LineSegments(g, mat);
  }
  function gridRect(x0, x1, z0, z1, step, y = 0, mat = MAT.faint) {
    const p = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) p.push(x, y, z0, x, y, z1);
    for (let z = z0; z <= z1 + 1e-6; z += step) p.push(x0, y, z, x1, y, z);
    return lines(p, mat);
  }
  function makeRenderer(canvas) {
    try {
      const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.setClearColor(0x000000, 0);
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      return r;
    } catch (e) { return null; }
  }
  function fitOrtho(cam, aspect, halfW, halfH) {
    const hh = Math.max(halfH, halfW / aspect);
    cam.left = -hh * aspect; cam.right = hh * aspect; cam.top = hh; cam.bottom = -hh;
    cam.updateProjectionMatrix();
  }
  function aim(cam, target, az, el, d = 40) {
    cam.position.set(target.x + d * Math.cos(el) * Math.sin(az), target.y + d * Math.sin(el), target.z + d * Math.cos(el) * Math.cos(az));
    cam.lookAt(target);
  }

  /* ---------- robot de 6 ejes (lo usan el hero y los modelos CAD) ---------- */
  const ARM = { H0: 0.78, A1: 0.15, L1: 1.05, L2: 1.0, LT: 0.42, OPEN: 0.22, SHUT: 0.155 };
  function armRig(parent) {
    const { H0, A1, L1, L2, LT, OPEN } = ARM;
    const parts = {};
    const reg = (id, m) => { (parts[id] = parts[id] || []).push(m); return m; };
    const base = new T.Group(); parent.add(base);
    base.add(reg('base', part(C(0.46, 0.5, 0.08, 16), 0, 0.04, 0)));
    base.add(reg('base', part(C(0.31, 0.35, 0.26, 14), 0, 0.21, 0)));
    const j1 = new T.Group(); base.add(j1);
    j1.add(reg('turret', part(C(0.29, 0.31, 0.18, 14), 0, 0.43, 0)));
    j1.add(reg('turret', part(B(0.36, 0.34, 0.46), 0, 0.68, 0.06)));
    const sh = new T.Group(); sh.position.set(0, H0, A1); j1.add(sh);
    const j2 = new T.Group(); sh.add(j2);
    j2.add(reg('j2motor', alongX(part(C(0.18, 0.18, 0.5, 14)))));
    j2.add(reg('j2motor', alongX(part(C(0.11, 0.11, 0.14, 12), 0.31, 0, 0))));
    j2.add(reg('upper', part(B(0.22, 0.26, L1), 0, 0, L1 / 2)));
    const j3 = new T.Group(); j3.position.z = L1; j2.add(j3);
    j3.add(reg('elbow', alongX(part(C(0.16, 0.16, 0.38, 14)))));
    j3.add(reg('elbow', alongX(part(C(0.09, 0.09, 0.12, 12), -0.25, 0, 0))));
    j3.add(reg('elbow', part(B(0.24, 0.24, 0.3), 0, 0, -0.16)));
    j3.add(reg('elbow', alongZ(part(C(0.1, 0.1, 0.16, 12), 0, 0, -0.38))));
    j3.add(reg('forearm', alongZ(part(C(0.09, 0.12, L2 - 0.12, 12), 0, 0, L2 / 2))));
    const j5 = new T.Group(); j5.position.z = L2; j3.add(j5);
    j5.add(reg('wrist', alongX(part(C(0.09, 0.09, 0.24, 12)))));
    const j6 = new T.Group(); j5.add(j6);
    j6.add(reg('flange', alongZ(part(C(0.075, 0.075, 0.08, 12), 0, 0, 0.1))));
    j6.add(reg('gripper', part(B(0.15, 0.15, 0.1), 0, 0, 0.18)));
    j6.add(reg('gripper', part(B(0.52, 0.1, 0.06), 0, 0, LT - 0.19)));
    const fL = reg('fingers', part(B(0.03, 0.09, 0.22), -OPEN, 0, LT - 0.05));
    const fR = reg('fingers', part(B(0.03, 0.09, 0.22), OPEN, 0, LT - 0.05));
    j6.add(fL, fR);
    return { base, j1, j2, j3, j5, j6, fL, fR, parts };
  }
  function armPose(rig, yaw, e2, q3, grip = 0) {
    const e3 = e2 - q3;
    rig.j1.rotation.y = yaw;
    rig.j2.rotation.x = -e2;
    rig.j3.rotation.x = q3;
    rig.j5.rotation.x = Math.PI / 2 + e3;
    rig.j6.rotation.z = yaw;
    const g = ARM.OPEN - (ARM.OPEN - ARM.SHUT) * grip;
    rig.fL.position.x = -g; rig.fR.position.x = g;
  }
  // Cinemática inversa: TCP con la herramienta vertical hacia abajo
  function armIK(cur, base) {
    const { H0, A1, L1, L2, LT } = ARM;
    const lx = cur.x - base.x, lz = cur.z - base.z;
    const yaw = Math.atan2(lx, lz);
    const r = Math.hypot(lx, lz) - A1;
    const wy = cur.y + LT - H0;
    const d = Math.min(Math.hypot(r, wy), L1 + L2 - 1e-3);
    const q3 = Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
    const e2 = Math.atan2(wy, r) + Math.atan2(L2 * Math.sin(q3), L1 + L2 * Math.cos(q3));
    return { yaw, e2, q3 };
  }

  /* =====================================================================
     HERO: línea de manufactura con cinco tipos de robot
     1 brazo de 6 ejes · 2 robot delta · 3 SCARA · 4 robot móvil AMR · 5 dron
     ===================================================================== */
  (function heroCell() {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('cell');
    const renderer = canvas && makeRenderer(canvas);
    if (!renderer) return;
    const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
    const lift = (v, h) => V(v.x, v.y + h, v.z);

    const scene = new T.Scene();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, -60, 60);
    const target = V(0.15, 0.82, -0.35);
    const intro = [];
    const queue = (obj, off, delay) => intro.push({ obj, p0: obj.position.clone(), off: V(...off), delay });
    const addQ = (obj, off, delay) => { scene.add(obj); queue(obj, off, delay); return obj; };

    scene.add(gridRect(-4.4, 4.4, -2.8, 2.4, 0.4));

    // ---------- banda transportadora ----------
    const BELT_Z = 1.25, BELT_Y = 0.55, X0 = -4.45, X1 = 4.45, CUBE = 0.28;
    const SPEED = 0.45, INTERVAL = 1.5;
    const conv = [];
    conv.push(part(B(8.9, 0.06, 0.7), 0, BELT_Y - 0.03, BELT_Z));
    [-1, 1].forEach(s => conv.push(part(B(8.9, 0.1, 0.05), 0, BELT_Y - 0.01, BELT_Z + s * 0.375)));
    for (let x = -3.9; x <= 3.95; x += 1.3) [-1, 1].forEach(s => conv.push(part(B(0.06, BELT_Y - 0.06, 0.06), x, (BELT_Y - 0.06) / 2, BELT_Z + s * 0.33)));
    conv.push(part(B(0.8, 1.15, 1.05), -4.85, 0.575, BELT_Z));
    conv.push(part(B(0.8, 0.85, 1.05), 4.85, 0.425, BELT_Z));
    conv.forEach((m, i) => addQ(m, [0, 1.6, 0], 0.02 * i));
    const SLATS = 28, SLAT_GAP = (X1 - X0) / SLATS;
    const slatPos = new Float32Array(SLATS * 6);
    const slatGeo = new T.BufferGeometry();
    slatGeo.setAttribute('position', new T.BufferAttribute(slatPos, 3));
    scene.add(new T.LineSegments(slatGeo, MAT.mid));
    let slatShift = 0;
    function updateSlats() {
      for (let i = 0; i < SLATS; i++) {
        const x = X0 + ((i * SLAT_GAP + slatShift) % (X1 - X0));
        slatPos.set([x, BELT_Y + 0.002, BELT_Z - 0.33, x, BELT_Y + 0.002, BELT_Z + 0.33], i * 6);
      }
      slatGeo.attributes.position.needsUpdate = true;
    }

    // ---------- movimiento compartido: tramos que siguen una pieza o van a un punto ----------
    const UPV = V(0, 1, 0), tmp = V();
    function rod(t) { return part(B(t, 1, t)); }
    function setRod(m, a, b) {
      tmp.subVectors(b, a);
      const L = tmp.length() || 1e-6;
      m.position.addVectors(a, b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UPV, tmp.multiplyScalar(1 / L));
      m.scale.set(1, L, 1);
    }
    function enter(r) {
      const s = r.seq[r.i];
      r.p0.copy(r.cur); r.gFrom = r.grip;
      if (s.start) s.start();
      if (s.track) s.off = r.p0.clone().sub(s.track()); else s.goal = s.to();
    }
    function pose(r, s, k) {
      const e = ease(Math.min(1, k));
      if (s.track) r.cur.copy(s.track()).addScaledVector(s.off, 1 - e);
      else r.lerp(r.p0, s.goal, e, r.cur);
      r.grip = r.gFrom + (s.g - r.gFrom) * Math.min(1, k / 0.7);
    }
    function run(r, dt) {
      if (!r.seq) return;
      r.t += dt;
      while (r.seq && r.t >= r.seq[r.i].d) {
        const s = r.seq[r.i];
        r.t -= s.d; pose(r, s, 1);
        if (s.end) s.end();
        r.i++;
        if (r.i >= r.seq.length) { r.seq = null; if (r.after) r.after(); }
        else enter(r);
      }
      if (r.seq) pose(r, r.seq[r.i], r.t / r.seq[r.i].d);
    }
    const linear = (p, q, s, out) => out.lerpVectors(p, q, s);

    // ---------- piezas en la banda ----------
    const items = [];
    const cubeGeo = B(CUBE, CUBE, CUBE), discGeo = C(0.11, 0.11, 0.07, 16);
    const looks = [[MAT.fillWhite, MAT.lineBlue], [MAT.fillLight, MAT.line], [MAT.fill, MAT.line]];
    const PATTERN = ['cube', 'disc', null, 'disc'];
    let simT = 0, spawnClock = 0, pat = 0, nCube = 0, nDisc = 0, placed = 0;
    function spawn() {
      const kind = PATTERN[pat++ % PATTERN.length];
      if (!kind) return;
      let m;
      if (kind === 'cube') { const [f, l] = looks[nCube++ % 3]; m = part(cubeGeo, X0 - 0.1, BELT_Y + CUBE / 2, BELT_Z, f, l); }
      else m = part(discGeo, X0 - 0.1, BELT_Y + 0.035, BELT_Z + (nDisc++ % 2 ? 0.12 : -0.12), MAT.fillWhite, MAT.lineBlue);
      scene.add(m);
      items.push({ m, kind, state: 'belt', claimed: false });
    }
    function placeOn(r) {
      const c = r.held; if (!c) return;
      r.held = null; c.state = 'placed';
      c.m.position.copy(r.slots[r.slot]);
      items.splice(items.indexOf(c), 1);
      r.stack.push(c); r.slot++; placed++;
      if (r.slot >= r.slots.length) { r.slot = 0; r.clearAt = simT + 1.0; }
    }
    function clearStack(r) {
      if (!r.clearAt || simT < r.clearAt) return;
      const k = Math.min(1, (simT - r.clearAt) / 0.7);
      r.stack.forEach(c => c.m.scale.setScalar(Math.max(0.001, 1 - ease(k))));
      if (k >= 1) { r.stack.forEach(c => scene.remove(c.m)); r.stack = []; r.clearAt = 0; }
    }

    // ---------- 1 · brazo de 6 ejes que paletiza cubos ----------
    const ORDER = ['base', 'turret', 'j2motor', 'upper', 'elbow', 'forearm', 'wrist', 'flange', 'gripper', 'fingers'];
    const arm = (() => {
      const bx = 1.6, px = 2.65, pz = -0.75;
      const holder = new T.Group(); holder.position.set(bx, 0, 0); scene.add(holder);
      const rig = armRig(holder);
      ORDER.forEach((id, j) => (rig.parts[id] || []).forEach(m => queue(m, [Math.sin(j * 1.7) * 0.5, 0.9 + (j % 3) * 0.25, Math.cos(j * 1.3) * 0.5], 0.35 + j * 0.07)));
      addQ(part(B(0.98, 0.12, 0.98), px, 0.06, pz), [0, 1.2, 0], 0.4);
      const slots = [];
      for (let l = 0; l < 2; l++) for (let i = 0; i < 4; i++)
        slots.push(V(px + (i % 2 ? 0.2 : -0.2), 0.12 + CUBE / 2 + l * (CUBE + 0.004), pz + (i < 2 ? -0.2 : 0.2)));
      const a = { rig, base: V(bx, 0, 0), pickX: bx, home: V(bx, 1.3, 1.0), cur: V(bx, 1.3, 1.0), p0: V(), grip: 0, gFrom: 0,
        seq: null, i: 0, t: 0, held: null, slots, slot: 0, stack: [], clearAt: 0, label: V(bx, 2.25, 0) };
      a.lerp = (p, q, s, out) => {
        const ax = p.x - a.base.x, az = p.z - a.base.z, bx2 = q.x - a.base.x, bz = q.z - a.base.z;
        const ta = Math.atan2(ax, az), ra = Math.hypot(ax, az), rb = Math.hypot(bx2, bz);
        let d = Math.atan2(bx2, bz) - ta; d = Math.atan2(Math.sin(d), Math.cos(d));
        const t = ta + d * s, r = ra + (rb - ra) * s;
        return out.set(a.base.x + Math.sin(t) * r, p.y + (q.y - p.y) * s, a.base.z + Math.cos(t) * r);
      };
      return a;
    })();
    function armBegin(c) {
      c.claimed = true;
      const pos = () => c.m.position;
      arm.seq = [
        { d: 1.05, g: 0, track: () => lift(pos(), 0.36) },
        { d: 0.5, g: 0, track: () => pos().clone() },
        { d: 0.3, g: 1, track: () => pos().clone(), end: () => { c.state = 'held'; arm.held = c; } },
        { d: 0.5, g: 1, to: () => lift(arm.cur, 0.45) },
        { d: 1.3, g: 1, to: () => lift(arm.slots[arm.slot], 0.42) },
        { d: 0.5, g: 1, to: () => arm.slots[arm.slot].clone() },
        { d: 0.28, g: 0, to: () => arm.cur.clone(), start: () => placeOn(arm) },
        { d: 0.4, g: 0, to: () => lift(arm.cur, 0.4) },
        { d: 0.95, g: 0, to: () => arm.home.clone() },
      ];
      arm.i = 0; arm.t = 0; enter(arm);
    }
    function armSolve() {
      const ik = armIK(arm.cur, arm.base);
      armPose(arm.rig, ik.yaw, ik.e2, ik.q3, arm.grip);
      if (arm.held) arm.held.m.position.copy(arm.cur);
    }

    // ---------- 2 · robot delta (paralelo) que clasifica discos ----------
    const delta = (() => {
      const X = -2.1, Y = 1.85, Z = BELT_Z, RB = 0.3, LA = 0.42, LB = 1.1, RP = 0.09, TIP = 0.15, TZ = 0.72;
      const g = new T.Group(); scene.add(g);
      [0.36, 2.1].forEach(z => g.add(part(B(0.08, 2.0, 0.08), X, 1.0, z)));
      g.add(part(B(0.1, 0.1, 1.82), X, 2.03, (0.36 + 2.1) / 2));
      g.add(part(C(RB + 0.07, RB + 0.07, 0.07, 6), X, Y + 0.06, Z));
      const angs = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      angs.forEach(f => g.add(part(B(0.13, 0.11, 0.13), X + Math.cos(f) * RB, Y, Z - Math.sin(f) * RB)));
      const uppers = angs.map(() => { const m = rod(0.06); g.add(m); return m; });
      const lowPos = new Float32Array(36);
      const lowGeo = new T.BufferGeometry(); lowGeo.setAttribute('position', new T.BufferAttribute(lowPos, 3));
      g.add(new T.LineSegments(lowGeo, MAT.line));
      const plat = new T.Group();
      plat.add(part(C(RP + 0.03, RP + 0.03, 0.04, 6)));
      plat.add(part(C(0.03, 0.03, 0.08, 10), 0, -0.07, 0));
      plat.add(part(C(0.05, 0.025, 0.04, 10), 0, -0.13, 0));
      g.add(plat);
      g.add(part(B(0.06, 0.48, 0.06), X, 0.24, TZ));
      g.add(part(B(0.52, 0.05, 0.52), X, 0.505, TZ));
      const slots = [];
      for (let i = 0; i < 4; i++) slots.push(V(X + (i % 2 ? 0.12 : -0.12), 0.565, TZ + (i < 2 ? -0.12 : 0.12)));
      const P = V(), J = V(), E = V(), A = V();
      function solve(cur) {
        P.set(cur.x, cur.y + TIP, cur.z);
        const px = P.x - X, py = P.y - Y, pz = P.z - Z;
        angs.forEach((f, i) => {
          const c = Math.cos(f), s = Math.sin(f);
          const xr = px * c - pz * s, zr = px * s + pz * c;
          const dx = xr + RP - RB, dy = py;
          const K = LB * LB - zr * zr - LA * LA - dx * dx - dy * dy;
          const a = -2 * LA * dx, b = 2 * LA * dy, R = Math.hypot(a, b) || 1e-6;
          const ang = Math.atan2(b, a), d = Math.acos(clamp(K / R, -1, 1));
          let th = ang + d; const th2 = ang - d;
          if (Math.cos(th2) > Math.cos(th)) th = th2;
          const ex = RB + LA * Math.cos(th), ey = -LA * Math.sin(th);
          J.set(X + c * RB, Y, Z - s * RB);
          E.set(X + c * ex, Y + ey, Z - s * ex);
          setRod(uppers[i], J, E);
          A.set(P.x + c * RP, P.y, P.z - s * RP);
          const tx = s * 0.05, tz = c * 0.05;
          lowPos.set([E.x + tx, E.y, E.z + tz, A.x + tx, A.y, A.z + tz, E.x - tx, E.y, E.z - tz, A.x - tx, A.y, A.z - tz], i * 12);
        });
        lowGeo.attributes.position.needsUpdate = true;
        plat.position.copy(P);
      }
      queue(g, [0, 1.8, 0], 0.55);
      return { g, X, cur: V(X, 1.0, 1.05), home: V(X, 1.0, 1.05), p0: V(), grip: 0, gFrom: 0, seq: null, i: 0, t: 0,
        held: null, slots, slot: 0, stack: [], clearAt: 0, solve, lerp: linear, label: V(X, 2.2, Z) };
    })();
    function deltaBegin(it) {
      const d = delta; it.claimed = true;
      const top = () => V(it.m.position.x, it.m.position.y + 0.035, it.m.position.z);
      d.seq = [
        { d: 0.36, g: 0, track: () => lift(top(), 0.24) },
        { d: 0.16, g: 0, track: top },
        { d: 0.08, g: 1, track: top, end: () => { it.state = 'held'; d.held = it; } },
        { d: 0.16, g: 1, to: () => lift(d.cur, 0.24) },
        { d: 0.34, g: 1, to: () => lift(d.slots[d.slot], 0.275) },
        { d: 0.16, g: 1, to: () => lift(d.slots[d.slot], 0.035) },
        { d: 0.07, g: 0, to: () => d.cur.clone(), start: () => placeOn(d) },
        { d: 0.16, g: 0, to: () => lift(d.cur, 0.22) },
        { d: 0.3, g: 0, to: () => d.home.clone() },
      ];
      d.i = 0; d.t = 0; enter(d);
    }

    // ---------- 3 · robot SCARA que ensambla en una mesa ----------
    const scara = (() => {
      const BX = -0.35, BZ = -1.25, A1 = 0.5, A2 = 0.42, H = 1.15, UPY = 1.05;
      const g = new T.Group(); scene.add(g);
      g.add(part(B(1.4, 0.06, 0.5), -0.35, 0.7, -0.55));
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(part(B(0.05, 0.67, 0.05), -0.35 + sx * 0.64, 0.335, -0.55 + sz * 0.2))));
      const PA = V(-0.8, 0.77, -0.55), PB = V(0.1, 0.77, -0.55);
      [PA, PB].forEach(p => g.add(part(B(0.18, 0.04, 0.18), p.x, 0.75, p.z)));
      g.add(part(C(0.15, 0.19, H - 0.06, 14), BX, (H - 0.06) / 2, BZ));
      const j1 = new T.Group(); j1.position.set(BX, H, BZ); g.add(j1);
      j1.add(part(C(0.14, 0.14, 0.12, 14)));
      j1.add(part(B(A1, 0.1, 0.17), A1 / 2, 0, 0));
      const j2 = new T.Group(); j2.position.set(A1, 0.1, 0); j1.add(j2);
      j2.add(part(C(0.11, 0.11, 0.12, 14)));
      j2.add(part(B(A2, 0.09, 0.13), A2 / 2, 0, 0));
      j2.add(part(C(0.07, 0.07, 0.14, 12), A2, 0.04, 0));
      const quill = part(C(0.025, 0.025, 0.7, 10)); quill.position.x = A2; j2.add(quill);
      const tool = new T.Group(); tool.position.x = A2; j2.add(tool);
      tool.add(part(C(0.055, 0.055, 0.04, 12)));
      const fa = part(B(0.02, 0.07, 0.05), -0.075, -0.05, 0), fb = part(B(0.02, 0.07, 0.05), 0.075, -0.05, 0);
      tool.add(fa, fb);
      const piece = part(C(0.05, 0.05, 0.1, 12), PA.x, PA.y + 0.05, PA.z, MAT.fillWhite, MAT.lineBlue); g.add(piece);
      const s = { g, cur: V(PA.x, UPY, PA.z), p0: V(), grip: 0, gFrom: 0, seq: null, i: 0, t: 0, held: false, src: PA, dst: PB, lerp: linear, label: V(BX, 1.5, BZ) };
      s.solve = () => {
        const t = s.cur, dx = t.x - BX, dz = t.z - BZ;
        const q2 = Math.acos(clamp((dx * dx + dz * dz - A1 * A1 - A2 * A2) / (2 * A1 * A2), -1, 1));
        const q1 = Math.atan2(-dz, dx) - Math.atan2(A2 * Math.sin(q2), A1 + A2 * Math.cos(q2));
        j1.rotation.y = q1; j2.rotation.y = q2;
        const ty = t.y + 0.05 - (H + 0.1);
        tool.position.y = ty; quill.position.y = ty + 0.37;
        const gap = 0.075 - 0.013 * s.grip;
        fa.position.x = -gap; fb.position.x = gap;
        if (s.held) piece.position.copy(t);
      };
      s.cycle = () => {
        const a = s.src, b = s.dst, hold = a.y + 0.05, at = (p, y) => V(p.x, y, p.z);
        s.seq = [
          { d: 0.32, g: 0, to: () => at(a, hold) },
          { d: 0.14, g: 1, to: () => at(a, hold), end: () => { s.held = true; } },
          { d: 0.3, g: 1, to: () => at(a, UPY) },
          { d: 0.8, g: 1, to: () => at(b, UPY) },
          { d: 0.3, g: 1, to: () => at(b, hold) },
          { d: 0.14, g: 0, to: () => at(b, hold), start: () => { s.held = false; piece.position.set(b.x, hold, b.z); } },
          { d: 0.3, g: 0, to: () => at(b, UPY) },
        ];
        s.i = 0; s.t = 0; enter(s);
      };
      s.after = () => { const t = s.src; s.src = s.dst; s.dst = t; s.cycle(); };
      s.cycle();
      queue(g, [0, 1.5, 0], 0.7);
      return s;
    })();

    // ---------- 4 · robot móvil AMR que recorre el pasillo ----------
    const amr = (() => {
      const g = new T.Group(); scene.add(g);
      g.add(part(B(0.8, 0.2, 0.55), 0, 0.16, 0));
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => g.add(alongZ(part(C(0.07, 0.07, 0.05, 12), sx * 0.27, 0.07, sz * 0.29)))));
      g.add(part(C(0.07, 0.07, 0.08, 12), 0.3, 0.3, 0));
      g.add(part(B(0.46, 0.28, 0.4), -0.08, 0.4, 0, MAT.fillLight));
      const scan = lines([0, 0, 0, 0.75, 0, 0], MAT.mid); scan.position.set(0.3, 0.3, 0); g.add(scan);
      const XA = -3.1, XB = 3.1, ZA = -1.95, ZB = -2.55, R = (ZA - ZB) / 2, ZC = (ZA + ZB) / 2;
      const Ls = XB - XA, Lc = Math.PI * R, total = 2 * Ls + 2 * Lc;
      function at(s, out) {
        s = ((s % total) + total) % total;
        if (s < Ls) return out.set(XA + s, 0, ZA);
        s -= Ls;
        if (s < Lc) { const a = s / R; return out.set(XB + Math.sin(a) * R, 0, ZC + Math.cos(a) * R); }
        s -= Lc;
        if (s < Ls) return out.set(XB - s, 0, ZB);
        s -= Ls;
        const a = s / R; return out.set(XA - Math.sin(a) * R, 0, ZC - Math.cos(a) * R);
      }
      const o = { g, s: 1.2, label: V(), p: V(), q: V() };
      o.update = (dt) => {
        o.s += dt * 0.65;
        at(o.s, o.p); at(o.s + 0.05, o.q);
        g.position.copy(o.p);
        g.rotation.y = Math.atan2(-(o.q.z - o.p.z), o.q.x - o.p.x);
        scan.rotation.y += dt * 6;
        o.label.set(o.p.x, 0.75, o.p.z);
      };
      o.update(0);
      queue(g, [0, 1.2, 0], 0.85);
      return o;
    })();

    // ---------- 5 · dron de inventario ----------
    const drone = (() => {
      const g = new T.Group(); scene.add(g);
      g.add(part(B(0.26, 0.08, 0.26)));
      [Math.PI / 4, -Math.PI / 4].forEach(a => { const b = part(B(0.5, 0.025, 0.035)); b.rotation.y = a; g.add(b); });
      const blades = [];
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        const x = sx * 0.177, z = sz * 0.177;
        const r = ring(0.11, 0.03, MAT.mid, 24); r.position.set(x, 0, z); g.add(r);
        g.add(part(C(0.02, 0.02, 0.05, 8), x, 0.02, z));
        const bl = lines([-0.1, 0, 0, 0.1, 0, 0]); bl.position.set(x, 0.05, z); g.add(bl); blades.push(bl);
      });
      g.add(part(B(0.08, 0.07, 0.08), 0, -0.08, 0));
      const o = { g, t: 0, label: V() };
      o.update = (dt) => {
        o.t += dt;
        const t = o.t * 0.32;
        g.position.set(0.6 + Math.sin(t) * 1.5, 2.2 + Math.sin(o.t * 1.9) * 0.05, -0.8 + Math.sin(t * 2) * 0.45);
        g.rotation.y = Math.sin(t) * 0.6;
        g.rotation.z = -Math.cos(t) * 0.12;
        blades.forEach((b, i) => { b.rotation.y += dt * (i % 2 ? 30 : -30); });
        o.label.set(g.position.x, g.position.y + 0.25, g.position.z);
      };
      o.update(0);
      queue(g, [0, 1.5, 0], 1.0);
      return o;
    })();

    function step(dt) {
      simT += dt;
      slatShift = (slatShift + SPEED * dt) % (X1 - X0);
      spawnClock -= dt;
      if (spawnClock <= 0) { spawn(); spawnClock += INTERVAL; }
      for (const it of items) {
        if (it.state !== 'belt') continue;
        it.m.position.x += SPEED * dt;
        const x = it.m.position.x;
        if (!it.claimed) {
          if (it.kind === 'cube' && !arm.seq && x >= arm.pickX - 0.75 && x <= arm.pickX + 0.25) armBegin(it);
          else if (it.kind === 'disc' && !delta.seq && x >= delta.X - 0.4 && x <= delta.X + 0.15) deltaBegin(it);
        }
        if (x > X1 + 0.2) it.state = 'gone';
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].state === 'gone') { scene.remove(items[i].m); items.splice(i, 1); }
      run(arm, dt); armSolve();
      run(delta, dt); delta.solve(delta.cur);
      if (delta.held) delta.held.m.position.set(delta.cur.x, delta.cur.y - 0.035, delta.cur.z);
      run(scara, dt); scara.solve();
      clearStack(arm); clearStack(delta);
      amr.update(dt); drone.update(dt);
    }

    // Arranca con la línea ya en marcha
    for (let i = 0; i < 26 * 30; i++) step(1 / 30);
    updateSlats();
    intro.forEach(it => it.p0.copy(it.obj.position));

    // Ensamble de entrada
    const INTRO = intro.reduce((m, it) => Math.max(m, it.delay), 0) + 0.9;
    let introT = reduce ? INTRO : 0;
    const callWrap = document.getElementById('callouts');
    function applyIntro() {
      const show = introT >= INTRO - 0.45;
      items.forEach(c => { c.m.visible = show; });
      [arm, delta].forEach(r => r.stack.forEach(c => { c.m.visible = show; }));
      if (callWrap) callWrap.style.opacity = show ? '1' : '0';
      intro.forEach(it => {
        const k = easeOut(clamp01((introT - it.delay) / 0.9));
        it.obj.position.copy(it.p0).addScaledVector(it.off, 1 - k);
      });
    }
    applyIntro();

    // Etiquetas numeradas, como globos de un plano
    const calls = [
      [1, 'Brazo de 6 ejes', () => arm.label],
      [2, 'Robot delta', () => delta.label],
      [3, 'Robot SCARA', () => scara.label],
      [4, 'Robot móvil AMR', () => amr.label],
      [5, 'Dron de inventario', () => drone.label],
    ].map(([n, t, p]) => {
      const el = document.createElement('span');
      el.className = 'callout';
      if (callWrap) callWrap.appendChild(el);
      return { el, p, n, t };
    });
    const labelCalls = () => calls.forEach(c => { c.el.innerHTML = `<i>${c.n}</i><span>${tr(c.t)}</span>`; });
    labelCalls();
    document.addEventListener('langchange', labelCalls);
    const pv = V();
    let cw = 1, ch = 1;
    function placeCalls() {
      calls.forEach(c => {
        pv.copy(c.p()).project(cam);
        c.el.style.transform = `translate(${(((pv.x + 1) / 2) * cw - 10).toFixed(1)}px, ${(((1 - pv.y) / 2) * ch - 38).toFixed(1)}px)`;
      });
    }

    // Cámara isométrica con paralaje suave
    let aspect = 2, px = 0, py = 0, tx = 0, ty = 0;
    function size() {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      cw = r.width; ch = r.height; aspect = r.width / r.height;
      const narrow = aspect < 1.2;
      fitOrtho(cam, aspect, narrow ? 3.1 : 4.35, narrow ? 2.45 : 2.3);
    }
    function view(time) {
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      const k = 1 - easeOut(clamp01(introT / INTRO));
      const az = 0.62 + px * 0.12 + (reduce ? 0 : Math.sin(time * 0.1) * 0.05) + k * 0.35;
      const el = 0.5 - py * 0.05 + k * 0.12;
      aim(cam, target, az, el);
    }
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    const hc = document.getElementById('hudCount');
    let running = false, raf = 0, last = 0, hudT = 0;
    function draw() { view(simT); renderer.render(scene, cam); placeCalls(); stage.classList.add('is-live'); }
    function frame(now) {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (introT < INTRO) { introT += dt; applyIntro(); }
      else { step(dt); updateSlats(); }
      draw();
      hudT -= dt; if (hudT <= 0 && hc) { hc.textContent = String(placed).padStart(4, '0'); hudT = 0.2; }
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    size(); draw();
    if (hc) hc.textContent = String(placed).padStart(4, '0');
    repaint.push(() => { if (!running) draw(); });
    new ResizeObserver(() => { size(); if (!running) draw(); }).observe(stage);
    let inView = true;
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView && !document.hidden ? start() : stop(); }).observe(stage);
    document.addEventListener('visibilitychange', () => { inView && !document.hidden ? start() : stop(); });
  })();

  /* =====================================================================
     MODELOS CAD: cada pieza tiene número, material, proceso y dirección de explosión
     ===================================================================== */
  const DESIGNS = {
    cell: {
      code: 'D-01', name: 'Celda robótica de manufactura', unit: 1000, scale: '1:50', grid: 0.5, crumbs: 'Manufactura flexible · Proyecto ITM',
      note: 'Representación 3D de la celda. Los planos originales se hicieron en SolidWorks y AutoCAD.',
      parts: [
        { id: 'robot', n: 'Robot industrial de 6 ejes', m: 'Ensamble comercial', p: 'Integración', q: 1, ex: [0, 1.5, 0] },
        { id: 'riser', n: 'Pedestal del robot', m: 'Acero A36', p: 'Soldadura y maquinado', q: 1, ex: [0, 0.6, 0] },
        { id: 'cnc', n: 'Centro de maquinado CNC', m: 'Ensamble comercial', p: 'Integración', q: 1, ex: [-1.5, 0, -0.2] },
        { id: 'conveyor', n: 'Banda transportadora', m: 'Perfil de aluminio', p: 'Ensamble', q: 1, ex: [0.3, 0, 1.5] },
        { id: 'table', n: 'Mesa de fixtures', m: 'Acero A36', p: 'Maquinado', q: 1, ex: [1.5, 0, 0] },
        { id: 'work', n: 'Pieza de trabajo', m: 'Aluminio 6061', p: 'Maquinado CNC', q: 4, ex: [0, 0.9, 0] },
        { id: 'cabinet', n: 'Tablero de control con PLC', m: 'Lámina calibre 14', p: 'Ensamble eléctrico', q: 1, ex: [0.6, 0, -1.3] },
        { id: 'fence', n: 'Guarda perimetral', m: 'Malla de acero', p: 'Modular atornillada', q: 3, ex: [0, 0, -1] },
        { id: 'curtain', n: 'Cortina de luz de seguridad', m: 'Ensamble comercial', p: 'Integración', q: 2, ex: [-0.3, 0.6, 1] },
      ],
      build(add, attach, model) {
        add('riser', part(B(0.7, 0.4, 0.7), 0, 0.2, 0));
        const t = new T.Group(); t.position.y = 0.4; model.add(t);
        const rig = armRig(t); armPose(rig, -0.95, 1.15, 1.85, 0.6);
        Object.values(rig.parts).forEach(ms => ms.forEach(m => attach('robot', m)));
        model.remove(t);
        const cnc = new T.Group();
        cnc.add(part(B(1.4, 1.7, 1.3), -2.05, 0.85, -0.2));
        cnc.add(part(B(0.02, 0.6, 0.72), -1.34, 1.0, -0.2));
        cnc.add(part(B(0.08, 0.5, 0.32), -1.31, 1.15, 0.32));
        cnc.add(part(C(0.05, 0.05, 0.32, 10), -2.55, 1.86, -0.7));
        add('cnc', cnc);
        const conv = new T.Group();
        conv.add(part(B(3.6, 0.06, 0.5), 0.5, 0.78, 1.45));
        [-1, 1].forEach(s => conv.add(part(B(3.6, 0.08, 0.04), 0.5, 0.8, 1.45 + s * 0.27)));
        [-1.1, 0.0, 1.1, 2.1].forEach(x => [-1, 1].forEach(s => conv.add(part(B(0.05, 0.75, 0.05), x, 0.375, 1.45 + s * 0.22))));
        [-1.3, 2.3].forEach(x => conv.add(alongZ(part(C(0.05, 0.05, 0.52, 10), x, 0.78, 1.45))));
        conv.add(part(B(0.22, 0.22, 0.22), 2.3, 0.58, 1.82));
        add('conveyor', conv);
        const table = new T.Group();
        table.add(part(B(1.1, 0.08, 0.8), 2.0, 0.8, -0.3));
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => table.add(part(B(0.06, 0.76, 0.06), 2.0 + sx * 0.48, 0.38, -0.3 + sz * 0.33))));
        table.add(part(B(0.2, 0.1, 0.2), 1.75, 0.89, -0.3));
        table.add(part(B(0.2, 0.1, 0.2), 2.25, 0.89, -0.3));
        add('table', table);
        add('work', part(C(0.08, 0.08, 0.16, 12), 1.75, 1.02, -0.3, MAT.fillWhite, MAT.lineBlue));
        add('work', part(C(0.08, 0.08, 0.16, 12), 2.25, 1.02, -0.3, MAT.fillWhite, MAT.lineBlue));
        add('work', part(B(0.22, 0.12, 0.22), 1.2, 0.87, 1.45, MAT.fillWhite, MAT.lineBlue), [0, 0.9, 0.4]);
        add('work', part(B(0.22, 0.12, 0.22), -0.3, 0.87, 1.45, MAT.fillWhite, MAT.lineBlue), [0, 0.9, 0.4]);
        const cab = new T.Group();
        cab.add(part(B(0.9, 1.9, 0.45), 1.4, 0.95, -2.0));
        cab.add(part(B(0.012, 1.7, 0.012), 1.4, 0.95, -1.77));
        cab.add(part(B(0.03, 0.16, 0.03), 1.5, 1.0, -1.765));
        cab.add(part(B(0.6, 0.06, 0.3), 1.4, 1.93, -2.0));
        add('cabinet', cab);
        // Guarda perimetral: marco con malla de líneas
        function fence(x0, z0, x1, z1) {
          const g = new T.Group(), L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0), n = Math.round(L / 1.25);
          for (let i = 0; i <= n; i++) { const k = i / n; g.add(part(B(0.06, 2.0, 0.06), x0 + (x1 - x0) * k, 1.0, z0 + (z1 - z0) * k)); }
          [0.15, 2.0].forEach(y => { const r = part(B(L, 0.05, 0.05), (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = -ang; g.add(r); });
          const p = [];
          for (let s = 0.2; s < L; s += 0.2) { const x = x0 + Math.cos(ang) * s, z = z0 + Math.sin(ang) * s; p.push(x, 0.15, z, x, 2.0, z); }
          for (let y = 0.35; y < 2.0; y += 0.2) p.push(x0, y, z0, x1, y, z1);
          g.add(lines(p, MAT.mid));
          return g;
        }
        add('fence', fence(-3.0, -2.5, 3.2, -2.5), [0, 0, -1]);
        add('fence', fence(-3.0, -2.5, -3.0, 0.8), [-1, 0, 0]);
        add('fence', fence(3.2, -2.5, 3.2, 0.8), [1, 0, 0]);
        add('curtain', part(B(0.08, 1.8, 0.08), -3.0, 0.9, 1.3));
        const post = part(B(0.08, 1.8, 0.08), -1.6, 0.9, 1.3);
        const beams = []; for (let y = 0.3; y < 1.8; y += 0.2) beams.push(-1.36, y - 0.9, 0, -0.04, y - 0.9, 0);
        post.add(lines(beams, MAT.mid));
        add('curtain', post);
      },
    },
    arm: {
      code: 'D-02', name: 'Brazo robótico de 6 ejes', unit: 500, scale: '1:10', grid: 0.25, crumbs: 'Robótica industrial · Estudio de diseño',
      note: 'Estudio de diseño. La cinemática inversa de este mismo modelo mueve los robots del inicio.',
      parts: [
        { id: 'base', n: 'Base', m: 'Fundición de aluminio', p: 'Fundición y maquinado', q: 1, ex: [0, -0.45, 0] },
        { id: 'turret', n: 'Torreta J1', m: 'Fundición de aluminio', p: 'Fundición y maquinado', q: 1, ex: [0, 0, -0.35] },
        { id: 'j2motor', n: 'Servomotor J2 con reductor', m: 'Ensamble comercial', p: 'Integración', q: 1, ex: [0.9, 0.1, 0] },
        { id: 'upper', n: 'Brazo J2', m: 'Fundición de aluminio', p: 'Fundición y maquinado', q: 1, ex: [-0.7, 0.3, -0.2] },
        { id: 'elbow', n: 'Carcasa J3 con contrapeso', m: 'Fundición de aluminio', p: 'Fundición y maquinado', q: 1, ex: [0.45, 0.8, -0.4] },
        { id: 'forearm', n: 'Antebrazo J4', m: 'Aluminio 7075', p: 'Maquinado CNC', q: 1, ex: [0, 0.75, 0.45] },
        { id: 'wrist', n: 'Muñeca J5', m: 'Aluminio 7075', p: 'Maquinado CNC', q: 1, ex: [0, 0.55, 0.95] },
        { id: 'flange', n: 'Brida J6 ISO 9409', m: 'Acero inoxidable', p: 'Torneado', q: 1, ex: [0, 0.2, 1.25] },
        { id: 'gripper', n: 'Cuerpo de pinza', m: 'Aluminio 6061', p: 'Maquinado CNC', q: 1, ex: [0, -0.15, 1.45] },
        { id: 'fingers', n: 'Dedo de pinza', m: 'Acero 4140', p: 'Maquinado CNC', q: 2, ex: [0, -0.45, 1.6] },
      ],
      build(add, attach, model) {
        const t = new T.Group(); model.add(t);
        const rig = armRig(t); armPose(rig, 0, 1.15, 1.75, 0);
        Object.entries(rig.parts).forEach(([id, ms]) => ms.forEach((m, i) => {
          if (id === 'fingers') attach(id, m, [i ? 0.3 : -0.3, -0.45, 1.6]); else attach(id, m);
        }));
        model.remove(t);
      },
    },
    rover: {
      code: 'D-03', name: 'Rover de exploración 6×6', unit: 500, scale: '1:10', grid: 0.25, crumbs: 'Vehículos · Estudio de diseño',
      note: 'Estudio de diseño de un rover con suspensión rocker-bogie para terreno irregular.',
      parts: [
        { id: 'chassis', n: 'Chasis', m: 'Aluminio 6061', p: 'Corte láser y doblez', q: 1, ex: [0, 0, 0] },
        { id: 'deck', n: 'Placa superior', m: 'Aluminio 5052', p: 'Corte láser', q: 1, ex: [0, 0.6, 0] },
        { id: 'bay', n: 'Bahía electrónica (ESP32 y drivers)', m: 'PETG', p: 'Impresión 3D', q: 1, ex: [-0.2, 1.15, -0.2] },
        { id: 'solar', n: 'Panel solar', m: 'Silicio monocristalino', p: 'Comercial', q: 1, ex: [0.2, 0.95, 0.3] },
        { id: 'mast', n: 'Mástil con cámara', m: 'Aluminio y PETG', p: 'Torneado e impresión 3D', q: 1, ex: [0.4, 1.5, 0.1] },
        { id: 'antenna', n: 'Antena', m: 'Fibra de vidrio', p: 'Comercial', q: 1, ex: [-0.4, 1.4, -0.1] },
        { id: 'arm', n: 'Brazo frontal de 2 GDL', m: 'Aluminio 6061', p: 'Corte láser', q: 1, ex: [1.0, 0.2, 0] },
        { id: 'rocker', n: 'Balancín (rocker)', m: 'Aluminio 6061', p: 'Router CNC', q: 2, ex: [0, 0, 0.55] },
        { id: 'bogie', n: 'Bogie', m: 'Aluminio 6061', p: 'Router CNC', q: 2, ex: [0, -0.25, 0.85] },
        { id: 'hub', n: 'Eje y buje', m: 'Acero 1045', p: 'Torneado', q: 8, ex: [0, 0, 1.05] },
        { id: 'wheel', n: 'Rueda', m: 'TPU', p: 'Impresión 3D', q: 6, ex: [0, -0.1, 1.4] },
      ],
      build(add) {
        add('chassis', part(B(1.7, 0.32, 1.0), 0, 0.98, 0));
        add('deck', part(B(1.5, 0.05, 0.86), -0.05, 1.165, 0));
        add('bay', part(B(0.55, 0.22, 0.42), -0.4, 1.3, -0.12));
        add('solar', part(B(0.6, 0.03, 0.46), 0.2, 1.21, 0.14, MAT.fillLight));
        const mast = new T.Group();
        mast.add(part(C(0.035, 0.035, 0.85, 8), 0.6, 1.6, 0.28));
        mast.add(part(B(0.32, 0.14, 0.2), 0.6, 2.08, 0.28));
        mast.add(alongX(part(C(0.045, 0.045, 0.08, 10), 0.8, 2.08, 0.28)));
        add('mast', mast);
        add('antenna', part(C(0.015, 0.015, 0.6, 6), -0.72, 1.48, -0.32));
        const arm = new T.Group();
        arm.add(beam([0.85, 1.0], [1.15, 1.28], 0.06, 0));
        arm.add(beam([1.15, 1.28], [1.38, 0.96], 0.05, 0));
        arm.add(part(B(0.12, 0.1, 0.16), 1.4, 0.9, 0));
        add('arm', arm);
        for (const s of [-1, 1]) {
          const z = s * 0.62, piv = [0, 0.92], front = [0.85, 0.32], bog = [-0.45, 0.6], mid = [-0.08, 0.32], rear = [-0.82, 0.32];
          const rk = [0, 0, 0.55 * s], bg = [0, -0.25, 0.85 * s], hb = [0, 0, 1.05 * s], wh = [0, -0.1, 1.4 * s];
          add('rocker', beam(piv, front, 0.07, z), rk); add('rocker', beam(piv, bog, 0.07, z), rk);
          add('bogie', beam(bog, mid, 0.06, z), bg); add('bogie', beam(bog, rear, 0.06, z), bg);
          add('hub', alongZ(part(C(0.07, 0.07, 0.14, 10), piv[0], piv[1], s * 0.56)), hb);
          [front, mid, rear].forEach(p => {
            add('wheel', alongZ(part(C(0.3, 0.3, 0.22, 16), p[0], p[1], s * 0.78)), wh);
            add('hub', alongZ(part(C(0.05, 0.05, 0.16, 8), p[0], p[1], s * 0.67)), hb);
          });
        }
      },
    },
    rocket: {
      code: 'D-04', name: 'Cohete sonda experimental', unit: 400, scale: '1:20', grid: 0.25, crumbs: 'Aeroespacial · Estudio de diseño',
      note: 'Estudio de diseño de un cohete sonda de dos secciones con su torre de lanzamiento.',
      parts: [
        { id: 'nose', n: 'Ojiva', m: 'Fibra de vidrio', p: 'Laminado en molde', q: 1, ex: [0, 1.9, 0] },
        { id: 'avionics', n: 'Bahía de aviónica', m: 'Aluminio 6061-T6', p: 'Torneado CNC', q: 1, ex: [0, 1.4, 0] },
        { id: 'upper', n: 'Etapa superior', m: 'Fibra de carbono', p: 'Enrollado de filamento', q: 1, ex: [0, 0.95, 0] },
        { id: 'coupler', n: 'Acople entre etapas', m: 'Aluminio 6061-T6', p: 'Torneado CNC', q: 1, ex: [0, 0.5, 0] },
        { id: 'lower', n: 'Etapa inferior y tubo de motor', m: 'Fibra de carbono', p: 'Enrollado de filamento', q: 1, ex: [0, 0, 0] },
        { id: 'fins', n: 'Aleta', m: 'G10 / FR-4', p: 'Router CNC', q: 4, ex: [0, -0.2, 0] },
        { id: 'nozzle', n: 'Tobera', m: 'Grafito', p: 'Maquinado', q: 1, ex: [0, -0.75, 0] },
        { id: 'mount', n: 'Soporte de lanzamiento', m: 'Acero A36', p: 'Soldadura', q: 1, ex: [0, -1.05, 0] },
        { id: 'pad', n: 'Plataforma con línea de servicio', m: 'Acero A36', p: 'Corte láser y soldadura', q: 1, ex: [0, -1.3, 0] },
        { id: 'tower', n: 'Torre de lanzamiento', m: 'Perfil de acero', p: 'Soldadura', q: 1, ex: [-1.3, -0.4, 0] },
        { id: 'arms', n: 'Brazo umbilical', m: 'Acero A36', p: 'Corte y doblez', q: 2, ex: [-0.75, 0, 0] },
      ],
      build(add) {
        const R = 0.32;
        const pad = new T.Group();
        pad.add(part(B(2.9, 0.14, 2.0), -0.65, 0.07, 0));
        pad.add(alongX(part(C(0.05, 0.05, 1.7, 10), -0.85, 0.24, 0.72)));
        pad.add(part(C(0.05, 0.05, 0.9, 10), -1.7, 0.6, 0.72));
        pad.add(part(B(0.5, 0.4, 0.4), -1.7, 0.34, 0.72));
        add('pad', pad);
        add('mount', part(C(0.42, 0.46, 0.28, 16), 0, 0.28, 0));
        add('nozzle', part(C(0.16, 0.25, 0.32, 14), 0, 0.58, 0));
        const lower = new T.Group();
        lower.add(part(C(R, R, 2.0, 16), 0, 1.75, 0));
        [1.15, 1.55, 1.95, 2.35].forEach(y => lower.add(ring(R + 0.003, y)));
        add('lower', lower);
        add('coupler', part(C(R + 0.02, R + 0.02, 0.12, 16), 0, 2.81, 0));
        const upper = new T.Group();
        upper.add(part(C(R, R, 1.0, 16), 0, 3.37, 0));
        [3.15, 3.6].forEach(y => upper.add(ring(R + 0.003, y)));
        add('upper', upper);
        const av = new T.Group();
        av.add(part(C(R, R, 0.3, 16), 0, 4.02, 0));
        av.add(part(B(0.14, 0.18, 0.02), 0, 4.02, R + 0.005));
        add('avionics', av);
        add('nose', part(new T.ConeGeometry(R, 1.05, 16), 0, 4.695, 0));
        const fin = new T.Shape();
        fin.moveTo(0, 0); fin.lineTo(0.5, -0.14); fin.lineTo(0.5, 0.22); fin.lineTo(0, 0.72); fin.closePath();
        const fg = new T.ExtrudeGeometry(fin, { depth: 0.03, bevelEnabled: false });
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + Math.PI / 4;
          const p = new T.Group(); p.position.set(0, 0.84, 0); p.rotation.y = a;
          p.add(part(fg, R - 0.01, 0, -0.015));
          add('fins', p, [Math.cos(a) * 0.85, -0.25, -Math.sin(a) * 0.85]);
        }
        const tower = new T.Group(), tx = -1.3, H = 5.0;
        [[-0.3, -0.3], [-0.3, 0.3], [0.3, -0.3], [0.3, 0.3]].forEach(([dx, dz]) => tower.add(part(B(0.06, H, 0.06), tx + dx, 0.14 + H / 2, dz)));
        for (let y = 0.6; y < H; y += 0.55) {
          tower.add(part(B(0.6, 0.035, 0.035), tx, y, -0.3)); tower.add(part(B(0.6, 0.035, 0.035), tx, y, 0.3));
          tower.add(part(B(0.035, 0.035, 0.6), tx - 0.3, y, 0)); tower.add(part(B(0.035, 0.035, 0.6), tx + 0.3, y, 0));
        }
        for (let y = 0.6; y + 0.55 < H; y += 1.1) tower.add(beam([tx - 0.3, y], [tx + 0.3, y + 0.55], 0.03, 0.3));
        add('tower', tower);
        [3.3, 1.95].forEach(y => add('arms', part(B(0.68, 0.06, 0.06), -0.66, y, 0)));
      },
    },
    soccer: {
      code: 'D-05', name: 'Robot de fútbol BRL', unit: 120, scale: '1:2', grid: 0.2, crumbs: 'Robótica de competencia · Baja Robotics League',
      note: 'Chasis para la categoría de robofútbol, controlado con la app BRL Control Pro.',
      parts: [
        { id: 'top', n: 'Placa superior', m: 'Acrílico 3 mm', p: 'Corte láser', q: 1, ex: [0, 0.9, 0] },
        { id: 'esp', n: 'Tarjeta ESP32', m: 'FR-4', p: 'Comercial', q: 1, ex: [0, 1.35, 0] },
        { id: 'standoff', n: 'Separador M3', m: 'Latón', p: 'Comercial', q: 4, ex: [0, 0.45, 0] },
        { id: 'base', n: 'Placa base', m: 'Acrílico 5 mm', p: 'Corte láser', q: 1, ex: [0, -0.35, 0] },
        { id: 'motor', n: 'Motorreductor', m: 'Ensamble comercial', p: 'Comercial', q: 2, ex: [0.55, -0.15, 0] },
        { id: 'wheel', n: 'Rueda', m: 'TPU', p: 'Impresión 3D', q: 2, ex: [1.0, -0.1, 0] },
        { id: 'battery', n: 'Batería LiPo 2S', m: 'Ensamble comercial', p: 'Comercial', q: 1, ex: [0, -0.25, -0.8] },
        { id: 'solenoid', n: 'Solenoide de pateo', m: 'Ensamble comercial', p: 'Comercial', q: 1, ex: [0, 0.15, 0.55] },
        { id: 'kicker', n: 'Pateador', m: 'PLA', p: 'Impresión 3D', q: 1, ex: [0, 0.1, 1.0] },
        { id: 'caster', n: 'Rueda loca', m: 'Acero', p: 'Comercial', q: 1, ex: [0, -0.6, -0.4] },
        { id: 'ball', n: 'Balón (referencia)', m: '—', p: '—', q: 1, ex: [0, 0, 1.5] },
      ],
      build(add) {
        add('base', part(C(0.75, 0.75, 0.07, 28), 0, 0.2, 0, MAT.fill, MAT.line, 30));
        add('top', part(C(0.75, 0.75, 0.06, 28), 0, 0.8, 0, MAT.fill, MAT.line, 30));
        [[0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]].forEach(([x, z]) => add('standoff', part(C(0.03, 0.03, 0.54, 8), x, 0.5, z)));
        [-1, 1].forEach(s => {
          add('wheel', alongX(part(C(0.27, 0.27, 0.1, 16), s * 0.84, 0.27, 0)), [s * 1.0, -0.1, 0]);
          add('motor', alongX(part(C(0.08, 0.08, 0.34, 12), s * 0.5, 0.33, 0)), [s * 0.55, -0.15, 0]);
        });
        add('battery', part(B(0.52, 0.12, 0.28), 0, 0.3, -0.4));
        const esp = new T.Group();
        esp.add(part(B(0.42, 0.03, 0.24), 0, 0.845, -0.05));
        esp.add(part(B(0.13, 0.05, 0.1), 0.1, 0.885, -0.05));
        add('esp', esp);
        add('solenoid', alongZ(part(C(0.06, 0.06, 0.36, 12), 0, 0.34, 0.45)));
        add('kicker', part(B(0.56, 0.14, 0.06), 0, 0.32, 0.8));
        add('caster', part(new T.SphereGeometry(0.06, 8, 6), 0, 0.06, -0.6));
        add('ball', part(new T.SphereGeometry(0.21, 10, 7), 0, 0.21, 1.32, MAT.fillWhite, MAT.lineBlue, 20));
      },
    },
    herds: {
      code: 'D-06', name: 'Módulo de celdas HER-DS1', unit: 250, scale: '1:5', grid: 0.2, crumbs: 'Agua · Patente en trámite',
      note: 'Modelo conceptual con geometría ilustrativa. El diseño detallado está protegido en la solicitud de patente MX/A/2025/012269.',
      parts: [
        { id: 'end', n: 'Placa extrema', m: 'Polímero de ingeniería', p: 'Conceptual', q: 2, ex: [1.1, 0, 0] },
        { id: 'rod', n: 'Tirante con tuercas', m: 'Acero inoxidable', p: 'Conceptual', q: 4, ex: [0, 0.6, 0] },
        { id: 'electrode', n: 'Electrodo', m: 'Conductor (según patente)', p: 'Conceptual', q: 2, ex: [0.85, 0, 0] },
        { id: 'bus', n: 'Terminal eléctrica', m: 'Cobre', p: 'Conceptual', q: 2, ex: [0.85, 0.5, 0] },
        { id: 'gasket', n: 'Junta de sellado', m: 'Elastómero', p: 'Conceptual', q: 4, ex: [0.5, 0, 0] },
        { id: 'chamber', n: 'Cámara de hidrogel electro-responsivo', m: 'Hidrogel en marco polimérico', p: 'Conceptual', q: 3, ex: [0.5, 0, 0] },
        { id: 'port', n: 'Puerto de entrada o salida', m: 'Polímero', p: 'Conceptual', q: 4, ex: [1.5, 0, 0] },
      ],
      build(add) {
        const Y = 0.85, S = 1.1;
        [-1, 1].forEach(s => {
          const end = new T.Group();
          end.add(part(B(0.2, 1.5, 1.5), s * 1.0, Y, 0));
          end.add(part(B(0.3, 0.1, 1.5), s * 1.0, 0.05, 0));
          add('end', end, [s * 1.15, 0, 0]);
          add('electrode', part(B(0.03, S, S), s * 0.8, Y, 0), [s * 0.85, 0, 0]);
          add('bus', part(B(0.03, 0.28, 0.16), s * 0.8, Y + S / 2 + 0.12, 0.35), [s * 0.85, 0.5, 0]);
          add('port', alongX(part(C(0.06, 0.06, 0.2, 12), s * 1.2, Y + 0.4, -0.3)), [s * 1.55, 0.15, 0]);
          add('port', alongX(part(C(0.06, 0.06, 0.2, 12), s * 1.2, Y - 0.4, 0.3)), [s * 1.55, -0.15, 0]);
          [0.21, 0.68].forEach(x => add('gasket', part(B(0.02, S, S), s * x, Y, 0), [s * x * 1.25, 0, 0]));
        });
        [-0.42, 0, 0.42].forEach(x => {
          const ch = new T.Group();
          [-1, 1].forEach(k => {
            ch.add(part(B(0.3, 0.12, S), x, Y + k * (S / 2 - 0.06), 0));
            ch.add(part(B(0.3, S - 0.24, 0.12), x, Y, k * (S / 2 - 0.06)));
          });
          ch.add(part(B(0.24, S - 0.24, S - 0.24), x, Y, 0, MAT.fillLight));
          add('chamber', ch, [x * 1.2, 0, 0]);
        });
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => {
          const rod = new T.Group(), y = Y + sy * 0.66, z = sz * 0.66;
          rod.add(alongX(part(C(0.035, 0.035, 2.7, 10), 0, y, z)));
          [-1, 1].forEach(sx => rod.add(alongX(part(C(0.07, 0.07, 0.06, 6), sx * 1.13, y, z))));
          add('rod', rod, [0, sy * 0.95, sz * 0.95]);
        }));
      },
    },
  };

  function assemble(def) {
    const model = new T.Group();
    const parts = new Map();
    def.parts.forEach((meta, index) => {
      const group = new T.Group(); group.userData.partId = meta.id; model.add(group);
      parts.set(meta.id, { meta, index, group, holders: [] });
    });
    const holder = (id, ex) => {
      const p = parts.get(id), h = new T.Group();
      h.userData.ex = new T.Vector3().fromArray(ex || p.meta.ex || [0, 0, 0]);
      p.group.add(h); p.holders.push(h);
      return h;
    };
    const add = (id, obj, ex) => { holder(id, ex).add(obj); return obj; };
    const attach = (id, obj, ex) => { const h = holder(id, ex); model.updateMatrixWorld(true); h.attach(obj); return obj; };
    def.build(add, attach, model);
    model.traverse(o => { if (o.material) o.userData.mat = o.material; });
    const order = [];
    parts.forEach(p => p.holders.forEach(h => order.push(h)));
    return { def, model, parts, order };
  }
  // Explosión escalonada: las piezas se separan una tras otra
  function setExplode(asm, e) {
    const n = asm.order.length;
    asm.order.forEach((h, k) => {
      const s = n > 1 ? k / (n - 1) : 0;
      h.position.copy(h.userData.ex).multiplyScalar(smooth(s * 0.35, s * 0.35 + 0.65, e));
    });
  }
  function measure(asm) {
    setExplode(asm, 1); asm.model.updateMatrixWorld(true);
    const b1 = new T.Box3().setFromObject(asm.model);
    setExplode(asm, 0); asm.model.updateMatrixWorld(true);
    const b0 = new T.Box3().setFromObject(asm.model);
    asm.parts.forEach(p => {
      // envolvente de una sola pieza: si hay varias iguales, mide solo la primera
      const per = p.meta.q > 1 && p.holders.length % p.meta.q === 0 ? p.holders.length / p.meta.q : p.holders.length;
      const box = new T.Box3();
      p.holders.slice(0, per).forEach(h => box.expandByObject(h));
      p.size = box.getSize(new T.Vector3());
    });
    const all = b0.clone().union(b1);
    const c = b0.getCenter(new T.Vector3());
    const radius = b => { let r = 0; [b.min.x, b.max.x].forEach(x => [b.min.z, b.max.z].forEach(z => { r = Math.max(r, Math.hypot(x - c.x, z - c.z)); })); return r; };
    const rh = radius(all), rh0 = radius(b0);
    return { b0, all, c, rh, rh0, size0: b0.getSize(new T.Vector3()) };
  }
  const envelope = (v, unit) => `${mm(v.x * unit)} × ${mm(v.z * unit)} × ${mm(v.y * unit)} mm`;
  const totalQty = def => def.parts.reduce((s, p) => s + p.q, 0);

  /* =====================================================================
     TARJETAS DE DISEÑO: vista previa que se explosiona con el scroll
     ===================================================================== */
  const previews = [];
  document.querySelectorAll('canvas.draw').forEach((canvas, idx) => {
    const def = DESIGNS[canvas.dataset.model];
    const renderer = def && makeRenderer(canvas);
    if (!renderer) return;
    const scene = new T.Scene();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, -80, 80);
    const asm = assemble(def), m = measure(asm);
    asm.model.position.set(-m.c.x, -m.b0.min.y, -m.c.z);
    const pivot = new T.Group(); pivot.add(asm.model); scene.add(pivot);
    const g = Math.ceil((m.rh + 0.1) / def.grid) * def.grid;
    pivot.add(gridRect(-g, g, -g, g, def.grid, 0));
    const yMin = m.all.min.y - m.b0.min.y, yMax = m.all.max.y - m.b0.min.y, el = 0.52;
    // encuadre entre el ensamble y la explosión completa, para que el modelo no se vea pequeño
    const H = m.size0.y + (yMax - yMin - m.size0.y) * 0.7, RH = m.rh0 + (m.rh - m.rh0) * 0.7;
    const fig = canvas.parentElement, card = canvas.closest('.sheet');
    const read = fig.querySelector('.fig-read b'), bar = fig.querySelector('.xbar');
    const fill = card && card.querySelector('[data-bom]');
    const fillBom = () => {
      if (!fill) return;
      fill.innerHTML = tr('{n} piezas · {k} números de parte', { n: `<b>${totalQty(def)}</b>`, k: `<b>${def.parts.length}</b>` }) + '<br>' +
        tr('Escala {s} · envolvente {e}', { s: `<b>${def.scale}</b>`, e: `<b>${envelope(m.size0, def.unit)}</b>` });
    };
    fillBom();
    document.addEventListener('langchange', fillBom);
    const v = { canvas, renderer, scene, cam, pivot, asm, card, read, bar, e: 0, target: 0, visible: false, base: 0.55 + idx * 0.5, lastPct: -1 };
    const center = new T.Vector3(0, (yMin + yMax) / 2, 0);
    v.size = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      const halfH = ((H * Math.cos(el) + 2 * RH * Math.sin(el)) / 2) * 1.02;
      fitOrtho(cam, r.width / r.height, RH * 1.02, halfH);
    };
    v.draw = (t) => {
      pivot.rotation.y = v.base + (reduce ? 0 : window.scrollY * 0.0012 + t * 0.05);
      setExplode(asm, v.e);
      aim(cam, center, Math.PI / 4, el);
      renderer.render(scene, cam);
      const pct = Math.round(v.e * 100);
      if (pct !== v.lastPct) {
        v.lastPct = pct;
        if (read) read.textContent = pct + ' %';
        if (bar) bar.style.setProperty('--x', v.e.toFixed(3));
      }
    };
    v.size(); v.draw(0);
    new ResizeObserver(() => { v.size(); v.draw(clock); }).observe(canvas);
    new IntersectionObserver(([en]) => { v.visible = en.isIntersecting; kick(); }, { rootMargin: '120px 0px' }).observe(canvas);
    repaint.push(() => v.draw(clock));
    previews.push(v);
  });

  // Progreso de cada tarjeta: llega → se explosiona → se vuelve a ensamblar antes de que la cubra la siguiente
  function cardProgress(card) {
    const vh = innerHeight, top = 90, span = Math.max(1, vh - top);
    const r = card.getBoundingClientRect();
    const a = clamp01(1 - (r.top - top) / span);
    const next = card.nextElementSibling;
    const b = next ? clamp01(1 - (next.getBoundingClientRect().top - top) / span) : clamp01(1 - (r.bottom - top) / span);
    return (a + b) / 2;
  }
  function targets() {
    previews.forEach(v => {
      if (reduce || !v.card) { v.target = 0; return; }
      const p = cardProgress(v.card);
      v.target = smooth(0.3, 0.5, p) * (1 - smooth(0.8, 0.97, p));
    });
  }
  addEventListener('scroll', () => { targets(); kick(); }, { passive: true });
  addEventListener('resize', targets);
  targets();

  let clock = 0, loop = 0, lastT = 0;
  function tick(now) {
    loop = 0;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now; clock += dt;
    let any = false;
    previews.forEach(v => {
      if (!v.visible) return;
      v.e += (v.target - v.e) * Math.min(1, dt * 5);
      v.draw(clock); any = true;
    });
    if (any && !document.hidden) loop = requestAnimationFrame(tick);
  }
  function kick() {
    if (reduce) { previews.forEach(v => v.visible && v.draw(0)); return; }
    if (!loop) { lastT = performance.now(); loop = requestAnimationFrame(tick); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  /* =====================================================================
     VISOR CAD: girar, acercar, explosionar, cotas y lista de materiales
     ===================================================================== */
  const dlg = document.getElementById('cad');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const $ = id => document.getElementById(id);
  let viewer = null;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cad]');
    if (!b) return;
    e.preventDefault();
    if (!viewer) viewer = makeViewer();
    if (!viewer) return;
    viewer.load(b.dataset.cad);
    if (!dlg.open) dlg.showModal();
    viewer.resize(); viewer.start();
  });
  $('cadClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { if (viewer) viewer.stop(); });

  function makeViewer() {
    const canvas = $('cadCanvas'), view = $('cadView');
    const renderer = makeRenderer(canvas);
    if (!renderer) return null;
    const scene = new T.Scene();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, -200, 200);
    const pivot = new T.Group(); scene.add(pivot);
    const dimsEl = $('cadDims'), bomEl = $('cadBom'), selEl = $('cadSel'), tbEl = $('cadTb');
    const range = $('cadRange'), out = $('cadOut'), bExp = $('cadExplode'), bSpin = $('cadSpin'), bDims = $('cadDimsBtn'), bFit = $('cadFit');
    const viewBtns = [...dlg.querySelectorAll('[data-view]')];
    const VIEWS = { iso: [Math.PI / 4, 0.52], front: [0, 0.0001], side: [Math.PI / 2, 0.0001], top: [0, 1.52] };
    const st = { az: Math.PI / 4, el: 0.52, tAz: null, tEl: null, zoom: 1, e: 0, tE: 0, spin: !reduce, dims: true, sel: null, hov: null,
      asm: null, m: null, R: 1, center: new T.Vector3(), running: false, raf: 0, last: 0, aspect: 1 };
    let dimGroup = null, labels = [];
    const ray = new T.Raycaster(), ndc = new T.Vector2();

    function setPressed(btn, on) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    function setSpin(on) { st.spin = on; setPressed(bSpin, on); }
    function setView(name) { viewBtns.forEach(b => setPressed(b, b.dataset.view === name)); }

    function buildDims(m) {
      const s = m.size0, x0 = -s.x / 2, x1 = s.x / 2, z0 = -s.z / 2, z1 = s.z / 2, y1 = s.y;
      const o = Math.max(s.x, s.y, s.z) * 0.07, t = o * 0.35, unit = st.asm.def.unit;
      const p = [], q = [];
      // ancho (X), al frente
      q.push(x0, 0, z1, x0, 0, z1 + o * 1.25, x1, 0, z1, x1, 0, z1 + o * 1.25);
      p.push(x0, 0, z1 + o, x1, 0, z1 + o, x0 - t, 0, z1 + o + t, x0 + t, 0, z1 + o - t, x1 - t, 0, z1 + o + t, x1 + t, 0, z1 + o - t);
      // fondo (Z), a la derecha
      q.push(x1, 0, z0, x1 + o * 1.25, 0, z0, x1, 0, z1, x1 + o * 1.25, 0, z1);
      p.push(x1 + o, 0, z0, x1 + o, 0, z1, x1 + o - t, 0, z0 - t, x1 + o + t, 0, z0 + t, x1 + o - t, 0, z1 - t, x1 + o + t, 0, z1 + t);
      // alto (Y), esquina frontal izquierda
      q.push(x0, 0, z1, x0 - o * 1.25, 0, z1 + o * 1.25, x0, y1, z1, x0 - o * 1.25, y1, z1 + o * 1.25);
      p.push(x0 - o, 0, z1 + o, x0 - o, y1, z1 + o, x0 - o - t, -t, z1 + o, x0 - o + t, t, z1 + o, x0 - o - t, y1 - t, z1 + o, x0 - o + t, y1 + t, z1 + o);
      const g = new T.Group();
      g.add(lines(p, MAT.line)); g.add(lines(q, MAT.mid));
      dimsEl.textContent = '';
      labels = [
        [new T.Vector3(0, 0, z1 + o), s.x], [new T.Vector3(x1 + o, 0, 0), s.z], [new T.Vector3(x0 - o, y1 / 2, z1 + o), s.y],
      ].map(([pos, val]) => {
        const el = document.createElement('span'); el.className = 'dim'; el.textContent = mm(val * unit) + ' mm';
        dimsEl.appendChild(el);
        return { pos, el };
      });
      return g;
    }

    function load(key) {
      const def = DESIGNS[key];
      while (pivot.children.length) pivot.remove(pivot.children[0]);
      const asm = assemble(def), m = measure(asm);
      asm.model.position.set(-m.c.x, -m.b0.min.y, -m.c.z);
      pivot.add(asm.model);
      st.asm = asm; st.m = m; st.sel = null; st.hov = null;
      const g = Math.ceil((m.rh + 0.4) / def.grid) * def.grid;
      pivot.add(gridRect(-g, g, -g, g, def.grid, 0));
      dimGroup = buildDims(m); pivot.add(dimGroup);
      dimGroup.visible = st.dims; dimsEl.hidden = !st.dims;
      const yMin = m.all.min.y - m.b0.min.y, yMax = m.all.max.y - m.b0.min.y;
      st.center.set(0, (yMin + yMax) / 2, 0);
      st.R = Math.hypot(m.rh, (yMax - yMin) / 2);
      st.e = st.tE = 0; range.value = 0; out.textContent = '0 %'; setPressed(bExp, false);
      st.zoom = 1; [st.az, st.el] = VIEWS.iso; st.tAz = st.tEl = null; setView('iso'); setSpin(!reduce);
      relabel();
      paint();
    }
    // Textos del visor en el idioma activo
    function relabel() {
      if (!st.asm) return;
      const def = st.asm.def;
      bExp.textContent = tr(st.tE > 0.5 ? 'Ensamblar' : 'Explosionar');
      $('cadTitle').textContent = tr(def.name);
      $('cadCrumbs').innerHTML = `${tr('Visor CAD')} <span>&gt;</span> ${def.code} <span>&gt;</span> <b>${tr(def.crumbs)}</b>`;
      bomEl.innerHTML = def.parts.map((p, i) => `<tr data-id="${p.id}" aria-selected="false"><td>${pad(i + 1)}</td><td>${tr(p.n)}</td><td>${tr(p.m)}</td><td>${p.q}</td></tr>`).join('');
      tbEl.innerHTML = [['Proyecto', tr(def.name)], ['Lámina', def.code], ['Escala', def.scale], ['Unidades', 'mm'], ['Piezas', totalQty(def)], ['Autor', 'D. Martínez · 2026']]
        .map(([k, v]) => `<div><small>${tr(k)}</small><b>${v}</b></div>`).join('');
      info();
    }
    document.addEventListener('langchange', relabel);

    function info() {
      const def = st.asm.def;
      if (!st.sel) {
        selEl.innerHTML = `<p class="label">${tr('Ensamble completo')}</p><h3>${tr(def.name)}</h3>
          <dl><dt>${tr('Piezas')}</dt><dd>${tr('{a} en {b} números de parte', { a: totalQty(def), b: def.parts.length })}</dd><dt>${tr('Envolvente')}</dt><dd>${envelope(st.m.size0, def.unit)}</dd><dt>${tr('Escala')}</dt><dd>${def.scale}</dd></dl>
          <p>${tr(def.note)}</p>`;
      } else {
        const p = st.asm.parts.get(st.sel), meta = p.meta;
        selEl.innerHTML = `<p class="label">${tr('Pieza {a} de {b}', { a: pad(p.index + 1), b: def.parts.length })}</p><h3>${tr(meta.n)}</h3>
          <dl><dt>${tr('Material')}</dt><dd>${tr(meta.m)}</dd><dt>${tr('Proceso')}</dt><dd>${tr(meta.p)}</dd><dt>${tr('Cantidad')}</dt><dd>${meta.q}</dd><dt>${tr('Envolvente')}</dt><dd>${envelope(p.size, def.unit)}${meta.q > 1 ? ' ' + tr('c/u') : ''}</dd></dl>`;
      }
      bomEl.querySelectorAll('tr').forEach(tr => tr.setAttribute('aria-selected', tr.dataset.id === st.sel ? 'true' : 'false'));
    }
    function paint() {
      const act = st.hov || st.sel;
      st.asm.parts.forEach((p, id) => {
        const on = id === st.sel || id === st.hov, dim = act && !on;
        p.group.traverse(o => {
          if (o.isMesh) o.material = on ? MAT.fillWhite : o.userData.mat;
          else if (o.isLine) o.material = on ? MAT.lineBlue : dim ? MAT.dim : o.userData.mat;
        });
      });
    }
    function select(id) {
      st.sel = id && id !== st.sel ? id : null;
      paint(); info();
      const row = st.sel && bomEl.querySelector(`tr[data-id="${st.sel}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    }
    function pick(x, y) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(st.asm.model, true).find(h => h.object.isMesh);
      let o = hit && hit.object;
      while (o && !o.userData.partId) o = o.parent;
      return o ? o.userData.partId : null;
    }

    // Interacción
    bomEl.addEventListener('click', e => { const tr = e.target.closest('tr'); if (tr) select(tr.dataset.id); });
    bomEl.addEventListener('pointerover', e => { const tr = e.target.closest('tr'); if (tr && st.hov !== tr.dataset.id) { st.hov = tr.dataset.id; paint(); } });
    bomEl.addEventListener('pointerleave', () => { st.hov = null; paint(); });
    viewBtns.forEach(b => b.addEventListener('click', () => { [st.tAz, st.tEl] = VIEWS[b.dataset.view]; setView(b.dataset.view); setSpin(false); }));
    bExp.addEventListener('click', () => {
      st.tE = st.tE > 0.5 ? 0 : 1;
      setPressed(bExp, st.tE === 1); bExp.textContent = tr(st.tE === 1 ? 'Ensamblar' : 'Explosionar');
    });
    range.addEventListener('input', () => { st.tE = range.value / 100; setPressed(bExp, st.tE > 0.5); bExp.textContent = tr(st.tE > 0.5 ? 'Ensamblar' : 'Explosionar'); });
    bSpin.addEventListener('click', () => setSpin(!st.spin));
    bDims.addEventListener('click', () => { st.dims = !st.dims; setPressed(bDims, st.dims); dimGroup.visible = st.dims; dimsEl.hidden = !st.dims; });
    bFit.addEventListener('click', () => { st.zoom = 1; [st.tAz, st.tEl] = VIEWS.iso; setView('iso'); });

    const pointers = new Map();
    let drag = null, pinch = null, hoverQ = null;
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0 };
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: st.zoom }; drag = null; }
    });
    canvas.addEventListener('pointermove', e => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; st.zoom = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 0.5, 5); return; }
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.moved > 4) {
          canvas.classList.add('drag');
          st.az -= dx * 0.008; st.el = clamp(st.el + dy * 0.006, -0.25, 1.52);
          st.tAz = st.tEl = null; setSpin(false); setView(null);
        }
        return;
      }
      if (e.pointerType === 'mouse') hoverQ = [e.clientX, e.clientY];
    });
    const end = e => {
      if (drag && drag.moved <= 4 && e.type === 'pointerup') select(pick(e.clientX, e.clientY));
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { drag = null; canvas.classList.remove('drag'); }
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', () => { hoverQ = null; if (st.hov && !pointers.size) { st.hov = null; paint(); canvas.style.cursor = ''; } });
    canvas.addEventListener('wheel', e => { e.preventDefault(); st.zoom = clamp(st.zoom * Math.exp(-e.deltaY * 0.0012), 0.5, 5); }, { passive: false });

    function resize() {
      const r = view.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      st.aspect = r.width / r.height; st.w = r.width; st.h = r.height;
    }
    new ResizeObserver(resize).observe(view);
    const tmp = new T.Vector3();
    function render() {
      cam.zoom = st.zoom;
      fitOrtho(cam, st.aspect, st.R * 1.08, st.R * 1.08);
      aim(cam, st.center, st.az, st.el, 80);
      renderer.render(scene, cam);
      if (st.dims) labels.forEach(l => {
        tmp.copy(l.pos).applyMatrix4(pivot.matrixWorld).project(cam);
        l.el.style.transform = `translate(${((tmp.x + 1) / 2) * st.w}px, ${((1 - tmp.y) / 2) * st.h}px) translate(-50%, -50%)`;
      });
    }
    function frame(now) {
      st.raf = 0;
      const dt = Math.min((now - st.last) / 1000, 0.05); st.last = now;
      if (st.tAz !== null) {
        const d = Math.atan2(Math.sin(st.tAz - st.az), Math.cos(st.tAz - st.az));
        const k = reduce ? 1 : Math.min(1, dt * 7);
        st.az += d * k; st.el += (st.tEl - st.el) * k;
        if (Math.abs(d) < 1e-3 && Math.abs(st.tEl - st.el) < 1e-3) st.tAz = st.tEl = null;
      } else if (st.spin) st.az += dt * 0.3;
      st.e += (st.tE - st.e) * (reduce ? 1 : Math.min(1, dt * 5));
      setExplode(st.asm, st.e);
      const pct = Math.round(st.e * 100) + ' %';
      if (out.textContent !== pct) out.textContent = pct;
      if (document.activeElement !== range) range.value = Math.round(st.e * 100);
      if (hoverQ) {
        const id = pick(hoverQ[0], hoverQ[1]); hoverQ = null;
        canvas.style.cursor = id ? 'pointer' : '';
        if (id !== st.hov) { st.hov = id; paint(); }
      }
      render();
      if (st.running) st.raf = requestAnimationFrame(frame);
    }
    function start() { if (st.running) return; st.running = true; st.last = performance.now(); st.raf = requestAnimationFrame(frame); }
    function stop() { st.running = false; if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0; }
    repaint.push(() => { if (dlg.open) paint(); });
    return { load, resize, start, stop };
  }
})();
