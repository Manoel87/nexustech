/* ==========================================================
   Manoel | Web Designer — script.js
   Módulos: menu, scroll, animações, partículas, WhatsApp, formulário
   ========================================================== */
(() => {
  'use strict';

  // WhatsApp que recebe as mensagens (código do país + DDD + número, só dígitos)
  const WHATSAPP_NUMBER = '5581997967332';
  const WHATSAPP_MESSAGE = 'Olá, Manoel! Vim pelo seu portfólio e gostaria de solicitar um orçamento.';

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
    window.addEventListener('resize', () => { if (window.innerWidth > 980) setMenu(false); });
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
        `*Novo contato pelo portfólio Manoel | Web Designer*\n\n` +
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
    initWhatsApp();
    initForm();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();