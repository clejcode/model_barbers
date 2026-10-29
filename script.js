/* ═══════════════════════════════════════════════════════════
   MODEL BARBERS — script.js
   ═══════════════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsView = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

document.documentElement.classList.add('js');

/* ── Year ─────────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ═══════════════════════════════════════════════════════════
   LIVE OPEN / CLOSED — America/New_York
   Mon–Fri 9:00–19:00, Sat 9:00–18:00, Sun closed.
   ═══════════════════════════════════════════════════════════ */
const shopStatus = (now = new Date()) => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(now);
  const pick = (type) => parts.find((part) => part.type === type)?.value || '';
  const weekday = pick('weekday').slice(0, 3);
  let hour = parseInt(pick('hour'), 10);
  const minute = parseInt(pick('minute'), 10);
  const dayPeriod = pick('dayPeriod').toLowerCase();
  if (dayPeriod.startsWith('pm') && hour < 12) hour += 12;
  if (dayPeriod.startsWith('am') && hour === 12) hour = 0;

  const nextOpen = { Sun: 'Mon', Mon: 'Tue', Tue: 'Wed', Wed: 'Thu', Thu: 'Fri', Fri: 'Sat', Sat: 'Mon' };
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !nextOpen[weekday]) {
    return { open: false, text: 'Mon–Fri 9–7 · Sat 9–6 · Sun closed' };
  }

  const mins = hour * 60 + minute;
  const openAt = 9 * 60;
  const closeAt = weekday === 'Sun' ? null : weekday === 'Sat' ? 18 * 60 : 19 * 60;

  if (closeAt !== null && mins >= openAt && mins < closeAt) {
    return { open: true, text: `Open now · until ${weekday === 'Sat' ? '6 PM' : '7 PM'}` };
  }
  if (closeAt !== null && mins < openAt) {
    return { open: false, text: 'Closed · opens 9 AM' };
  }
  return { open: false, text: `Closed · opens 9 AM ${nextOpen[weekday]}` };
};

const paintShopStatus = () => {
  const state = shopStatus();
  document.querySelectorAll('[data-shop-status]').forEach((el) => {
    el.dataset.open = state.open ? 'true' : 'false';
    const text = el.querySelector('[data-status-text]');
    if (text) text.textContent = state.text;
  });
};

if (document.querySelector('[data-shop-status]')) {
  paintShopStatus();
  window.setInterval(paintShopStatus, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') paintShopStatus();
  });
}

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

/* Floating call appears only after the opening block has left the screen. */
const floatingCall = document.querySelector('.floating-call');
const openingBlock = document.querySelector('.hero, .about-intro, .page-intro');
if (floatingCall && openingBlock && 'IntersectionObserver' in window) {
  const floatObs = new IntersectionObserver(([entry]) => {
    floatingCall.classList.toggle('is-shown', !entry.isIntersecting);
  });
  floatObs.observe(openingBlock);
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

  if (!supportsView) {
    document.querySelectorAll('.photo-frame').forEach(el => clipObs.observe(el));

    const fanObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-straight');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('[data-fan]').forEach(el => fanObs.observe(el));

    const footerObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.site-footer').forEach(el => footerObs.observe(el));
  }

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

/* Click-to-load map. The illustrated plate is the default. */
const mapButton = document.querySelector('[data-load-map]');
if (mapButton) {
  mapButton.addEventListener('click', () => {
    const slot = document.getElementById('map-slot');
    const art = document.querySelector('.map-art');
    if (!slot || slot.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.title = 'Map showing Model Barbers at 497 Union Ave, Williamsburg, Brooklyn';
    frame.src = 'https://www.google.com/maps?q=497%20Union%20Ave%2C%20Brooklyn%2C%20NY%2011211&output=embed';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('aria-label', 'Google Map — Model Barbers location');
    slot.append(frame);
    slot.classList.add('is-live');
    if (art) art.hidden = true;
    mapButton.disabled = true;
    mapButton.textContent = 'Map loaded';
  });
}

/* Logo click chime */
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', () => {
    playTone({ freq: 740, type: 'square', gain: 0.01, dur: 0.04 });
    setTimeout(() => playTone({ freq: 540, type: 'square', gain: 0.008, dur: 0.04 }), 45);
  });
}
