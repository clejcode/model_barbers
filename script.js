/* MODEL BARBERS — script.js
   Live hours, scissors cursor, and a scroll-linked barber pole.
   No smooth-scroll hijacking. Motion stays behind prefers-reduced-motion. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsView = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

document.documentElement.classList.add('js');
if (!supportsView) document.documentElement.classList.add('no-view');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ── Live open / closed — America/New_York ─────────────────
   Mon–Fri 9:00–19:00, Sat 9:00–18:00, Sunday closed. */
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

/* ── Mobile nav ───────────────────────────────────────────── */
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navOverlay = document.getElementById('nav-overlay');

const setNav = (open) => {
  if (!navOverlay || !navToggle) return;
  navOverlay.classList.toggle('open', open);
  navOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
};

if (navToggle && navOverlay) {
  navToggle.addEventListener('click', () => {
    setNav(!navOverlay.classList.contains('open'));
  });
  navOverlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNav(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navOverlay.classList.contains('open')) setNav(false);
  });
}

/* Floating call only after the opening block has left the screen. */
const floatingCall = document.querySelector('.floating-call');
const openingBlock = document.querySelector('.hero, .about-intro, .page-intro');
if (floatingCall && openingBlock && 'IntersectionObserver' in window) {
  const floatObs = new IntersectionObserver(([entry]) => {
    floatingCall.classList.toggle('is-shown', !entry.isIntersecting);
  });
  floatObs.observe(openingBlock);
}

/* ── One frame loop: pole velocity + marquee + slim header ─
   Scroll speed is sampled once per frame. Velocity eases toward
   that speed, then decays, so the pole coasts instead of jittering. */
const stripeTrack = document.querySelector('.top-stripe-track');
const marqueeTrack = document.getElementById('marquee-track');
const TILE = 40;

if (!reduceMotion && (stripeTrack || marqueeTrack || header)) {
  let lastY = window.scrollY;
  let vel = 0;
  let target = 0;
  let stripePos = 0;
  let marqueePos = 0;
  let loopW = 0;
  let headerSlim = false;

  const measureMarquee = () => {
    const first = marqueeTrack && marqueeTrack.querySelector('.marquee-content');
    loopW = first ? first.offsetWidth : 0;
  };
  measureMarquee();
  window.addEventListener('resize', measureMarquee);

  const tick = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;

    const desired = Math.max(-14, Math.min(14, dy * 0.62));
    target += (desired - target) * 0.28;
    target *= 0.9;
    vel += (target - vel) * 0.18;

    if (Math.abs(vel) < 0.02 && Math.abs(target) < 0.02 && dy === 0) {
      vel = 0;
      target = 0;
    }

    if (stripeTrack) {
      stripePos += vel;
      stripePos = ((stripePos % TILE) + TILE) % TILE;
      stripeTrack.style.transform = `translate3d(${stripePos.toFixed(3)}px,0,0)`;
    }

    if (marqueeTrack && loopW > 0) {
      const speed = 0.35 + Math.min(Math.abs(vel), 12) * 0.08;
      marqueePos -= speed;
      if (Math.abs(marqueePos) >= loopW) marqueePos += loopW;
      marqueeTrack.style.transform = `translate3d(${marqueePos.toFixed(3)}px,0,0)`;
    }

    if (header) {
      const slim = y > 40;
      if (slim !== headerSlim) {
        headerSlim = slim;
        header.classList.toggle('slim', slim);
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else if (header) {
  const onScroll = () => header.classList.toggle('slim', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Fallbacks when scroll-driven timelines are missing ──── */
if (!reduceMotion && !supportsView && 'IntersectionObserver' in window) {
  const clipObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-open');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.photo-frame').forEach((el) => clipObs.observe(el));

  const rowObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.ledger, .menu').forEach((el) => rowObs.observe(el));

  const fanObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-straight');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-fan]').forEach((el) => fanObs.observe(el));
}

/* ── Scissors cursor ──────────────────────────────────────── */
const root = document.documentElement;
const setSnip = (on) => root.classList.toggle('snipping', on);
document.addEventListener('pointerdown', () => setSnip(true));
document.addEventListener('pointerup', () => setSnip(false));
document.addEventListener('pointercancel', () => setSnip(false));
window.addEventListener('blur', () => setSnip(false));

/* A few paper flecks when a button is clicked. No hover noise. */
const spawnClippings = (event) => {
  if (reduceMotion) return;
  const x = event.clientX ?? window.innerWidth * 0.5;
  const y = event.clientY ?? window.innerHeight * 0.5;
  for (let i = 0; i < 4; i += 1) {
    const chip = document.createElement('span');
    chip.className = 'clip-burst';
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;
    chip.style.setProperty('--x', `${(Math.random() - 0.5) * 26}px`);
    chip.style.setProperty('--y', `${Math.random() * -18 - 6}px`);
    chip.style.setProperty('--rot', `${Math.random() * 160}deg`);
    document.body.append(chip);
    chip.addEventListener('animationend', () => chip.remove(), { once: true });
  }
};
document.querySelectorAll('.btn, .floating-call').forEach((btn) => {
  btn.addEventListener('click', spawnClippings);
});

/* Illustrated plate first. The embed loads only on request. */
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
    slot.append(frame);
    slot.classList.add('is-live');
    if (art) art.hidden = true;
    mapButton.disabled = true;
    mapButton.textContent = 'Map loaded';
  });
}
