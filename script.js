const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#main-nav');
const navAnchors = document.querySelectorAll('.nav-links a');
const copyPhoneButton = document.querySelector('#copy-phone');
const copyFeedback = document.querySelector('#copy-feedback');
const yearNode = document.querySelector('#year');
const logo = document.querySelector('.logo');
const actionButtons = document.querySelectorAll('.btn, .floating-call, .nav-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const topStripeTrack = document.querySelector('.top-stripe-track');
let stripeScrollTimeout;

const triggerStripeScroll = () => {
  if (!topStripeTrack) return;
  topStripeTrack.classList.add('is-scrolling');
  window.clearTimeout(stripeScrollTimeout);
  stripeScrollTimeout = window.setTimeout(() => {
    topStripeTrack.classList.remove('is-scrolling');
  }, 140);
};

window.addEventListener('scroll', triggerStripeScroll, { passive: true });

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navAnchors.forEach((anchor) => {
    anchor.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (copyPhoneButton && copyFeedback) {
  copyPhoneButton.addEventListener('click', async () => {
    const phone = '(718) 387-9487';

    try {
      await navigator.clipboard.writeText(phone);
      copyFeedback.textContent = 'Phone number copied.';
    } catch {
      copyFeedback.textContent = 'Copy failed. Please dial (718) 387-9487.';
    }

    window.setTimeout(() => {
      copyFeedback.textContent = '';
    }, 2000);
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const snipRoot = document.documentElement;

const setSnipping = (isSnipping) => {
  snipRoot.classList.toggle('snipping', isSnipping);
};

document.addEventListener('mousedown', () => setSnipping(true));
document.addEventListener('mouseup', () => setSnipping(false));
document.addEventListener('mouseleave', () => setSnipping(false));
window.addEventListener('blur', () => setSnipping(false));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    setSnipping(false);
  }
});

const audioContext = window.AudioContext || window.webkitAudioContext;
let soundEngine;

const ensureAudio = async () => {
  if (!audioContext) return null;
  if (!soundEngine) {
    soundEngine = new audioContext();
  }
  if (soundEngine.state === 'suspended') {
    try {
      await soundEngine.resume();
    } catch {
      return null;
    }
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
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

if (logo) {
  logo.addEventListener('click', () => {
    playTone({ frequency: 740, type: 'square', gain: 0.012, duration: 0.04 });
    window.setTimeout(() => {
      playTone({ frequency: 540, type: 'square', gain: 0.01, duration: 0.04 });
    }, 45);
  });
}

const spawnClippings = (event) => {
  if (reduceMotion) return;
  const total = 7;
  const x = event.clientX || window.innerWidth * 0.5;
  const y = event.clientY || window.innerHeight * 0.5;

  for (let i = 0; i < total; i += 1) {
    const chip = document.createElement('span');
    chip.className = 'clip-burst';
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;
    chip.style.setProperty('--x', `${(Math.random() - 0.5) * 28}px`);
    chip.style.setProperty('--y', `${Math.random() * -24 - 8}px`);
    chip.style.setProperty('--rot', `${Math.random() * 180}deg`);
    document.body.append(chip);
    chip.addEventListener('animationend', () => chip.remove(), { once: true });
  }
};

actionButtons.forEach((button) => {
  button.addEventListener('pointerenter', () => {
    playTone({ frequency: 640 + Math.random() * 80, type: 'triangle', gain: 0.006, duration: 0.03 });
  });

  button.addEventListener('click', (event) => {
    spawnClippings(event);
  });
});
