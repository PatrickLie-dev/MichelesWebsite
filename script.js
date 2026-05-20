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
  }, 620);
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
