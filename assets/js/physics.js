// AI Physics: péndulo invertido sobre ruedas que aprende a equilibrarse con el método de entropía cruzada (CEM).
(function physics() {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const ui = { gen: $('simGen'), rew: $('simRew'), sig: $('simSig'), k: $('simK'), status: $('simStatus'), push: $('simPush'), reset: $('simReset'), pause: $('simPause') };

  // ---------- física ----------
  const G = 9.81, MC = 1.0, MP = 0.3, L = 0.6, M = MC + MP, FMAX = 15, DT = 0.02, STEPS = 600, XMAX = 2.0, TMAX = 0.8;
  function physStep(s, F) {
    for (let k = 0; k < 2; k++) {
      const h = DT / 2, [x, xd, th, thd] = s;
      const sin = Math.sin(th), cos = Math.cos(th);
      const temp = (F + MP * L * thd * thd * sin) / M;
      const thacc = (G * sin - cos * temp) / (L * (4 / 3 - (MP * cos * cos) / M));
      const xacc = temp - (MP * L * thacc * cos) / M;
      s[1] = xd + h * xacc; s[0] = x + h * s[1];
      s[3] = thd + h * thacc; s[2] = th + h * s[3];
    }
  }
  const act = (w, s) => Math.max(-FMAX, Math.min(FMAX, w[0] * s[0] + w[1] * s[1] + w[2] * s[2] + w[3] * s[3]));
  const failed = s => Math.abs(s[2]) > TMAX || Math.abs(s[0]) > XMAX;

  // Generador pseudoaleatorio con semilla para evaluar a todos con las mismas condiciones
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const randn = r => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

  function rollout(w, seed) {
    const r = rng(seed);
    const s = [(r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.3, (r() - 0.5) * 0.4];
    let R = 0;
    for (let t = 0; t < STEPS; t++) {
      if (t === 300) s[3] += r() < 0.5 ? -0.8 : 0.8; // empujón a la mitad del episodio
      physStep(s, act(w, s));
      if (failed(s)) break;
      R += 1 - 0.05 * Math.min(s[0] * s[0], 4);
    }
    return R / STEPS;
  }

  // ---------- aprendizaje (CEM) ----------
  const POP = 32, ELITE = 6, SIG0 = [5, 5, 25, 5];
  let mu, sigma, gen, history, stable, lastScore, master;
  function resetLearning() { mu = [0, 0, 0, 0]; sigma = SIG0.slice(); gen = 0; history = []; stable = false; lastScore = 0; master = rng(1234); }
  function generation() {
    const pop = [];
    for (let i = 0; i < POP; i++) {
      const w = mu.map((m, j) => m + sigma[j] * randn(master));
      const score = (rollout(w, gen * 31 + 1) + rollout(w, gen * 31 + 2)) / 2;
      pop.push({ w, score });
    }
    pop.sort((a, b) => b.score - a.score);
    const el = pop.slice(0, ELITE);
    mu = mu.map((_, j) => el.reduce((s, p) => s + p.w[j], 0) / ELITE);
    sigma = sigma.map((_, j) => {
      const v = el.reduce((s, p) => s + (p.w[j] - mu[j]) ** 2, 0) / ELITE;
      return Math.sqrt(v) + SIG0[j] * 0.02 * Math.max(0, 1 - gen / 20);
    });
    gen++;
    lastScore = el.reduce((s, p) => s + p.score, 0) / ELITE;
    history.push(lastScore);
    if (history.length > 40) history.shift();
    const n = history.length;
    if (n >= 4 && history[n - 1] > 0.97 && history[n - 2] > 0.97 && history[n - 3] > 0.97) stable = true;
    if (gen >= 40) stable = true;
  }

  // ---------- robot que se muestra ----------
  const disp = { s: [0, 0, 0.12, 0], F: 0, fallT: 0, pushT: 0, trail: [] };
  function resetRobot() {
    disp.s = [(Math.random() - 0.5) * 0.4, 0, (Math.random() < 0.5 ? -1 : 1) * (0.06 + Math.random() * 0.08), 0];
    disp.fallT = 0;
  }
  function push() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    disp.s[3] += dir * 1.3; disp.s[1] += dir * 0.4; disp.pushT = 0.6; disp.pushDir = dir;
    if (paused) draw();
  }

  // ---------- dibujo ----------
  let W = 0, H = 0;
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const WHITE = '#ffffff', SOFT = 'rgba(255,255,255,.55)', FAINT = 'rgba(255,255,255,.22)';
  function blue() { return getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#1f56b4'; }
  function text(t, x, y, align = 'left', color = SOFT) { ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(t, x, y); }
  function draw() {
    if (!W) return;
    const fill = blue();
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ppm = Math.min(W * 0.17, H * 0.32), gy = H * 0.74, cx = W * 0.5;
    const X = v => cx + v * ppm;

    // Pista con escala en metros
    ctx.strokeStyle = WHITE; ctx.beginPath(); ctx.moveTo(X(-2.3), gy); ctx.lineTo(X(2.3), gy); ctx.stroke();
    ctx.strokeStyle = SOFT;
    for (let m = -2; m <= 2.001; m += 0.5) {
      const big = Math.abs(m % 1) < 1e-6;
      ctx.beginPath(); ctx.moveTo(X(m), gy); ctx.lineTo(X(m), gy + (big ? 8 : 4)); ctx.stroke();
      if (big) text((m === 0 ? '0' : (m > 0 ? '' : '−') + Math.abs(m) + ' m'), X(m), gy + 20, 'center');
    }
    ctx.strokeStyle = FAINT; [-XMAX, XMAX].forEach(m => { ctx.beginPath(); ctx.moveTo(X(m), gy - 6); ctx.lineTo(X(m), gy - ppm * 1.6); ctx.stroke(); });

    // Robot
    const [x, , th] = disp.s, wr = 0.14 * ppm, ax = X(x), ay = gy - wr, len = 2 * L * ppm, bw = 0.2 * ppm;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(th);
    ctx.fillStyle = fill; ctx.strokeStyle = WHITE;
    ctx.beginPath(); ctx.rect(-bw / 2, -len, bw, len); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-bw / 2, -len * 0.35); ctx.lineTo(bw / 2, -len * 0.35); ctx.moveTo(-bw / 2, -len * 0.7); ctx.lineTo(bw / 2, -len * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.rect(-bw * 0.7, -len - bw * 0.45, bw * 1.4, bw * 0.45); ctx.fill(); ctx.stroke();
    // centro de masa (símbolo de plano)
    const cy = -len * 0.5, cr = bw * 0.28;
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, cy, cr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(0, cy); ctx.arc(0, cy, cr, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.arc(0, cy, cr, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
    ctx.restore();
    // vertical de referencia y ángulo
    ctx.strokeStyle = FAINT; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - len * 1.05); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = SOFT; ctx.beginPath(); ctx.arc(ax, ay, len * 0.32, -Math.PI / 2, -Math.PI / 2 + th, th < 0); ctx.stroke();
    text('θ ' + (th * 180 / Math.PI).toFixed(1) + '°', ax + (th >= 0 ? 10 : -10), ay - len * 0.36, th >= 0 ? 'left' : 'right', WHITE);
    // rueda
    ctx.fillStyle = fill; ctx.strokeStyle = WHITE;
    ctx.beginPath(); ctx.arc(ax, ay, wr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const rot = x / 0.14;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(rot) * wr, ay + Math.sin(rot) * wr); ctx.stroke();
    ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, Math.PI * 2); ctx.fillStyle = WHITE; ctx.fill();
    // fuerza de control
    if (Math.abs(disp.F) > 0.2) {
      const L2 = (disp.F / FMAX) * ppm * 0.7, y = ay + wr + 8 - wr * 2 - 14;
      ctx.strokeStyle = WHITE; ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax + L2, y);
      const d = Math.sign(L2); ctx.moveTo(ax + L2, y); ctx.lineTo(ax + L2 - d * 6, y - 4); ctx.moveTo(ax + L2, y); ctx.lineTo(ax + L2 - d * 6, y + 4); ctx.stroke();
    }
    if (disp.pushT > 0) text('Empuje ' + (disp.pushDir > 0 ? '→' : '←'), ax, ay - len - bw - 10, 'center', WHITE);
    if (disp.fallT > 0) text('Caída · reinicio', ax, ay - len - bw - 10, 'center', WHITE);

    // Traza del ángulo (últimos 6 s)
    const pw = Math.min(W * 0.32, 220), ph = H * 0.2, px = 12, py = 30;
    ctx.strokeStyle = FAINT; ctx.strokeRect(px, py, pw, ph);
    ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
    text('θ(t) · últimos 6 s', px, py - 8);
    ctx.strokeStyle = WHITE; ctx.beginPath();
    disp.trail.forEach((v, i) => {
      const xx = px + (i / 299) * pw, yy = py + ph / 2 - Math.max(-1, Math.min(1, v / TMAX)) * (ph / 2);
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    });
    ctx.stroke();

    // Curva de aprendizaje
    const lw = Math.min(W * 0.32, 220), lx = W - lw - 12;
    ctx.strokeStyle = FAINT; ctx.strokeRect(lx, py, lw, ph);
    text('Recompensa por generación', lx + lw, py - 8, 'right');
    if (history.length) {
      const n = history.length, bwid = lw / 40;
      ctx.fillStyle = WHITE;
      history.forEach((v, i) => { const hgt = Math.max(1, v * (ph - 4)); ctx.fillRect(lx + i * bwid + 1, py + ph - hgt, Math.max(1, bwid - 2), hgt); });
      text((history[n - 1] * 100).toFixed(0) + ' %', lx + lw - 4, py + 12, 'right', WHITE);
    }
  }

  // ---------- bucle ----------
  let running = false, raf = 0, last = 0, acc = 0, genT = 0, uiT = 0, paused = reduce, visible = false;
  function updateUI() {
    ui.gen.textContent = String(gen).padStart(2, '0');
    ui.rew.textContent = (lastScore * 100).toFixed(0) + ' %';
    ui.sig.textContent = (sigma.reduce((a, b) => a + b, 0) / 4).toFixed(2);
    ui.k.textContent = '[' + mu.map(v => v.toFixed(1)).join(', ') + ']';
    ui.status.textContent = paused ? 'En pausa' : stable ? 'Política estable · empújalo' : gen === 0 ? 'Sin entrenar' : 'Aprendiendo';
  }
  function simulate(dt) {
    if (!stable) { genT += dt; if (genT >= 0.8) { genT = 0; generation(); } }
    acc += dt;
    while (acc >= DT) {
      acc -= DT;
      if (disp.fallT > 0) { disp.fallT -= DT; if (disp.fallT <= 0) resetRobot(); continue; }
      disp.F = act(mu, disp.s);
      physStep(disp.s, disp.F);
      disp.trail.push(disp.s[2]); if (disp.trail.length > 300) disp.trail.shift();
      if (failed(disp.s)) { disp.fallT = 0.7; disp.s[2] = Math.max(-TMAX, Math.min(TMAX, disp.s[2])); }
    }
    if (disp.pushT > 0) disp.pushT -= dt;
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    simulate(dt); draw();
    uiT -= dt; if (uiT <= 0) { updateUI(); uiT = 0.15; }
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || paused || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  resetLearning(); resetRobot();
  if (reduce) { while (!stable) generation(); resetRobot(); disp.s[2] = 0.02; }
  size(); draw(); updateUI();
  ui.pause.textContent = paused ? 'Reanudar' : 'Pausar';
  ui.pause.setAttribute('aria-pressed', paused ? 'true' : 'false');

  ui.push.addEventListener('click', () => { push(); if (paused) { paused = false; syncPause(); } });
  ui.reset.addEventListener('click', () => { resetLearning(); resetRobot(); disp.trail = []; draw(); updateUI(); if (paused) { paused = false; syncPause(); } });
  ui.pause.addEventListener('click', () => { paused = !paused; syncPause(); });
  function syncPause() {
    ui.pause.textContent = paused ? 'Reanudar' : 'Pausar';
    ui.pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
    updateUI();
    paused ? stop() : start();
  }
  new ResizeObserver(() => { size(); draw(); }).observe(canvas);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
})();
