'use strict';

// ════════════════════════════════════════════════════════════════
//  Constants
// ════════════════════════════════════════════════════════════════
const CORRECT_PIN   = '2205';
const PETAL_COLORS  = ['#F2B5C0', '#C9A0B0', '#A8B89A', '#F7CDD5', '#D8B8C8', '#BFD4B4'];

// ════════════════════════════════════════════════════════════════
//  DOM references
// ════════════════════════════════════════════════════════════════
const page1      = document.getElementById('page1');
const page2      = document.getElementById('page2');
const note       = document.getElementById('note');
const pinHint    = document.getElementById('pin-hint');
const petalField = document.getElementById('petal-field');
const pinBoxes   = Array.from(document.querySelectorAll('.pin-box'));

// ════════════════════════════════════════════════════════════════
//  Floating background petals
// ════════════════════════════════════════════════════════════════
function spawnFloatingPetals(container, count) {
  for (let i = 0; i < count; i++) {
    const el     = document.createElement('div');
    el.className = 'fp';

    const isLily = Math.random() > 0.42;
    const size   = 5 + Math.random() * 9;
    const color  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

    el.style.setProperty('--left',  `${Math.random() * 100}%`);
    el.style.setProperty('--w',     `${size}px`);
    el.style.setProperty('--h',     `${isLily ? size * 2.3 : size + 2}px`);
    el.style.setProperty('--color', color);
    el.style.setProperty('--op',    `${0.4 + Math.random() * 0.38}`);
    el.style.setProperty('--dur',   `${10 + Math.random() * 12}s`);
    el.style.setProperty('--delay', `${-Math.random() * 20}s`);    // stagger so screen is filled immediately
    el.style.setProperty('--dx',    `${(Math.random() - 0.5) * 55}px`);
    el.style.setProperty('--spin',  `${(Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 200)}deg`);

    // Lily: teardrop / Gomphrena: circle
    el.style.setProperty('--br', isLily ? '50% 50% 40% 12%' : '50%');

    container.appendChild(el);
  }
}

spawnFloatingPetals(petalField, 24);

// ════════════════════════════════════════════════════════════════
//  PIN input logic
// ════════════════════════════════════════════════════════════════
pinBoxes.forEach((box, i) => {

  box.addEventListener('input', () => {
    const digit = box.value.replace(/\D/g, '');
    box.value   = digit ? digit[0] : '';

    if (digit) {
      box.classList.add('filled');
      box.classList.remove('wrong');

      // Auto-advance
      if (i < pinBoxes.length - 1) pinBoxes[i + 1].focus();

      // Check when all four filled
      const entered = pinBoxes.map(b => b.value).join('');
      if (entered.length === 4) evaluatePin(entered);

    } else {
      box.classList.remove('filled');
    }
  });

  box.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !box.value && i > 0) {
      pinBoxes[i - 1].value = '';
      pinBoxes[i - 1].classList.remove('filled', 'wrong');
      pinBoxes[i - 1].focus();
    }
  });

  // Support pasting a full 4-digit code
  box.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    text.split('').slice(0, 4).forEach((ch, j) => {
      if (pinBoxes[j]) {
        pinBoxes[j].value = ch;
        pinBoxes[j].classList.add('filled');
      }
    });
    const entered = pinBoxes.map(b => b.value).join('');
    if (entered.length === 4) evaluatePin(entered);
  });
});

// Auto-focus first box after a short delay (allows page fade-in to settle)
setTimeout(() => pinBoxes[0].focus(), 450);

// ── Evaluate PIN ────────────────────────────────────────────────
function evaluatePin(pin) {
  if (pin === CORRECT_PIN) {
    onCorrectPin();
  } else {
    onWrongPin();
  }
}

// ════════════════════════════════════════════════════════════════
//  Wrong PIN — shake + reset
// ════════════════════════════════════════════════════════════════
function onWrongPin() {
  pinBoxes.forEach(b => b.classList.add('wrong'));
  note.classList.add('shaking');
  pinHint.textContent = '✦ not quite... try again ✦';

  note.addEventListener('animationend', () => {
    note.classList.remove('shaking');
    pinBoxes.forEach(b => {
      b.value = '';
      b.classList.remove('filled', 'wrong');
    });
    pinBoxes[0].focus();

    setTimeout(() => {
      pinHint.textContent = '✦ tap a digit to begin ✦';
    }, 1600);
  }, { once: true });
}

// ════════════════════════════════════════════════════════════════
//  Correct PIN — petal burst → transition to Page 2
// ════════════════════════════════════════════════════════════════
function onCorrectPin() {
  // Lock inputs
  pinBoxes.forEach(b => b.setAttribute('disabled', ''));
  pinHint.textContent = '✦  ✦  ✦';

  // Burst petals from screen center
  burstPetals();

  // Fade Page 1 out and reveal Page 2
  setTimeout(() => {
    page1.style.transition = 'opacity 0.7s ease';
    page1.style.opacity    = '0';
  }, 820);

  setTimeout(() => {
    page1.classList.remove('active');
    page2.classList.add('active');
    initPage2();
  }, 1380);
}

// ════════════════════════════════════════════════════════════════
//  PAGE 2 — Developing Polaroid
// ════════════════════════════════════════════════════════════════
function initPage2() {
  spawnFloatingPetals(document.getElementById('petal-field-2'), 18);

  const frame   = document.getElementById('polaroid-frame');
  const content = document.getElementById('polaroid-content');
  const hint    = document.getElementById('tap-develop-hint');
  let developed = false;

  function develop() {
    if (developed) return;
    developed = true;

    hint.classList.add('hidden');
    frame.classList.add('developing');   // stops float animation
    content.classList.add('developed');  // triggers 2.6s filter transition

    // Auto-transition to Page 3 after develop clears + short pause
    setTimeout(goToPage3, 3500);         // 2.6s filter + ~0.9s pause
  }

  frame.addEventListener('click',    develop);
  frame.addEventListener('touchend', e => { e.preventDefault(); develop(); });
  frame.addEventListener('keydown',  e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); develop(); }
  });
}

function goToPage3() {
  const p2 = document.getElementById('page2');
  const p3 = document.getElementById('page3');
  p2.style.transition = 'opacity 0.75s ease';
  p2.style.opacity    = '0';
  setTimeout(() => {
    p2.classList.remove('active');
    p3.classList.add('active');
    initPage3();
  }, 620);
}

// ════════════════════════════════════════════════════════════════
//  PAGE 3 — Flower Bloom Transition
// ════════════════════════════════════════════════════════════════
// Rose color variants — predominantly white with the faintest warm-pink blush, zero purple
const ROSE_VARIANTS = [
  { o: '#FFFCFA', m: '#F8F0F2', i: '#F0E2E6', c: '#DEC0C8' }, // pure white
  { o: '#FFF8F8', m: '#F8ECF0', i: '#F0D8DF', c: '#D8B0BC' }, // white blush
  { o: '#FFFAF6', m: '#FAF0EC', i: '#F2E2DA', c: '#D8BAB0' }, // warm ivory
  { o: '#FFF0F4', m: '#F8E2E8', i: '#EDD0D8', c: '#D4A8B4' }, // light blush
  { o: '#FAF2F4', m: '#F4E4E8', i: '#EAD0D6', c: '#CCA8B0' }, // petal pink-white
  { o: '#F5C8D4', m: '#EAB4C0', i: '#DCAAB6', c: '#C07888' }, // accent pink (one variant only)
];

function initPage3() {
  const stage = document.getElementById('bloom-stage');
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Dense overlapping grid — cells smaller than flowers so nothing shows through
  const CW = 54, CH = 48;
  const cols = Math.ceil(W / CW) + 2;
  const rows = Math.ceil(H / CH) + 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Slight jitter per cell for organic positioning
      const x = (c - 0.5) * CW + (Math.random() - 0.5) * CW * 0.5;
      const y = (r - 0.5) * CH + (Math.random() - 0.5) * CH * 0.5;
      // Delay: bottom rows bloom first, top rows last (rising wave)
      const delay = ((rows - 1 - r) / rows) * 1.0 + Math.random() * 0.12;

      const roll = Math.random();
      let el;
      if      (roll < 0.58) el = createRose(x, y, delay);
      else if (roll < 0.82) el = createOpenLily(x, y, delay);
      else                  el = createSmallBlossom(x, y, delay);
      stage.appendChild(el);
    }
  }

  setTimeout(goToPage4, 3800);
}

/* Shared bloom-in-place animation: scale 0→1 with spring overshoot */
function applyBloom(el, delay, rot) {
  const dur = 0.42 + Math.random() * 0.26;
  el.style.transform  = `scale(0) rotate(${rot - 30}deg)`;
  el.style.opacity    = '0';
  el.style.transition =
    `transform ${dur}s cubic-bezier(0.34, 1.4, 0.64, 1) ${delay}s, ` +
    `opacity 0.18s ease ${delay}s`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = `scale(1) rotate(${rot}deg)`;
      el.style.opacity   = '1';
    });
  });
}

/* Multi-ring rose: 3 concentric petal rings + bud center */
function createRose(x, y, delay) {
  const el     = document.createElement('div');
  el.className = 'bloom-el';

  const size = 58 + Math.random() * 26;
  const v    = ROSE_VARIANTS[Math.floor(Math.random() * ROSE_VARIANTS.length)];
  const rot  = (Math.random() - 0.5) * 60;

  el.style.cssText = `
    position:absolute; left:${x - size/2}px; top:${y - size/2}px;
    width:${size}px; height:${size}px;
    will-change:transform,opacity;
    z-index:${1 + Math.floor(Math.random() * 4)};`;

  el.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none">
      <g transform="rotate(0   40 40)"><ellipse cx="40" cy="13" rx="11" ry="19" fill="${v.o}"/></g>
      <g transform="rotate(72  40 40)"><ellipse cx="40" cy="13" rx="11" ry="19" fill="${v.o}" opacity=".93"/></g>
      <g transform="rotate(144 40 40)"><ellipse cx="40" cy="13" rx="11" ry="19" fill="${v.o}"/></g>
      <g transform="rotate(216 40 40)"><ellipse cx="40" cy="13" rx="11" ry="19" fill="${v.o}" opacity=".93"/></g>
      <g transform="rotate(288 40 40)"><ellipse cx="40" cy="13" rx="11" ry="19" fill="${v.o}"/></g>
      <g transform="rotate(36  40 40)"><ellipse cx="40" cy="20" rx="9"  ry="14" fill="${v.m}"/></g>
      <g transform="rotate(108 40 40)"><ellipse cx="40" cy="20" rx="9"  ry="14" fill="${v.m}" opacity=".93"/></g>
      <g transform="rotate(180 40 40)"><ellipse cx="40" cy="20" rx="9"  ry="14" fill="${v.m}"/></g>
      <g transform="rotate(252 40 40)"><ellipse cx="40" cy="20" rx="9"  ry="14" fill="${v.m}" opacity=".93"/></g>
      <g transform="rotate(324 40 40)"><ellipse cx="40" cy="20" rx="9"  ry="14" fill="${v.m}"/></g>
      <g transform="rotate(18  40 40)"><ellipse cx="40" cy="27" rx="7"  ry="10" fill="${v.i}"/></g>
      <g transform="rotate(90  40 40)"><ellipse cx="40" cy="27" rx="7"  ry="10" fill="${v.i}"/></g>
      <g transform="rotate(162 40 40)"><ellipse cx="40" cy="27" rx="7"  ry="10" fill="${v.i}"/></g>
      <g transform="rotate(234 40 40)"><ellipse cx="40" cy="27" rx="7"  ry="10" fill="${v.i}"/></g>
      <g transform="rotate(306 40 40)"><ellipse cx="40" cy="27" rx="7"  ry="10" fill="${v.i}"/></g>
      <ellipse cx="40" cy="37" rx="9" ry="11" fill="${v.i}"/>
      <ellipse cx="40" cy="35" rx="6" ry="7"  fill="${v.c}"/>
      <circle  cx="40" cy="40" r="4.5"         fill="${v.c}" opacity=".85"/>
    </svg>`;

  applyBloom(el, delay, rot);
  return el;
}

/* Open lily: 6 long radiating petals with stamens */
function createOpenLily(x, y, delay) {
  const el     = document.createElement('div');
  el.className = 'bloom-el';

  const size = 50 + Math.random() * 22;
  const v    = ROSE_VARIANTS[Math.floor(Math.random() * ROSE_VARIANTS.length)];
  const rot  = (Math.random() - 0.5) * 60;

  el.style.cssText = `
    position:absolute; left:${x - size/2}px; top:${y - size/2}px;
    width:${size}px; height:${size}px;
    will-change:transform,opacity;
    z-index:${1 + Math.floor(Math.random() * 4)};`;

  el.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none">
      <g transform="rotate(0   40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.o}"/></g>
      <g transform="rotate(60  40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.m}"/></g>
      <g transform="rotate(120 40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.o}"/></g>
      <g transform="rotate(180 40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.m}"/></g>
      <g transform="rotate(240 40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.o}"/></g>
      <g transform="rotate(300 40 40)"><ellipse cx="40" cy="11" rx="9"  ry="21" fill="${v.m}"/></g>
      <line x1="40" y1="32" x2="26" y2="17" stroke="#A8B89A" stroke-width="1.4"/>
      <line x1="40" y1="32" x2="40" y2="14" stroke="#A8B89A" stroke-width="1.4"/>
      <line x1="40" y1="32" x2="54" y2="17" stroke="#A8B89A" stroke-width="1.4"/>
      <circle cx="26" cy="17" r="2.2" fill="#A8B89A"/>
      <circle cx="40" cy="14" r="2.2" fill="#A8B89A"/>
      <circle cx="54" cy="17" r="2.2" fill="#A8B89A"/>
      <circle cx="40" cy="40" r="6"   fill="${v.c}"/>
    </svg>`;

  applyBloom(el, delay, rot);
  return el;
}

/* Small 5-petal blossom — fills tight gaps between larger flowers */
function createSmallBlossom(x, y, delay) {
  const el     = document.createElement('div');
  el.className = 'bloom-el';

  const size = 32 + Math.random() * 18;
  const v    = ROSE_VARIANTS[Math.floor(Math.random() * ROSE_VARIANTS.length)];
  const rot  = (Math.random() - 0.5) * 60;

  el.style.cssText = `
    position:absolute; left:${x - size/2}px; top:${y - size/2}px;
    width:${size}px; height:${size}px;
    will-change:transform,opacity;
    z-index:${Math.floor(Math.random() * 3)};`;

  el.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 60 60" fill="none">
      <g transform="rotate(0   30 30)"><ellipse cx="30" cy="10" rx="8" ry="14" fill="${v.o}"/></g>
      <g transform="rotate(72  30 30)"><ellipse cx="30" cy="10" rx="8" ry="14" fill="${v.m}"/></g>
      <g transform="rotate(144 30 30)"><ellipse cx="30" cy="10" rx="8" ry="14" fill="${v.o}"/></g>
      <g transform="rotate(216 30 30)"><ellipse cx="30" cy="10" rx="8" ry="14" fill="${v.m}"/></g>
      <g transform="rotate(288 30 30)"><ellipse cx="30" cy="10" rx="8" ry="14" fill="${v.o}"/></g>
      <circle cx="30" cy="30" r="8"   fill="${v.c}"/>
      <circle cx="30" cy="30" r="4.5" fill="${v.i}"/>
    </svg>`;

  applyBloom(el, delay, rot);
  return el;
}

function goToPage4() {
  const p3 = document.getElementById('page3');
  const p4 = document.getElementById('page4');
  p3.style.transition = 'opacity 0.85s ease';
  p3.style.opacity    = '0';
  setTimeout(() => {
    p3.classList.remove('active');
    p4.classList.add('active');
    initPage4();
  }, 700);
}

// ════════════════════════════════════════════════════════════════
//  PAGE 4 — Scroll Journey
// ════════════════════════════════════════════════════════════════

// YouTube state
let _ytPlayer     = null;
let _ytUnmutePending = false;  // true once user has tapped begin

// Called once by YouTube SDK when it has loaded (script in <head>)
window.onYouTubeIframeAPIReady = function () {
  const vid = 'ZYBWv4vCZKI';
  _ytPlayer = new YT.Player('yt-player', {
    height: '1', width: '1',
    videoId: vid,
    // mute:1 + autoplay:1 — muted autoplay is allowed on iOS/Android
    // We unmute synchronously inside the tap gesture in beginPage4()
    playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: vid, controls: 0 },
    events: {
      onReady: (e) => {
        e.target.playVideo();
        // If user already tapped before player was ready, unmute now
        if (_ytUnmutePending) {
          e.target.unMute();
          e.target.setVolume(100);
        }
      },
    },
  });
};

function initPage4() {
  spawnFloatingPetals(document.getElementById('petal-field-4'), 16);
  initHeroWords();
  initScrollFades();
  initMapObserver();
  setTimeout(() => {
    document.querySelectorAll('.scratch-canvas').forEach(initScratchCanvas);
  }, 300);

  const btn = document.getElementById('p4-begin-btn');
  btn.addEventListener('click',    beginPage4);
  btn.addEventListener('touchend', e => { e.preventDefault(); beginPage4(); });
}

// ── Tap-to-begin ─────────────────────────────────────────────────
function beginPage4() {
  const overlay = document.getElementById('p4-begin');
  overlay.style.transition = 'opacity 0.7s ease';
  overlay.style.opacity    = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 700);

  document.getElementById('music-widget').classList.add('visible');

  // Restart from 0 then unmute synchronously inside tap gesture — iOS requires this
  _ytUnmutePending = true;
  if (_ytPlayer && typeof _ytPlayer.unMute === 'function') {
    _ytPlayer.seekTo(0, true);
    _ytPlayer.unMute();
    _ytPlayer.setVolume(100);
    _ytPlayer.playVideo();
  }
  // If player not ready yet, onReady will call unMute() via _ytUnmutePending
}

// ── Hero word-by-word reveal ─────────────────────────────────────
function initHeroWords() {
  const words = document.querySelectorAll('#hero-words .hero-word');
  const date  = document.getElementById('hero-date');
  words.forEach((w, i) => setTimeout(() => w.classList.add('visible'), 300 + i * 420));
  setTimeout(() => date.classList.add('visible'), 300 + words.length * 420 + 150);
}

// ── Scroll fade-ups (IntersectionObserver on page4 container) ────
function initScrollFades() {
  const page4 = document.getElementById('page4');
  const obs   = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { root: page4, threshold: 0.14 });
  document.querySelectorAll('#page4 .fade-up').forEach(el => obs.observe(el));
}


function initScratchCanvas(canvas) {
  const win = canvas.parentElement;   // .scratch-window
  const w   = win.offsetWidth  || 230;
  const h   = win.offsetHeight || 230;
  canvas.width  = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Soft gradient scratch layer
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0,   '#F8DCEA');
  g.addColorStop(0.5, '#EEC4D8');
  g.addColorStop(1,   '#B8C8B0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Hint text
  ctx.fillStyle    = 'rgba(255,255,255,0.52)';
  ctx.font         = `italic ${Math.round(w * 0.09)}px 'Playfair Display', Georgia, serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('scratch ✦', w / 2, h / 2);

  let drawing = false, count = 0, revealed = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    if (++count % 16 === 0 && !revealed) {
      const d = ctx.getImageData(0, 0, w, h).data;
      let t = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 128) t++;
      if (t / (w * h) > 0.55) {
        revealed = true;
        canvas.style.transition = 'opacity 0.6s ease';
        canvas.style.opacity    = '0';
      }
    }
  }

  canvas.addEventListener('mousedown',  e => { drawing = true;  const p = getPos(e); scratch(p.x, p.y); });
  canvas.addEventListener('mousemove',  e => { if (drawing) { const p = getPos(e); scratch(p.x, p.y); } });
  canvas.addEventListener('mouseup',    () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true;  const p = getPos(e); scratch(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (drawing) { const p = getPos(e); scratch(p.x, p.y); } }, { passive: false });
  canvas.addEventListener('touchend',   () => drawing = false);
}

// ── Memory map (lazy-init when section D enters view) ────────────
function initMapObserver() {
  const page4 = document.getElementById('page4');
  let done    = false;
  const obs   = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      obs.disconnect();
      initLeafletMap();
    }
  }, { root: page4, threshold: 0.08 });
  obs.observe(document.getElementById('s-map'));
}

function initLeafletMap() {
  // ── REPLACE: your memory location coordinates [lat, lng] ──────
  const COORDS = [3.1390, 101.6869];

  const map = L.map('memory-map', {
    center: COORDS, zoom: 15,
    zoomControl: false, scrollWheelZoom: false, dragging: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
    subdomains: 'abcd', maxZoom: 19,
  }).addTo(map);

  const icon = L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:linear-gradient(135deg,#F2B5C0,#C9A0B0);
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 3px 12px rgba(201,160,176,0.55)"></div>`,
    className: '', iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-34],
  });

  L.marker(COORDS, { icon }).addTo(map).bindPopup(`
    <div class="map-popup">
      <img src="[MEMORY_PHOTO]" alt="" onerror="this.style.display='none'">
      <div class="map-popup-title">[MEMORY_LOCATION_NAME]</div>
      <div class="map-popup-caption">[MEMORY_CAPTION]</div>
    </div>`, { maxWidth: 210 });
}

// ════════════════════════════════════════════════════════════════
//  Petal burst animation
// ════════════════════════════════════════════════════════════════
function burstPetals() {
  const cx    = window.innerWidth  / 2;
  const cy    = window.innerHeight / 2;
  const count = 44;

  for (let i = 0; i < count; i++) {
    const el     = document.createElement('div');
    el.className = 'burst-petal';

    const isLily = Math.random() > 0.38;
    const size   = 7 + Math.random() * 14;
    const color  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

    // Spread angle with a little jitter so petals don't perfectly fan
    const angle  = (i / count) * 360 + (Math.random() * 16 - 8);
    const dist   = 80 + Math.random() * 220;
    const rad    = angle * (Math.PI / 180);
    const tx     = Math.cos(rad) * dist;
    const ty     = Math.sin(rad) * dist;
    const endRot = (Math.random() - 0.5) * 520;
    const dur    = 0.6 + Math.random() * 0.55;

    // Set initial state (at center, full opacity)
    el.style.cssText = `
      left:    ${cx}px;
      top:     ${cy}px;
      width:   ${size}px;
      height:  ${isLily ? size * 2.2 : size}px;
      background: ${color};
      border-radius: ${isLily ? '50% 50% 38% 12%' : '50%'};
      transform: translate(-50%, -50%) rotate(0deg);
      opacity: 1;
      transition:
        transform ${dur}s     cubic-bezier(0.22, 1, 0.36, 1),
        opacity   ${dur+0.18}s ease;
    `;

    document.body.appendChild(el);

    // Two rAF frames ensures the initial styles are painted before
    // the transition-triggering styles are applied
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${endRot}deg) scale(0.08)`;
        el.style.opacity   = '0';
      });
    });

    setTimeout(() => el.remove(), (dur + 0.25) * 1000);
  }
}
