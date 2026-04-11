/* ═══════════════════════════════════════════════════════════
   MODEL BARBERS — script.js
   ═══════════════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Stagger delays for hero ──────────────────────────────── */
document.querySelectorAll('.stagger-group > *').forEach((item, i) => {
  item.style.setProperty('--item-delay', `${120 + i * 70}ms`);
});

/* ── Year ─────────────────────────────────────────────────── */
const yearNode = document.querySelector('#year');
if (yearNode) yearNode.textContent = new Date().getFullYear();

/* ── Nav toggle ───────────────────────────────────────────── */
const navToggle  = document.querySelector('.nav-toggle');
const navLinks   = document.querySelector('#main-nav');
const navAnchors = document.querySelectorAll('.nav-links a');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navAnchors.forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ── Barber-pole stripe — scroll-linked direction + speed ─── */
const stripeTrack = document.querySelector('.top-stripe-track');
if (stripeTrack && !reduceMotion) {
  // Width of one tile repeat so we can loop seamlessly
  const TILE_W     = 64;          // matches repeating-gradient segment (16px × 4)
  const DECAY      = 0.88;        // how quickly velocity bleeds off each frame
  const BASE_DRIFT = 0;           // px/frame at rest (0 = stationary when not scrolling)

  let stripePos   = 0;
  let stripeVel   = 0;
  let lastSY      = window.scrollY;

  window.addEventListener('scroll', () => {
    const dy    = window.scrollY - lastSY;
    // Scale scroll delta → stripe pixels per frame
    // negative dy (scroll up) → moves stripe left; positive → moves right
    stripeVel   = dy * 0.6;
    lastSY      = window.scrollY;
  }, { passive: true });

  const tickStripe = () => {
    stripeVel  *= DECAY;
    stripePos  += stripeVel;

    // Seamless loop — keep position within one tile width
    stripePos   = ((stripePos % TILE_W) + TILE_W) % TILE_W;

    stripeTrack.style.transform = `translateX(${stripePos.toFixed(2)}px)`;
    requestAnimationFrame(tickStripe);
  };

  requestAnimationFrame(tickStripe);
}

/* ══════════════════════════════════════════════════════════
   SCROLL VELOCITY MARQUEE
   ══════════════════════════════════════════════════════════ */
const marqueeTrack = document.getElementById('marquee-track');

if (marqueeTrack && !reduceMotion) {
  let position      = 0;
  let baseSpeed     = 0.45;   // px per frame at rest
  let velocity      = 0;
  let lastScrollY   = window.scrollY;
  let lastScrollTime = performance.now();
  let raf;

  // Measure the width of one content copy
  const getContentWidth = () => {
    const first = marqueeTrack.querySelector('.marquee-content');
    return first ? first.offsetWidth : 0;
  };

  const tick = (now) => {
    const contentW = getContentWidth();
    if (contentW === 0) { raf = requestAnimationFrame(tick); return; }

    // Decay velocity toward 0
    velocity *= 0.92;

    const speed = baseSpeed + Math.abs(velocity) * 0.04;
    position -= speed;

    // Loop seamlessly
    if (Math.abs(position) >= contentW) {
      position += contentW;
    }

    marqueeTrack.style.transform = `translateX(${position}px)`;
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  window.addEventListener('scroll', () => {
    const now    = performance.now();
    const dy     = window.scrollY - lastScrollY;
    const dt     = Math.max(now - lastScrollTime, 1);
    velocity     = (dy / dt) * 16; // scale to ~px/frame
    lastScrollY   = window.scrollY;
    lastScrollTime = now;
  }, { passive: true });

} else if (marqueeTrack) {
  // Reduced motion: simple CSS animation fallback
  marqueeTrack.style.animation = 'marqueeStatic 30s linear infinite';
}

/* ══════════════════════════════════════════════════════════
   INTERSECTION OBSERVER — shared setup
   ══════════════════════════════════════════════════════════ */
const observeOnce = (selector, className, options = {}) => {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(className);
        o.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px', ...options });
  els.forEach(el => obs.observe(el));
};

/* ── Section reveals ──────────────────────────────────────── */
if ('IntersectionObserver' in window) {
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Also trigger child scroll-items
        entry.target.querySelectorAll('.scroll-item').forEach(item => {
          item.classList.add('is-visible');
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}

/* ── Scroll-item stagger inside sections ─────────────────── */
const scrollItemSelectors = [
  '.section-head', '.service-table',
  '.team-copy', '.location-grid > *',
  '.faq details', '.cash-notice',
];
document.querySelectorAll('.section').forEach(section => {
  section.querySelectorAll(scrollItemSelectors.join(',')).forEach((item, i) => {
    item.classList.add('scroll-item');
    item.style.setProperty('--scroll-delay', `${Math.min(i * 80, 300)}ms`);
  });
});

/* ── Clip-path image reveals ──────────────────────────────── */
observeOnce('[data-reveal="clip"]', 'is-revealed', {
  threshold: 0,
  rootMargin: '0px 0px 0px 0px',
});

/* ══════════════════════════════════════════════════════════
   STAT COUNTER ANIMATION
   ══════════════════════════════════════════════════════════ */
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

const animateCounter = (el) => {
  const target   = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimal || '0', 10);
  const duration = 1600;
  const start    = performance.now();

  const step = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value    = easeOutQuart(progress) * target;
    el.textContent = value.toFixed(decimals);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(decimals);
  };

  requestAnimationFrame(step);
};

if ('IntersectionObserver' in window) {
  const statObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Reveal the stat card
        entry.target.classList.add('is-visible');
        // Start counter
        const numEl = entry.target.querySelector('.stat-num');
        if (numEl && !reduceMotion) animateCounter(numEl);
        else if (numEl) numEl.textContent = parseFloat(numEl.dataset.count).toFixed(parseInt(numEl.dataset.decimal || '0', 10));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stat').forEach((el, i) => {
    el.style.setProperty('--scroll-delay', `${i * 90}ms`);
    statObs.observe(el);
  });
}

/* ══════════════════════════════════════════════════════════
   PARALLAX
   ══════════════════════════════════════════════════════════ */
const parallaxItems = reduceMotion ? [] : Array.from(document.querySelectorAll('.parallax'));

if (parallaxItems.length > 0) {
  let ticking = false;

  const updateParallax = () => {
    const viewMid = window.innerHeight * 0.5;
    parallaxItems.forEach(item => {
      const speed = Number(item.dataset.parallaxSpeed || 0.15);
      const rect  = item.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = rect.top + rect.height * 0.5 - viewMid;
      const shift  = Math.max(Math.min(-offset * speed * 0.22, 28), -28);
      item.style.setProperty('--parallax-shift', `${shift.toFixed(2)}px`);
    });
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  };

  requestTick();
  window.addEventListener('scroll',  requestTick, { passive: true });
  window.addEventListener('resize',  requestTick);
}

/* ══════════════════════════════════════════════════════════
   SCISSORS CURSOR
   ══════════════════════════════════════════════════════════ */
const snipRoot = document.documentElement;
const setSnipping = on => snipRoot.classList.toggle('snipping', on);

document.addEventListener('mousedown',      () => setSnipping(true));
document.addEventListener('mouseup',        () => setSnipping(false));
document.addEventListener('mouseleave',     () => setSnipping(false));
window.addEventListener('blur',             () => setSnipping(false));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') setSnipping(false);
});

/* ══════════════════════════════════════════════════════════
   AUDIO ENGINE
   ══════════════════════════════════════════════════════════ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let soundEngine;

const ensureAudio = async () => {
  if (!AudioCtx) return null;
  if (!soundEngine) soundEngine = new AudioCtx();
  if (soundEngine.state === 'suspended') {
    try { await soundEngine.resume(); } catch { return null; }
  }
  return soundEngine;
};

const playTone = async ({ frequency = 560, type = 'triangle', gain = 0.014, duration = 0.06 }) => {
  const ctx = await ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(amp); amp.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + duration);
};

/* Logo click tone */
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', () => {
    playTone({ frequency: 740, type: 'square', gain: 0.012, duration: 0.04 });
    setTimeout(() => playTone({ frequency: 540, type: 'square', gain: 0.01, duration: 0.04 }), 45);
  });
}

/* ── Hair-clipping burst + hover tone ────────────────────── */
const spawnClippings = (event) => {
  if (reduceMotion) return;
  const x = event.clientX || window.innerWidth * 0.5;
  const y = event.clientY || window.innerHeight * 0.5;
  for (let i = 0; i < 7; i++) {
    const chip = document.createElement('span');
    chip.className = 'clip-burst';
    chip.style.cssText = `left:${x}px;top:${y}px`;
    chip.style.setProperty('--x', `${(Math.random() - 0.5) * 30}px`);
    chip.style.setProperty('--y', `${Math.random() * -26 - 8}px`);
    chip.style.setProperty('--rot', `${Math.random() * 180}deg`);
    document.body.append(chip);
    chip.addEventListener('animationend', () => chip.remove(), { once: true });
  }
};

document.querySelectorAll('.btn, .floating-call, .nav-toggle').forEach(btn => {
  btn.addEventListener('pointerenter', () => {
    playTone({ frequency: 640 + Math.random() * 80, type: 'triangle', gain: 0.006, duration: 0.03 });
  });
  btn.addEventListener('click', spawnClippings);
});
