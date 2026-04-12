/* ═══════════════════════════════════════════════════════════
   Hidden easter egg — Lady Liberty Haircut
   Trigger: click the logo 5× within 3 seconds
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Trigger — single click on the header logo ───────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    logo.addEventListener('click', (e) => {
      e.preventDefault();
      launchGame();
    });
  });

  /* ── Inject keyframes once ────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes hairFall {
      0%   { opacity: .85; transform: translate(0, 0) rotate(0deg); }
      100% { opacity: 0;   transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
    }
    #liberty-game * { box-sizing: border-box; }
    #liberty-game canvas { display: block; touch-action: none; }
  `;
  document.head.appendChild(styleEl);

  /* ── Game launcher ────────────────────────────────────────── */
  let gameActive = false;

  const launchGame = () => {
    if (gameActive) return;
    gameActive = true;

    /* Overlay */
    const overlay = document.createElement('div');
    overlay.id = 'liberty-game';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9000',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: '0', transition: 'opacity 380ms ease',
    });

    /* Close button */
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '1.25rem', right: '1.5rem',
      background: 'none', border: 'none',
      color: 'rgba(255,255,255,0.3)', fontSize: '2rem',
      lineHeight: '1', padding: '.5rem', zIndex: '1',
      transition: 'color 150ms',
    });
    closeBtn.addEventListener('mouseover', () => { closeBtn.style.color = 'rgba(255,255,255,0.8)'; });
    closeBtn.addEventListener('mouseout',  () => { closeBtn.style.color = 'rgba(255,255,255,0.3)'; });

    /* Canvas — scale to fit viewport */
    const IMG_W   = 1173;
    const IMG_H   = 896;
    const maxW    = Math.min(window.innerWidth  * 0.88, 680);
    const maxH    = window.innerHeight * 0.78;
    const scale   = Math.min(maxW / IMG_W, maxH / IMG_H);
    const canvas  = document.createElement('canvas');
    canvas.width  = Math.round(IMG_W * scale);
    canvas.height = Math.round(IMG_H * scale);

    /* Progress row */
    const progressRow = document.createElement('div');
    Object.assign(progressRow.style, {
      marginTop: '1rem',
      width: canvas.width + 'px', maxWidth: '88vw',
      display: 'flex', alignItems: 'center', gap: '.85rem',
    });

    const label = document.createElement('span');
    Object.assign(label.style, {
      fontFamily: "'DM Mono', monospace",
      fontSize: '.7rem', letterSpacing: '.1em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
      whiteSpace: 'nowrap', transition: 'color 600ms',
    });
    label.textContent = '0% cut';

    const barWrap = document.createElement('div');
    Object.assign(barWrap.style, {
      flex: '1', height: '1px',
      background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    });
    const barFill = document.createElement('div');
    Object.assign(barFill.style, {
      height: '100%', width: '0%',
      background: '#B82030', transition: 'width 200ms ease',
    });
    barWrap.appendChild(barFill);
    progressRow.appendChild(label);
    progressRow.appendChild(barWrap);

    /* Completion message */
    const done = document.createElement('p');
    Object.assign(done.style, {
      position: 'absolute', bottom: '2.5rem',
      fontFamily: "'DM Serif Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
      color: '#fff', opacity: '0',
      transition: 'opacity 1.2s ease',
      letterSpacing: '-0.02em', pointerEvents: 'none',
      userSelect: 'none',
    });
    done.textContent = 'Leave a brand new man.';

    overlay.appendChild(closeBtn);
    overlay.appendChild(canvas);
    overlay.appendChild(progressRow);
    overlay.appendChild(done);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    /* ── Canvas setup ─────────────────────────────────────── */
    const ctx   = canvas.getContext('2d');
    const BRUSH = Math.max(10, Math.round(18 * scale));

    let hairPixels   = 0;
    let cutPixels    = 0;
    let completed    = false;
    let isPainting   = false;
    let lastCutPos   = null;

    const img = new Image();
    img.src   = './liberty_icon.png';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /* Count non-black pixels in the "cuttable" zone
         (exclude bottom 15% — that's the collar/torso, not hair) */
      const id   = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = id.data;
      const zoneH = Math.round(canvas.height * 0.85);
      for (let y = 0; y < zoneH; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if ((data[i] + data[i+1] + data[i+2]) / 3 > 28) hairPixels++;
        }
      }
    };

    /* ── No-cut zones (face + neck) — normalized 0–1 coords ─ */
    /*    Tuned against the 1173×896 liberty_icon.png          */
    const NO_CUT_ZONES = [
      { cx: 0.435, cy: 0.600, rx: 0.145, ry: 0.230 }, /* face   */
      { cx: 0.440, cy: 0.840, rx: 0.110, ry: 0.110 }, /* neck   */
    ];

    const isProtected = (cx, cy) => {
      const nx = cx / canvas.width;
      const ny = cy / canvas.height;
      return NO_CUT_ZONES.some(z => {
        const dx = (nx - z.cx) / z.rx;
        const dy = (ny - z.cy) / z.ry;
        return dx * dx + dy * dy <= 1;
      });
    };

    /* ── Cut action ───────────────────────────────────────── */
    const cut = (clientX, clientY) => {
      const rect  = canvas.getBoundingClientRect();
      const cx    = (clientX - rect.left) * (canvas.width  / rect.width);
      const cy    = (clientY - rect.top)  * (canvas.height / rect.height);

      /* Block erasing on the face / neck */
      if (isProtected(cx, cy)) return;

      /* Skip if barely moved (avoid re-counting still pixels) */
      if (lastCutPos) {
        const dx = cx - lastCutPos.x, dy = cy - lastCutPos.y;
        if (dx * dx + dy * dy < 4) return;
      }
      lastCutPos = { x: cx, y: cy };

      /* Erase pixels */
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, BRUSH, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      spawnClippings(clientX, clientY);
      playSnip();

      if (!completed) trackProgress(cx, cy);
    };

    /* ── Progress tracking ────────────────────────────────── */
    const trackProgress = (cx, cy) => {
      const r    = BRUSH;
      const x0   = Math.max(0, Math.floor(cx - r));
      const y0   = Math.max(0, Math.floor(cy - r));
      const x1   = Math.min(canvas.width,  Math.ceil(cx + r));
      const y1   = Math.min(canvas.height, Math.ceil(cy + r));
      const id   = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
      const data = id.data;

      /* Count transparent pixels in this brush area */
      let erased = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 10) erased++;
      }

      cutPixels = Math.min(cutPixels + erased * 0.6, hairPixels);
      const pct = hairPixels > 0
        ? Math.min(Math.round((cutPixels / hairPixels) * 100), 100)
        : 0;

      label.textContent     = `${pct}% cut`;
      barFill.style.width   = `${pct}%`;

      if (pct >= 55 && !completed) {
        completed             = true;
        done.style.opacity    = '1';
        label.style.color     = 'rgba(184, 32, 48, 0.85)';
      }
    };

    /* ── Mouse events ─────────────────────────────────────── */
    canvas.addEventListener('mousedown', (e) => { isPainting = true; cut(e.clientX, e.clientY); });
    canvas.addEventListener('mousemove', (e) => { if (isPainting) cut(e.clientX, e.clientY); });
    canvas.addEventListener('mouseup',   ()  => { isPainting = false; lastCutPos = null; });
    canvas.addEventListener('mouseleave',()  => { isPainting = false; lastCutPos = null; });

    /* Touch events */
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); isPainting = true;
      cut(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); if (isPainting) cut(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { isPainting = false; lastCutPos = null; });

    /* ── Close ────────────────────────────────────────────── */
    const close = () => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); gameActive = false; }, 400);
    };
    closeBtn.addEventListener('click', close);
    const escHandler = (e) => {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  };

  /* ── Hair clipping particles ──────────────────────────────── */
  const spawnClippings = (x, y) => {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const w  = 4 + Math.random() * 7;
      const h  = 1 + Math.random() * 1.5;
      const l  = 70 + Math.random() * 22;  /* lightness — gray hair tones */
      Object.assign(el.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: '9999',
        width: `${w}px`, height: `${h}px`,
        borderRadius: '999px',
        background: `hsl(30, 8%, ${l}%)`,
        left: `${x}px`, top: `${y}px`,
        opacity: '0',
        animation: `hairFall ${0.55 + Math.random() * 0.5}s ease-out forwards`,
      });
      el.style.setProperty('--dx',  `${(Math.random() - 0.5) * 44}px`);
      el.style.setProperty('--dy',  `${18 + Math.random() * 55}px`);
      el.style.setProperty('--rot', `${Math.random() * 300}deg`);
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  };

  /* ── Scissors snip sound ──────────────────────────────────── */
  const AudioCtx   = window.AudioContext || window.webkitAudioContext;
  let gameAudioCtx = null;
  let lastSnip     = 0;

  const playSnip = async () => {
    const now = Date.now();
    if (now - lastSnip < 75) return;
    lastSnip = now;
    if (!AudioCtx) return;
    if (!gameAudioCtx) gameAudioCtx = new AudioCtx();
    if (gameAudioCtx.state === 'suspended') {
      try { await gameAudioCtx.resume(); } catch { return; }
    }
    const ac   = gameAudioCtx;
    const t    = ac.currentTime;
    const buf  = ac.createBuffer(1, ac.sampleRate * 0.075, ac.sampleRate);
    const data = buf.getChannelData(0);

    /* Shaped white noise — scissors snip timbre */
    for (let i = 0; i < data.length; i++) {
      const env = Math.pow(1 - i / data.length, 1.8);
      data[i]   = (Math.random() * 2 - 1) * env;
    }

    const src    = ac.createBufferSource();
    src.buffer   = buf;

    const hpf         = ac.createBiquadFilter();
    hpf.type          = 'highpass';
    hpf.frequency.value = 2800 + Math.random() * 600;

    const bpf         = ac.createBiquadFilter();
    bpf.type          = 'bandpass';
    bpf.frequency.value = 4200 + Math.random() * 800;
    bpf.Q.value       = 1.4;

    const gain        = ac.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

    src.connect(hpf); hpf.connect(bpf); bpf.connect(gain); gain.connect(ac.destination);
    src.start(t);
  };

})();
