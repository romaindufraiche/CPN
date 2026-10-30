/* ==========================================================
   Cergy Pontoise Natation — motion design
   GSAP + ScrollTrigger + Lenis (smooth scroll)
   ========================================================== */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Menu mobile (fonctionne même sans animations) ---------- */
  const burger = $('.burger');
  const menu = $('.menu');
  const toggleMenu = (open) => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', String(!open));
  };
  burger.addEventListener('click', () => toggleMenu(!body.classList.contains('menu-open')));
  $$('.menu a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Onglets « Trouver son groupe » ---------- */
  const tabs = $$('.groups__tabs [role="tab"]');
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    const items = $$(`#${tab.getAttribute('aria-controls')} li`);
    if (window.gsap && !reduced) gsap.fromTo(items, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, stagger: .03, ease: 'power3.out' });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  /* ---------- Sans GSAP ou mouvement réduit : version statique ---------- */
  if (reduced || !window.gsap || !window.ScrollTrigger) {
    root.classList.add('no-motion');
    body.classList.remove('is-loading');
    $$('.js-counter').forEach((el) => { el.textContent = el.dataset.to; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: 'smooth' });
    });
  });

  /* ---------- Découpage en mots ---------- */
  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    return $$('.w', el);
  };

  /* ==========================================================
     1. INTRO — l'eau monte dans le logo, puis vague de couleurs
     ========================================================== */
  const count = { v: 0 };
  const countEl = $('.js-count');

  gsap.set('.hero__title .word', { yPercent: 115 });
  gsap.set(['.hero__tagline', '.hero__actions > *', '.hero__scroll'], { autoAlpha: 0, y: 30 });
  gsap.set('.hero__img', { scale: 1.35 });
  gsap.set('.header', { yPercent: -100, autoAlpha: 0 });

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .to(count, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = Math.round(count.v); },
    })
    .to('.loader__fill', { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'power2.inOut' }, 0)
    .to('.loader__panel', { yPercent: -100, duration: .9, stagger: .12, ease: 'expo.inOut' }, '+=.15')
    .set(['.loader__word', '.loader__count'], { autoAlpha: 0 })
    .set('.loader', { background: 'transparent' })
    .to('.loader__panel', { yPercent: -200, duration: .9, stagger: { each: .1, from: 'end' }, ease: 'expo.inOut' })
    .set('.loader', { display: 'none' })
    .add(() => {
      body.classList.remove('is-loading');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    })
    .to('.hero__img', { scale: 1, duration: 2.2 }, '-=1.1')
    .to('.hero__title .word', { yPercent: 0, duration: 1.3, stagger: .1 }, '<.1')
    .to('.hero__tagline', { autoAlpha: 1, y: 0, duration: 1 }, '<.5')
    .to('.hero__actions > *', { autoAlpha: 1, y: 0, duration: 1, stagger: .08 }, '<.15')
    .to('.header', { yPercent: 0, autoAlpha: 1, duration: 1 }, '<')
    .to('.hero__scroll', { autoAlpha: 1, y: 0, duration: 1 }, '<.2');

  /* ==========================================================
     2. HERO — parallaxe à la sortie
     ========================================================== */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__img', { yPercent: 18, ease: 'none' }, 0)
    .to('.hero__content', { yPercent: -35, autoAlpha: 0, ease: 'none' }, 0)
    .to('.hero__title .line:nth-child(1)', { xPercent: -8, ease: 'none' }, 0)
    .to('.hero__title .line:nth-child(3)', { xPercent: 8, ease: 'none' }, 0);

  /* Marquee : accélère et s'incline avec la vitesse de scroll */
  const marqueeTrack = $('.marquee__track');
  const marqueeTween = gsap.to(marqueeTrack, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
  marqueeTrack.style.animation = 'none';

  /* ==========================================================
     3. HEADER — se cache en descendant, réapparaît en remontant
     ========================================================== */
  const header = $('.header');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', self.direction === 1 && y > 400 && !body.classList.contains('menu-open'));
      const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 250);
      marqueeTween.timeScale(1 + Math.abs(v));
    },
  });

  /* Lien actif dans la navigation */
  $$('.nav a').forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  /* ==========================================================
     4. MANIFESTE — les mots s'allument au fil du scroll
     ========================================================== */
  $$('.js-split').forEach((el) => {
    const words = splitWords(el);
    gsap.to(words, {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  /* Compteurs */
  $$('.js-counter').forEach((el) => {
    const to = +el.dataset.to;
    const obj = { v: to > 1000 ? to - 40 : 0 };
    gsap.to(obj, {
      v: to, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    });
  });
  gsap.from('.stat', {
    y: 60, autoAlpha: 0, duration: 1.1, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.stats', start: 'top 85%' },
  });

  /* Bulles */
  const bubbles = $('.bubbles');
  for (let i = 0; i < 16; i++) {
    const b = document.createElement('span');
    const size = gsap.utils.random(8, 46);
    b.className = 'bubble';
    Object.assign(b.style, { width: `${size}px`, height: `${size}px`, left: `${gsap.utils.random(0, 100)}%` });
    bubbles.appendChild(b);
    gsap.to(b, {
      y: () => -(bubbles.offsetHeight + 80),
      x: `+=${gsap.utils.random(-60, 60)}`,
      duration: gsap.utils.random(9, 20), delay: gsap.utils.random(0, 10),
      repeat: -1, ease: 'sine.inOut',
    });
  }

  /* ==========================================================
     5. RÉVÉLATIONS GÉNÉRIQUES
     ========================================================== */
  $$('.section .eyebrow, .activities .eyebrow, .h2, .lead, .link-arrow, .volunteer .btn').forEach((el) => {
    gsap.from(el, {
      y: 70, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* Actualités */
  gsap.from('.news__feature', {
    y: 80, autoAlpha: 0, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: '.news__grid', start: 'top 85%' },
  });
  gsap.from('.news__list li', {
    x: 60, autoAlpha: 0, duration: 1.1, stagger: .12, ease: 'expo.out',
    scrollTrigger: { trigger: '.news__grid', start: 'top 80%' },
  });

  /* ==========================================================
     6. ACTIVITÉS — section épinglée, défilement horizontal
     ========================================================== */
  const track = $('.activities__track');
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const horizontal = gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: '.activities', start: 'top top', end: () => `+=${distance()}`,
      pin: '.activities__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  gsap.to('.activities__progress i', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: '.activities', start: 'top top', end: () => `+=${distance()}`, scrub: true },
  });
  $$('.card').forEach((card, i) => {
    gsap.from(card, {
      yPercent: 30, rotate: i % 2 ? 6 : -6, autoAlpha: 0, ease: 'power2.out',
      scrollTrigger: {
        trigger: card, containerAnimation: horizontal,
        start: 'left 105%', end: 'left 65%', scrub: true,
      },
    });
  });
  // Les premières cartes sont déjà à l'écran : entrée verticale
  gsap.from('.activities__track', {
    y: 120, autoAlpha: 0, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.activities', start: 'top 70%' },
  });

  /* ==========================================================
     7. PARCOURS — la ligne d'eau se trace
     ========================================================== */
  gsap.to('.journey__draw', {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.journey__lane', start: 'top 65%', end: 'bottom 65%', scrub: true },
  });
  $$('.step').forEach((step) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 70%', toggleActions: 'play none none reverse' } });
    tl.from($('.step__n', step), { xPercent: -40, autoAlpha: 0, duration: 1.2, ease: 'expo.out' })
      .from($$('h3, p', step), { y: 40, autoAlpha: 0, duration: 1, stagger: .08, ease: 'expo.out' }, '<.1')
      .to($('.step__dot', step), { backgroundColor: '#E516A0', borderColor: '#E516A0', scale: 1.25, duration: .5, ease: 'back.out(3)' }, '<')
      .to($('.step__n', step), { color: '#0709A7', duration: .8 }, '<.3');
  });

  /* ==========================================================
     8. MEETING — texte géant piloté par le scroll
     ========================================================== */
  gsap.fromTo('.js-velocity', { xPercent: 0 }, {
    xPercent: -30, ease: 'none',
    scrollTrigger: { trigger: '.meeting', start: 'top bottom', end: 'bottom top', scrub: .6 },
  });
  gsap.timeline({ scrollTrigger: { trigger: '.meeting__inner', start: 'top 80%' } })
    .from('.date__d', { yPercent: 60, autoAlpha: 0, duration: 1.3, ease: 'expo.out' })
    .from('.date__m', { x: -30, autoAlpha: 0, duration: 1, ease: 'expo.out' }, '<.2')
    .from('.prizes li', { x: 60, autoAlpha: 0, duration: 1, stagger: .1, ease: 'expo.out' }, '<')
    .from('.meeting .btn', { y: 30, autoAlpha: 0, duration: .8, ease: 'expo.out' }, '<.3');

  /* ==========================================================
     9. PISCINES — lignes qui glissent
     ========================================================== */
  $$('.pool').forEach((pool, i) => {
    gsap.from(pool, {
      xPercent: i % 2 ? 12 : -12, autoAlpha: 0, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: pool, start: 'top 92%' },
    });
  });

  /* Adhésion : étapes et bloc groupes */
  gsap.from('.steps li', {
    y: 50, autoAlpha: 0, duration: 1.1, stagger: .1, ease: 'expo.out',
    scrollTrigger: { trigger: '.steps', start: 'top 85%' },
  });
  ['.groups', '.fees', '.rules', '.membership__cta'].forEach((sel) => {
    gsap.from(sel, {
      y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: sel, start: 'top 88%' },
    });
  });

  /* ==========================================================
     10. INSCRIPTIONS — goutte qui s'étend
     ========================================================== */
  gsap.to('.signup__circle', {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.signup', start: 'top 85%', end: 'center 55%', scrub: true },
  });
  gsap.timeline({ scrollTrigger: { trigger: '.signup', start: 'top 45%' } })
    .from('.signup .eyebrow', { y: 30, autoAlpha: 0, duration: .8, ease: 'expo.out' })
    .from('.signup__title', { y: 80, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, '<.1')
    .from('.signup__text', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out' }, '<.2')
    .from('.signup .btn', { scale: .6, autoAlpha: 0, duration: 1, ease: 'back.out(2)' }, '<.2');

  /* ==========================================================
     11. FOOTER — le monogramme émerge
     ========================================================== */
  gsap.from('.footer__mega', {
    yPercent: 45, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  gsap.from('.footer__claim', {
    y: 80, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 80%' },
  });

  /* ==========================================================
     12. BOUTONS MAGNÉTIQUES (souris uniquement)
     ========================================================== */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(btn, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .3);
        yTo((e.clientY - r.top - r.height / 2) * .4);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
