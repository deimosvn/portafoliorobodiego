// Interfaz general: tema, menú, láminas apiladas, barra de progreso, contadores y retícula del hero.
(function ui() {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tema
  try { const saved = localStorage.getItem('dm-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem('dm-theme', next); } catch (e) {} };
    if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
  });

  // Copiar correo
  const copyBtn = document.getElementById('copyMail');
  const mail = document.getElementById('mail');
  if (copyBtn && mail) copyBtn.addEventListener('click', () => {
    const label = copyBtn.querySelector('span');
    const done = (t) => { label.textContent = t; setTimeout(() => { label.textContent = 'Copiar'; }, 1800); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(mail); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Seleccionado'); };
    try { navigator.clipboard.writeText(mail.textContent.trim()).then(() => done('Copiado'), select); } catch (e) { select(); }
  });

  // Enlace activo del menú
  const links = [...document.querySelectorAll('.menu a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = map.get(en.target.id); if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });

  // Láminas apiladas: la hoja de abajo se reduce cuando la siguiente la cubre
  const stacks = [...document.querySelectorAll('[data-stack]')].map(s => ({
    sheets: [...s.children],
    mq: matchMedia(s.classList.contains('tall') ? '(min-width: 1000px) and (min-height: 860px)' : '(min-width: 1000px) and (min-height: 760px)'),
  }));
  const progress = document.querySelector('.progress');
  let ticking = false;
  function onScroll() {
    ticking = false;
    stacks.forEach(({ sheets, mq }) => sheets.forEach((s, i) => {
      const on = mq.matches && !reduce;
      let p = 0;
      const next = sheets[i + 1];
      if (on && next) {
        const r = s.getBoundingClientRect(), rn = next.getBoundingClientRect();
        p = Math.max(0, Math.min(1, (r.bottom - rn.top) / r.height));
      }
      s.style.setProperty('--cover', p.toFixed(3));
    }));
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Contadores de métricas
  const fmt = n => n.toLocaleString('en-US');
  const counters = [...document.querySelectorAll('[data-count]')];
  if (!reduce && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, pre = el.dataset.prefix || '';
      const t0 = performance.now(), dur = 1300;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + fmt(Math.round(end * e));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  }

  // Retícula con coordenadas en el hero, como en un programa CAD
  const stage = document.getElementById('stage');
  const xh = stage && stage.querySelector('.xh');
  if (xh) {
    const label = xh.querySelector('span');
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      xh.style.setProperty('--x', x + 'px');
      xh.style.setProperty('--y', y + 'px');
      label.textContent = 'X ' + Math.round((x / r.width) * 6000 - 3000) + ' · Y ' + Math.round((1 - y / r.height) * 4000) + ' mm';
    });
  }
})();
