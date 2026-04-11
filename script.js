/* ═══════════════════════════════════════════════════════════
   MODEL BARBERS — script.js
   ═══════════════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Year ─────────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ═══════════════════════════════════════════════════════════
   HEADER — slim on scroll
   ═══════════════════════════════════════════════════════════ */
const header = document.querySelector('.site-header');
if (header) {
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('slim', y > 60);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ═══════════════════════════════════════════════════════════
   MOBILE NAV OVERLAY
   ═══════════════════════════════════════════════════════════ */
const navToggle  = document.querySelector('.nav-toggle');
const navOverlay = document.getElementById('nav-overlay');
const navOverlayLinks = navOverlay ? navOverlay.querySelectorAll('a') : [];

const openNav = () => {
  navOverlay.classList.add('open');
  navOverlay.setAttribute('aria-hidden', 'false');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const closeNav = () => {
  navOverlay.classList.remove('open');
  navOverlay.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

if (navToggle && navOverlay) {
  navToggle.addEventListener('click', () => {
    const isOpen = navOverlay.classList.contains('open');
    isOpen ? closeNav() : openNav();
  });

  navOverlayLinks.forEach(a => a.addEventListener('click', closeNav));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navOverlay.classList.contains('open')) closeNav();
  });
}

/* ═══════════════════════════════════════════════════════════
   BARBER-POLE STRIPE — scroll velocity + direction
   ═══════════════════════════════════════════════════════════ */
const stripeTrack = document.querySelector('.top-stripe-track');
if (stripeTrack && !reduceMotion) {
  const TILE_W = 40;   // matches one gradient repeat (4 × 10px)
  const DECAY  = 0.88;

  let stripePos = 0;
  let stripeVel = 0;
  let lastSY    = window.scrollY;

  window.addEventListener('scroll', () => {
    const dy  = window.scrollY - lastSY;
    stripeVel = dy * 0.55;
    lastSY    = window.scrollY;
  }, { passive: true });

  const tickStripe = () => {
    stripeVel *= DECAY;
    stripePos += stripeVel;
    stripePos  = ((stripePos % TILE_W) + TILE_W) % TILE_W;
    stripeTrack.style.transform = `translateX(${stripePos.toFixed(2)}px)`;
    requestAnimationFrame(tickStripe);
  };
  requestAnimationFrame(tickStripe);
}

/* ═══════════════════════════════════════════════════════════
   VELOCITY MARQUEE
   ═══════════════════════════════════════════════════════════ */
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack && !reduceMotion) {
  let pos       = 0;
  let vel       = 0;
  let baseSpeed = 0.4;
  let lastSY2   = window.scrollY;

  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastSY2;
    vel      = dy * 0.5;
    lastSY2  = window.scrollY;
  }, { passive: true });

  const getW = () => {
    const first = marqueeTrack.querySelector('.marquee-content');
    return first ? first.offsetWidth : 0;
  };

  const tickMarquee = () => {
    vel     *= 0.9;
    const speed = baseSpeed + Math.abs(vel) * 0.03;
    pos    -= speed;
    const w = getW();
    if (w > 0 && Math.abs(pos) >= w) pos += w;
    marqueeTrack.style.transform = `translateX(${pos.toFixed(2)}px)`;
    requestAnimationFrame(tickMarquee);
  };
  requestAnimationFrame(tickMarquee);
}

/* ═══════════════════════════════════════════════════════════
   INTERSECTION OBSERVERS
   ═══════════════════════════════════════════════════════════ */
if ('IntersectionObserver' in window) {

  /* Section reveals */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.scroll-item').forEach((el, i) => {
        el.style.setProperty('--scroll-delay', `${Math.min(i * 80, 320)}ms`);
        el.classList.add('is-visible');
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObs.observe(el));

  /* Clip-path image reveals */
  const clipObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px' });

  document.querySelectorAll('[data-reveal="clip"]').forEach(el => clipObs.observe(el));

  /* Stat counters */
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

  const animateCount = (el) => {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const dur      = 1400;
    const start    = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = (easeOutQuart(p) * target).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    };
    requestAnimationFrame(step);
  };

  const statObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const numEl = entry.target.querySelector('.stat-num');
      if (numEl) {
        if (reduceMotion) {
          const t = parseFloat(numEl.dataset.count);
          numEl.textContent = t.toFixed(parseInt(numEl.dataset.decimal || '0', 10));
        } else {
          animateCount(numEl);
        }
      }
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stat').forEach((el, i) => {
    el.style.setProperty('--scroll-delay', `${i * 90}ms`);
    statObs.observe(el);
  });
}

/* Stagger hero items */
document.querySelectorAll('.stagger-group > *').forEach((el, i) => {
  el.style.setProperty('--item-delay', `${80 + i * 65}ms`);
});

/* ═══════════════════════════════════════════════════════════
   PARALLAX
   ═══════════════════════════════════════════════════════════ */
const parallaxEls = reduceMotion ? [] : Array.from(document.querySelectorAll('[data-parallax-speed]'));

if (parallaxEls.length) {
  let ticking = false;

  const updateParallax = () => {
    const midY = window.innerHeight * 0.5;
    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.parallaxSpeed || 0.1);
      const rect  = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height * 0.5 - midY) * speed * -0.2;
      const clamped = Math.max(Math.min(offset, 30), -30);
      el.style.setProperty('--parallax-shift', `${clamped.toFixed(2)}px`);
    });
    ticking = false;
  };

  const reqTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  };

  reqTick();
  window.addEventListener('scroll', reqTick, { passive: true });
  window.addEventListener('resize', reqTick);
}

/* ═══════════════════════════════════════════════════════════
   SCISSORS CURSOR
   ═══════════════════════════════════════════════════════════ */
const htmlEl     = document.documentElement;
const setSnip    = on => htmlEl.classList.toggle('snipping', on);

document.addEventListener('mousedown',        () => setSnip(true));
document.addEventListener('mouseup',          () => setSnip(false));
document.addEventListener('mouseleave',       () => setSnip(false));
window.addEventListener('blur',               () => setSnip(false));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') setSnip(false);
});

/* ═══════════════════════════════════════════════════════════
   AUDIO + CLIP BURST (interaction details)
   ═══════════════════════════════════════════════════════════ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

const getCtx = async () => {
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch { return null; }
  }
  return audioCtx;
};

const playTone = async ({ freq = 560, type = 'triangle', gain = 0.012, dur = 0.06 }) => {
  const ctx = await getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(amp); amp.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + dur);
};

const spawnClippings = (e) => {
  if (reduceMotion) return;
  const x = e.clientX ?? window.innerWidth * 0.5;
  const y = e.clientY ?? window.innerHeight * 0.5;
  for (let i = 0; i < 6; i++) {
    const chip = document.createElement('span');
    chip.className = 'clip-burst';
    chip.style.left = `${x}px`;
    chip.style.top  = `${y}px`;
    chip.style.setProperty('--x',   `${(Math.random() - 0.5) * 28}px`);
    chip.style.setProperty('--y',   `${Math.random() * -22 - 6}px`);
    chip.style.setProperty('--rot', `${Math.random() * 180}deg`);
    document.body.append(chip);
    chip.addEventListener('animationend', () => chip.remove(), { once: true });
  }
};

document.querySelectorAll('.btn, .floating-call').forEach(btn => {
  btn.addEventListener('pointerenter', () => {
    playTone({ freq: 640 + Math.random() * 80, type: 'triangle', gain: 0.005, dur: 0.03 });
  });
  btn.addEventListener('click', spawnClippings);
});

/* Logo click chime */
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', () => {
    playTone({ freq: 740, type: 'square', gain: 0.01, dur: 0.04 });
    setTimeout(() => playTone({ freq: 540, type: 'square', gain: 0.008, dur: 0.04 }), 45);
  });
}
