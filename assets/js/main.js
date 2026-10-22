// Interfaz y motor de scroll: tema, índice, desplazamiento suave, cambio de hoja entre secciones, láminas apiladas y animaciones ligadas al scroll.
(function ui() {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const easeOut = s => 1 - Math.pow(1 - s, 3);

  // ---------- tema ----------
  try { const saved = localStorage.getItem('dm-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem('dm-theme', next); } catch (e) {} };
    if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
  });

  // ---------- copiar correo ----------
  const copyBtn = document.getElementById('copyMail');
  const mail = document.getElementById('mail');
  if (copyBtn && mail) copyBtn.addEventListener('click', () => {
    const label = copyBtn.querySelector('span');
    const done = (t) => { label.textContent = t; setTimeout(() => { label.textContent = 'Copiar'; }, 1800); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(mail); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Seleccionado'); };
    try { navigator.clipboard.writeText(mail.textContent.trim()).then(() => done('Copiado'), select); } catch (e) { select(); }
  });

  // ---------- desplazamiento suave (solo con mouse o trackpad) ----------
  let lenis = null;
  if (window.Lenis && !reduce && matchMedia('(pointer: fine)').matches) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const index = document.getElementById('index');
  function goTo(hash) {
    const el = hash === '#inicio' ? document.body : document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(hash === '#inicio' ? 0 : el, { offset: -64, duration: 1.4 });
    else (hash === '#inicio' ? window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2 || hash === '#main') return;
    e.preventDefault();
    if (index && index.matches(':popover-open')) index.hidePopover();
    goTo(hash);
  });
  // El visor CAD detiene el desplazamiento de la página
  const dlg = document.getElementById('cad');
  if (dlg && lenis) new MutationObserver(() => (dlg.open ? lenis.stop() : lenis.start())).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  if (index && lenis) index.addEventListener('toggle', e => (e.newState === 'open' ? lenis.stop() : lenis.start()));

  // ---------- elementos que reaccionan al scroll ----------
  const pages = [...document.querySelectorAll('[data-page]')];
  const menuLinks = [...document.querySelectorAll('.menu a, .index a')];
  const siN = document.getElementById('siN'), siT = document.getElementById('siT');
  const progress = document.querySelector('.progress');
  const stacks = [...document.querySelectorAll('[data-stack]')].map(s => [...s.children]);
  const stackMQ = matchMedia('(min-width: 1000px) and (min-height: 760px)');
  const anims = reduce ? [] : [...document.querySelectorAll('[data-anim]')];
  if (anims.length) root.classList.add('anim');

  // Desfase escalonado para tarjetas en la misma fila de una cuadrícula
  function measureOffsets() {
    anims.forEach(el => {
      const p = el.parentElement, cs = getComputedStyle(p);
      let off = 0;
      if (cs.display === 'grid' && cs.gridAutoFlow.indexOf('column') === -1) {
        const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
        const idx = [...p.children].filter(c => c.hasAttribute('data-anim')).indexOf(el);
        off = (idx % cols) * 70;
      }
      el._off = off;
    });
  }
  measureOffsets();

  let current = -1;
  function setSheet(i) {
    if (i === current) return;
    current = i;
    const sec = pages[i];
    if (siN && siT) {
      siN.textContent = sec.dataset.page; siT.textContent = sec.dataset.title;
      [siN, siT].forEach(el => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
    }
    menuLinks.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + sec.id ? 'true' : 'false'));
  }

  function update() {
    const h = innerHeight;
    // hoja actual
    let cur = 0;
    pages.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= h * 0.42) cur = i; });
    setSheet(cur);

    // cambio de hoja: la sección que se va se encoge y se desvanece; la que llega sube
    if (!reduce) pages.forEach(sec => {
      const r = sec.getBoundingClientRect();
      const out = easeOut(clamp01((h * 0.38 - r.bottom) / (h * 0.38)));
      const inn = easeOut(clamp01((h - r.top) / (h * 0.3)));
      if (out <= 0.001 && inn >= 0.999) { if (sec._t) { sec.style.transform = ''; sec.style.opacity = ''; sec._t = false; } return; }
      sec._t = true;
      sec.style.transform = `translate3d(0, ${((1 - inn) * 70 - out * 40).toFixed(1)}px, 0) scale(${(1 - out * 0.07).toFixed(4)})`;
      sec.style.opacity = (1 - out * 0.75).toFixed(3);
    });

    // aparición de títulos, tarjetas y dibujos
    anims.forEach(el => {
      const r = el.getBoundingClientRect();
      let e;
      if (r.top > h + 60) e = 0;
      else if (r.bottom < -60) e = 1;
      else e = easeOut(clamp01((h - r.top - (el._off || 0) * 0.6) / (h * 0.28)));
      if (Math.abs(e - (el._e ?? -1)) > 0.002) { el._e = e; el.style.setProperty('--e', e.toFixed(3)); }
    });

    // láminas apiladas
    stacks.forEach(sheets => sheets.forEach((s, i) => {
      let p = 0;
      const next = sheets[i + 1];
      if (stackMQ.matches && !reduce && next) {
        const r = s.getBoundingClientRect(), rn = next.getBoundingClientRect();
        p = clamp01((r.bottom - rn.top) / r.height);
      }
      s.style.setProperty('--cover', p.toFixed(3));
    }));

    const max = root.scrollHeight - h;
    if (progress) progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
  }
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measureOffsets(); request(); });
  update();

  // ---------- contadores ----------
  const fmt = n => n.toLocaleString('en-US');
  if (!reduce && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, pre = el.dataset.prefix || '';
      const t0 = performance.now(), dur = 1400;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = pre + fmt(Math.round(end * easeOut(k)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(c => co.observe(c));
  }

  // ---------- retícula con coordenadas en el hero ----------
  const stage = document.getElementById('stage');
  const xh = stage && stage.querySelector('.xh');
  if (xh) {
    const label = xh.querySelector('span');
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      xh.style.setProperty('--x', x + 'px');
      xh.style.setProperty('--y', y + 'px');
      label.textContent = 'X ' + Math.round((x / r.width) * 8000 - 4000) + ' · Y ' + Math.round((1 - y / r.height) * 4000) + ' mm';
    });
  }
})();
