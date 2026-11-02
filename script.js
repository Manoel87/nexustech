/* ==========================================================
   NEXUSTECH — script.js
   Módulos: menu, scroll, animações, partículas, rosto de IA, formulário
   ========================================================== */
(() => {
  'use strict';

  // WhatsApp que recebe as mensagens (código do país + DDD + número, só dígitos)
  const WHATSAPP_NUMBER = '5581997967332';
  const WHATSAPP_MESSAGE = 'Olá! Vim pelo site da NEXUSTECH e gostaria de solicitar uma consultoria.';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const waUrl = (msg) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  /* ---------- Menu responsivo + cabeçalho ---------- */
  function initNav() {
    const header = document.getElementById('header');
    const btn = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu');

    const updateHeader = () =>
      header.classList.toggle('scrolled', window.scrollY > 24 || menu.classList.contains('open'));

    function setMenu(open) {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      updateHeader();
    }

    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); });
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    // Link ativo conforme a seção visível
    const links = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
    const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach((t) => spy.observe(t));
    }
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => {
      const group = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--delay', `${group.indexOf(el) * 0.1}s`);
      io.observe(el);
    });
  }

  /* ---------- Contadores dos indicadores ---------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (reduceMotion) return;
    els.forEach((el) => {
      const end = Number(el.dataset.count);
      const duration = 1600;
      let start = null;
      el.textContent = '0';
      const step = (ts) => {
        if (start === null) start = ts;
        const p = clamp((ts - start) / duration, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 900);
    });
  }

  /* ---------- Controle de visibilidade (economiza CPU) ---------- */
  function makeLoop(draw, target) {
    let raf = 0, visible = true, last = 0;
    const frame = (ts) => {
      const dt = last ? Math.min(ts - last, 50) : 16;
      last = ts;
      draw(ts, dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(target);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    return { start, stop };
  }

  /* ---------- Mouse compartilhado (parallax) ---------- */
  const mouse = { x: 0, y: 0, px: -9999, py: -9999 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.px = e.clientX; mouse.py = e.clientY;
  }, { passive: true });

  /* ---------- Partículas de fundo com linhas conectadas ---------- */
  function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, particles = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / 17000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.3 + 0.5,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const rect = canvas.getBoundingClientRect();
      const mx = mouse.px - rect.left, my = mouse.py - rect.top;

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${(1 - d / 130) * 0.22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mx, a.y - my);
        if (dm < 170) {
          ctx.strokeStyle = `rgba(0, 229, 255, ${(1 - dm / 170) * 0.4})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(120, 225, 255, .85)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    resize();
    new ResizeObserver(() => { resize(); if (reduceMotion) draw(); }).observe(canvas);
    if (reduceMotion) draw();
    else makeLoop(draw, canvas).start();
  }

  /* ---------- Rosto humano de IA (malha low-poly 3D no canvas) ---------- */
  function initHead() {
    const canvas = document.getElementById('head-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Coordenadas normalizadas (0–1). O rosto é simétrico em x = 0.5:
       definimos só o lado direito e espelhamos para o esquerdo.
       Proporções humanas: olhos na metade da cabeça, base do nariz a meio
       caminho entre olhos e queixo, boca a 1/3 entre nariz e queixo. */
    const mirror = (line) => line.map(([x, y]) => [1 - x, y]);
    const sides = (line) => [line, mirror(line)];

    /* Contorno: crânio, orelhas, mandíbula, pescoço e ombros */
    const RIGHT_HALF = [
      [0.50, 0.03], [0.58, 0.04], [0.65, 0.08], [0.71, 0.15], [0.745, 0.25], [0.75, 0.36],
      [0.775, 0.41], [0.80, 0.47], [0.795, 0.55], [0.755, 0.62], [0.70, 0.69], [0.655, 0.745],
      [0.612, 0.785], [0.59, 0.82], [0.59, 0.90], [0.64, 0.93], [0.80, 0.96], [0.91, 1.00],
    ];
    const OUTLINE = [...RIGHT_HALF, ...mirror(RIGHT_HALF.slice(1)).reverse()];
    const ASPECT = 0.857; // largura/altura do canvas lógico (corrige distâncias)

    /* Traços do rosto: destacados e usados como base da malha */
    const K = 0.8; // afinamento do rosto: quanto menor, mais fino
    const slim = (line) => line.map(([x, y]) => [0.5 + (x - 0.5) * K, y]);
    const FEATURES_RAW = [
      [[0.64, 0.785], [0.58, 0.805], [0.50, 0.812], [0.42, 0.805], [0.36, 0.785]],            // queixo
      ...sides([[0.50, 0.13], [0.60, 0.135], [0.69, 0.16], [0.76, 0.21], [0.80, 0.29]]),       // linha do cabelo
      ...sides([[0.535, 0.392], [0.575, 0.384], [0.63, 0.367], [0.685, 0.350], [0.725, 0.340]]), // sobrancelhas franzidas (baixas no centro)
      ...sides([[0.572, 0.427], [0.61, 0.412], [0.655, 0.402], [0.705, 0.396]]),               // pálpebra superior (reta e inclinada)
      ...sides([[0.572, 0.427], [0.62, 0.434], [0.67, 0.428], [0.705, 0.396]]),                // pálpebra inferior
      ...sides([[0.535, 0.395], [0.532, 0.48], [0.545, 0.55], [0.572, 0.575]]),                // ponte do nariz
      ...sides([[0.50, 0.617], [0.545, 0.612], [0.57, 0.60], [0.572, 0.575]]),                 // base do nariz
      ...sides([[0.575, 0.60], [0.59, 0.65], [0.585, 0.70]]),                                  // linhas de expressão (rígidas)
      [[0.42, 0.700], [0.46, 0.692], [0.50, 0.690], [0.54, 0.692], [0.58, 0.700]],             // boca reta, cantos levemente para baixo
      [[0.47, 0.722], [0.50, 0.725], [0.53, 0.722]],                                           // lábio inferior curto
      ...sides([[0.85, 0.45], [0.86, 0.50], [0.845, 0.55]]),                                   // orelhas
    ];
    const FEATURES = FEATURES_RAW.map(slim);
    const EYES = [[0.36, 0.413], [0.64, 0.413]].map(([x, y]) => [0.5 + (x - 0.5) * K, y]); // centro dos olhos
    const EYE_BAR_R = [[0.58, 0.425], [0.70, 0.400]].map(([x, y]) => [0.5 + (x - 0.5) * K, y]); // barra luminosa (canto interno -> externo)
    const EYE_BARS = [EYE_BAR_R, mirror(EYE_BAR_R)];

    /* Trilhas de circuito saindo do chip "AI" na testa */
    const TRACE_BASE = [
      [[0.56, 0.21], [0.64, 0.21], [0.64, 0.28], [0.73, 0.28], [0.73, 0.35]],
      [[0.54, 0.165], [0.54, 0.11], [0.63, 0.11], [0.68, 0.15]],
    ];
    const TRACE_SLIM = TRACE_BASE.map(slim);
    const TRACES = [...TRACE_SLIM, ...TRACE_SLIM.map(mirror)];
    const CHIP = { x: 0.50, y: 0.21 };

    // Gerador pseudoaleatório com semente (malha sempre igual)
    function rng(seed) {
      return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const rand = rng(20260);

    function inside(x, y) {
      let c = false;
      for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
        const [xi, yi] = OUTLINE[i], [xj, yj] = OUTLINE[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    }
    const dist = (a, b) => Math.hypot((a.x - b.x) * ASPECT, a.y - b.y);

    /* --- Construção da malha --- */
    const pts = [];
    OUTLINE.forEach((p, i) => {
      const q = OUTLINE[(i + 1) % OUTLINE.length];
      const len = Math.hypot((q[0] - p[0]) * ASPECT, q[1] - p[1]);
      const n = Math.max(1, Math.round(len / 0.06));
      for (let k = 0; k < n; k++) {
        pts.push({ x: p[0] + ((q[0] - p[0]) * k) / n, y: p[1] + ((q[1] - p[1]) * k) / n, ring: pts.length, edge: true });
      }
    });
    const ringCount = pts.length;
    const outlinePts = pts.slice();

    // Relevo do rosto: nariz, testa, maçãs, lábios, queixo e órbitas dos olhos
    const bump = (x, y, cx, cy, sx, sy, a) => a * Math.exp(-(((x - cx) ** 2) / sx + ((y - cy) ** 2) / sy));
    const zAt = (x, y) => {
      const d = Math.min(...outlinePts.map((o) => dist(o, { x, y })));
      let z = clamp(d / 0.2, 0, 1) * 0.26;
      z += bump(x, y, 0.5, 0.55, 0.004, 0.02, 0.15);                                   // nariz
      z += bump(x, y, 0.40, 0.375, 0.008, 0.0015, 0.045) + bump(x, y, 0.60, 0.375, 0.008, 0.0015, 0.045); // arcada das sobrancelhas
      z += bump(x, y, 0.5, 0.30, 0.03, 0.01, 0.04);                                    // testa
      z += bump(x, y, 0.5, 0.775, 0.01, 0.002, 0.05);                                  // queixo
      z += bump(x, y, 0.5, 0.69, 0.008, 0.0015, 0.03);                                 // lábios
      z += bump(x, y, 0.36, 0.53, 0.004, 0.008, 0.045) + bump(x, y, 0.64, 0.53, 0.004, 0.008, 0.045); // maçãs
      z -= bump(x, y, 0.37, 0.64, 0.004, 0.012, 0.035) + bump(x, y, 0.63, 0.64, 0.004, 0.012, 0.035); // bochechas fundas
      z -= bump(x, y, EYES[0][0], EYES[0][1], 0.005, 0.0015, 0.05) + bump(x, y, EYES[1][0], EYES[1][1], 0.005, 0.0015, 0.05); // órbitas
      return z;
    };

    // Pontos ao longo dos traços (a malha segue olhos, nariz, boca e queixo)
    const addFeature = (x, y) => {
      if (pts.some((p) => dist(p, { x, y }) < 0.012)) return;
      pts.push({ x, y, edge: false, feat: true });
    };
    FEATURES.forEach((line) => {
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i], [x2, y2] = line[i + 1];
        const n = Math.max(1, Math.round(Math.hypot((x2 - x1) * ASPECT, y2 - y1) / 0.05));
        for (let k = 0; k < n; k++) addFeature(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n);
      }
      addFeature(line[line.length - 1][0], line[line.length - 1][1]);
    });
    EYES.forEach(([x, y]) => addFeature(x, y));

    // Preenche o restante do rosto com pontos espaçados
    for (let tries = 0; tries < 9000; tries++) {
      const c = { x: rand(), y: rand() };
      if (!inside(c.x, c.y)) continue;
      if (pts.every((p) => dist(p, c) > 0.046)) pts.push({ x: c.x, y: c.y, edge: false });
    }

    pts.forEach((p) => {
      p.z = zAt(p.x, p.y) + (rand() - 0.5) * 0.03;
      p.phase = rand() * Math.PI * 2;
      p.bright = rand() < 0.14;
    });

    // Vértices (com profundidade) dos traços e dos olhos para o desenho destacado
    const featureLines = FEATURES.map((line) => line.map(([x, y]) => ({ x, y, z: zAt(x, y) + 0.01 })));
    const eyes = EYES.map(([x, y]) => ({ x, y, z: zAt(x, y) + 0.04 }));

    // Arestas: vizinhos mais próximos, sem atravessar o vazio fora do contorno
    const adj = pts.map(() => new Set());
    const edges = [];
    pts.forEach((p, i) => {
      pts.map((q, j) => ({ j, d: i === j ? 9 : dist(p, q) }))
        .filter((o) => o.d < 0.125).sort((a, b) => a.d - b.d).slice(0, 5)
        .forEach(({ j }) => {
          if (adj[i].has(j)) return;
          const q = pts[j];
          const consecutive = p.edge && q.edge && Math.abs(p.ring - q.ring) % (ringCount - 1) <= 1;
          if (!consecutive && !inside((p.x + q.x) / 2, (p.y + q.y) / 2)) return;
          adj[i].add(j); adj[j].add(i);
          edges.push([i, j]);
        });
    });

    // Triângulos (faces) para o efeito low-poly
    const tris = [];
    edges.forEach(([i, j]) => {
      adj[i].forEach((k) => {
        if (k > i && k > j && adj[j].has(k)) {
          const cx = (pts[i].x + pts[j].x + pts[k].x) / 3, cy = (pts[i].y + pts[j].y + pts[k].y) / 3;
          if (inside(cx, cy)) tris.push({ a: i, b: j, c: k, shade: rand(), cx });
        }
      });
    });

    // Sinais luminosos que percorrem as arestas
    const signals = Array.from({ length: 18 }, () => {
      const [a, b] = edges[Math.floor(rand() * edges.length)];
      return { a, b, t: rand(), speed: 0.7 + rand() * 0.8 };
    });

    // Sprite de brilho pré-renderizado
    const glow = document.createElement('canvas');
    glow.width = glow.height = 64;
    const g = glow.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(180, 250, 255, 1)');
    grad.addColorStop(0.25, 'rgba(0, 229, 255, .6)');
    grad.addColorStop(1, 'rgba(0, 120, 255, 0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);

    /* --- Renderização --- */
    let W = 0, H = 0, sm = { x: 0, y: 0 };
    const proj = pts.map(() => ({ x: 0, y: 0 }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t = 0, dt = 16) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const s = W / 600; // fator de escala para espessuras

      // Movimento suave do mouse
      sm.x += (mouse.x - sm.x) * 0.05; sm.y += (mouse.y - sm.y) * 0.05;
      const ang = (reduceMotion ? 0 : Math.sin(t * 0.00035) * 0.16) + sm.x * 0.22;
      const pitch = sm.y * 0.12;
      const bob = reduceMotion ? 0 : Math.sin(t * 0.0009) * 0.008;
      const cos = Math.cos(ang), sin = Math.sin(ang);

      const P = (nx, ny, z) => ({
        x: (0.5 + (nx - 0.5) * cos + z * sin) * W,
        y: (ny + z * pitch + bob) * H,
      });
      pts.forEach((p, i) => { proj[i] = P(p.x, p.y, p.z); });
      const fade = (ny) => clamp((1 - ny) / 0.16, 0, 1);

      // 1) Faces
      tris.forEach((f) => {
        const A = proj[f.a], B = proj[f.b], C = proj[f.c];
        const yf = fade((pts[f.a].y + pts[f.b].y + pts[f.c].y) / 3);
        const shimmer = reduceMotion ? 0 : Math.sin(t * 0.001 + f.cx * 7) * 0.025;
        const alpha = (0.018 + f.shade * 0.075 + shimmer) * yf;
        ctx.fillStyle = `rgba(0, 150, 255, ${Math.max(alpha, 0)})`;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.fill();
      });

      // 2) Arestas — brilho amplo + linha fina agrupada por intensidade
      const buckets = [[], [], [], [], []];
      edges.forEach(([i, j]) => {
        const zf = clamp(((pts[i].z + pts[j].z) / 2 + 0.05) / 0.4, 0, 1);
        const score = (0.35 + 0.65 * zf) * fade((pts[i].y + pts[j].y) / 2);
        buckets[Math.min(4, Math.floor(score * 5))].push([i, j]);
      });
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4 * s; ctx.strokeStyle = 'rgba(0, 140, 255, .05)';
      ctx.beginPath();
      edges.forEach(([i, j]) => { ctx.moveTo(proj[i].x, proj[i].y); ctx.lineTo(proj[j].x, proj[j].y); });
      ctx.stroke();
      ctx.lineWidth = Math.max(1, 1.1 * s);
      buckets.forEach((list, level) => {
        ctx.strokeStyle = `rgba(0, 215, 255, ${0.08 + level * 0.17})`;
        ctx.beginPath();
        list.forEach(([i, j]) => { ctx.moveTo(proj[i].x, proj[i].y); ctx.lineTo(proj[j].x, proj[j].y); });
        ctx.stroke();
      });

      // 3) Trilhas de circuito com fluxo animado
      ctx.lineWidth = Math.max(1.2, 1.6 * s);
      ctx.setLineDash([8 * s, 12 * s]);
      ctx.lineDashOffset = reduceMotion ? 0 : -t * 0.03;
      ctx.strokeStyle = 'rgba(0, 240, 255, .8)';
      TRACES.forEach((tr) => {
        ctx.beginPath();
        tr.forEach(([x, y], k) => { const q = P(x, y, 0.3); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        ctx.stroke();
      });
      ctx.setLineDash([]);
      TRACES.forEach((tr) => {
        const [x, y] = tr[tr.length - 1];
        const q = P(x, y, 0.3);
        ctx.fillStyle = 'rgba(0, 240, 255, .95)';
        ctx.beginPath(); ctx.arc(q.x, q.y, 3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(glow, q.x - 14 * s, q.y - 14 * s, 28 * s, 28 * s);
      });

      // 3b) Traços do rosto em destaque (queixo, sobrancelhas, olhos, nariz, boca)
      [[5 * s, 'rgba(0, 170, 255, .1)'], [Math.max(1.2, 1.7 * s), 'rgba(130, 245, 255, .75)']].forEach(([lw, color]) => {
        ctx.lineWidth = lw; ctx.strokeStyle = color;
        featureLines.forEach((line) => {
          ctx.beginPath();
          line.forEach((v, k) => { const q = P(v.x, v.y, v.z); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
          ctx.stroke();
        });
      });

      // 4) Nós
      ctx.fillStyle = 'rgba(160, 240, 255, .9)';
      ctx.beginPath();
      pts.forEach((p, i) => {
        const r = (1.1 + p.z * 3) * s;
        ctx.moveTo(proj[i].x + r, proj[i].y);
        ctx.arc(proj[i].x, proj[i].y, r, 0, Math.PI * 2);
      });
      ctx.fill();
      pts.forEach((p, i) => {
        if (!p.bright) return;
        const pulse = reduceMotion ? 0.7 : 0.55 + 0.45 * Math.sin(t * 0.002 + p.phase);
        const size = (16 + pulse * 14) * s * fade(p.y);
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.drawImage(glow, proj[i].x - size / 2, proj[i].y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;

      // 5) Sinais percorrendo a malha
      if (!reduceMotion) {
        signals.forEach((sg) => {
          const len = dist(pts[sg.a], pts[sg.b]) || 0.05;
          sg.t += (dt * 0.0002 * sg.speed) / len;
          if (sg.t >= 1) {
            const next = [...adj[sg.b]].filter((n) => n !== sg.a);
            const to = next.length ? next[Math.floor(Math.random() * next.length)] : sg.a;
            sg.a = sg.b; sg.b = to; sg.t = 0;
          }
        });
      }
      signals.forEach((sg) => {
        const A = proj[sg.a], B = proj[sg.b];
        const x = A.x + (B.x - A.x) * sg.t, y = A.y + (B.y - A.y) * sg.t;
        const tx = A.x + (B.x - A.x) * Math.max(0, sg.t - 0.35), ty = A.y + (B.y - A.y) * Math.max(0, sg.t - 0.35);
        const yf = fade(pts[sg.a].y);
        ctx.strokeStyle = `rgba(150, 250, 255, ${0.8 * yf})`; ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = yf;
        ctx.drawImage(glow, x - 9 * s, y - 9 * s, 18 * s, 18 * s);
        ctx.globalAlpha = 1;
      });

      // 6) Chip "AI" na testa
      ctx.globalCompositeOperation = 'source-over';
      const c = P(CHIP.x, CHIP.y, 0.3);
      const cw = 0.12 * W * Math.max(0.6, Math.abs(cos)), ch = 0.085 * H;
      ctx.strokeStyle = 'rgba(0, 229, 255, .8)'; ctx.lineWidth = Math.max(1, 1.4 * s);
      for (let k = -2; k <= 2; k++) { // pinos do chip
        ctx.beginPath();
        ctx.moveTo(c.x + k * cw * 0.2, c.y - ch / 2); ctx.lineTo(c.x + k * cw * 0.2, c.y - ch / 2 - 6 * s);
        ctx.moveTo(c.x + k * cw * 0.2, c.y + ch / 2); ctx.lineTo(c.x + k * cw * 0.2, c.y + ch / 2 + 6 * s);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(3, 12, 24, .92)';
      ctx.shadowColor = 'rgba(0, 229, 255, .9)'; ctx.shadowBlur = 16 * s;
      ctx.beginPath(); ctx.roundRect(c.x - cw / 2, c.y - ch / 2, cw, ch, 8 * s); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#7DF3FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(24 * s)}px "Space Grotesk", sans-serif`;
      ctx.fillText('AI', c.x, c.y + 1 * s);

      // 7) Olhos: barras luminosas estreitas e inclinadas (olhar frio e sério)
      ctx.globalCompositeOperation = 'lighter';
      const pulse = reduceMotion ? 1 : 0.88 + 0.12 * Math.sin(t * 0.003);
      EYE_BARS.forEach(([ia, ib]) => {
        const A = P(ia[0], ia[1], zAt(ia[0], ia[1]) + 0.04);
        const B = P(ib[0], ib[1], zAt(ib[0], ib[1]) + 0.04);
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        ctx.drawImage(glow, mx - 46 * s * pulse, my - 30 * s * pulse, 92 * s * pulse, 60 * s * pulse);
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 229, 255, 1)'; ctx.shadowBlur = 16 * s;
        ctx.strokeStyle = 'rgba(70, 225, 255, .95)'; ctx.lineWidth = Math.max(2, 6 * s);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(235, 255, 255, .95)'; ctx.lineWidth = Math.max(1, 2.2 * s);
        ctx.beginPath(); ctx.moveTo(A.x + (B.x - A.x) * 0.12, A.y + (B.y - A.y) * 0.12);
        ctx.lineTo(A.x + (B.x - A.x) * 0.88, A.y + (B.y - A.y) * 0.88); ctx.stroke();
      });

      ctx.globalCompositeOperation = 'source-over';
    }

    resize();
    new ResizeObserver(() => { resize(); if (reduceMotion) draw(0); }).observe(canvas);
    if (reduceMotion) draw(0);
    else makeLoop(draw, canvas).start();
  }

  /* ---------- Botões de WhatsApp ---------- */
  function initWhatsApp() {
    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
      el.href = waUrl(WHATSAPP_MESSAGE);
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
  }

  /* ---------- Formulário: leva a mensagem, o e-mail e o WhatsApp do cliente ao seu WhatsApp ---------- */
  function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = document.getElementById('form-status');
    const phone = form.querySelector('#whatsapp');
    const message = form.querySelector('#mensagem');

    // Máscara de telefone: (81) 99999-9999
    const maskPhone = (v) => {
      const d = v.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    phone.addEventListener('input', () => { phone.value = maskPhone(phone.value); });

    // Botões "Quero essa solução" já preenchem o assunto
    document.querySelectorAll('[data-topic]').forEach((link) => {
      link.addEventListener('click', () => {
        if (!message.value.trim()) message.value = `Tenho interesse em: ${link.dataset.topic}.`;
      });
    });

    function validate(input) {
      const field = input.closest('.field');
      const value = input.value.trim();
      let msg = '';
      if (!value) msg = 'Preencha este campo.';
      else if (input.name === 'nome' && value.length < 2) msg = 'Informe seu nome.';
      else if (input.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Informe um e-mail válido.';
      else if (input.name === 'whatsapp' && ![10, 11].includes(value.replace(/\D/g, '').length)) msg = 'Informe o WhatsApp com DDD.';
      else if (input.name === 'mensagem' && value.length < 10) msg = 'Conte um pouco mais sobre como podemos ajudar.';
      field.classList.toggle('invalid', Boolean(msg));
      field.querySelector('.error').textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    const inputs = [...form.querySelectorAll('input, textarea')];
    inputs.forEach((i) => {
      i.addEventListener('blur', () => validate(i));
      i.addEventListener('input', () => { if (i.closest('.field').classList.contains('invalid')) validate(i); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      const ok = inputs.map(validate);
      if (ok.includes(false)) { inputs.find((i) => i.getAttribute('aria-invalid') === 'true').focus(); return; }

      const d = new FormData(form);
      const text =
        `*Novo contato pelo site NEXUSTECH*\n\n` +
        `*Nome:* ${d.get('nome').trim()}\n` +
        `*E-mail:* ${d.get('email').trim()}\n` +
        `*WhatsApp:* ${d.get('whatsapp').trim()}\n\n` +
        `*Como podemos ajudar:*\n${d.get('mensagem').trim()}`;

      const url = waUrl(text);
      const win = window.open(url, '_blank');
      if (win) win.opener = null; else window.location.href = url; // plano B se o navegador bloquear a janela

      status.textContent = 'Quase lá! O WhatsApp foi aberto com a sua mensagem. Toque em enviar para concluir.';
      form.reset();
      inputs.forEach((i) => i.setAttribute('aria-invalid', 'false'));
    });
  }

  /* ---------- Inicialização ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCounters();
    initParticles();
    initHead();
    initWhatsApp();
    initForm();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();