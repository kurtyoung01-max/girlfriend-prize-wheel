const PASSWORD = 'Jukian84!';
const STORAGE_KEY = 'girlfriendPrizeWheelState.v1';

const prizes = [
  { name: 'Takeaway & Movie Night', line: 'Home date night. Your favourite takeaway, a film, and zero judgement for blanket hogging.' },
  { name: 'Dinner & Movie Out', line: 'Popcorn tax applies. Complaints department is closed.' },
  { name: 'Surprise Picnic', line: 'Location secret. Snack quality taken extremely seriously.' },
  { name: 'Surprise Present', line: 'A mystery gift. No, you cannot interrogate the goblin.' },
  { name: 'Night Away', line: 'Tiny escape unlocked. Bags packed, adulting ignored.' },
  { name: '3 Free Massages', line: 'Terms: I may sigh dramatically, but service will be delivered.' },
  { name: 'Breakfast in Bed', line: 'Crumbs included at no extra charge.' },
  { name: 'Coffee Walk Date', line: 'A stroll, caffeine, and pretending we are outdoorsy influencers.' },
  { name: 'No-Phone Dinner', line: 'Just us. The internet can survive without our nonsense for one meal.' },
  { name: 'You Pick The Movie', line: 'No complaints. Even if it has subtitles, dragons, or feelings.' },
  { name: 'Cocktail Night', line: 'Homemade cocktails. Professional garnish confidence, amateur measurements.' },
  { name: 'Sunset Date', line: 'Golden hour romance. Wind hair chaos likely.' },
  { name: 'Lazy Sunday Adventure', line: 'Low effort, high snacks, excellent vibes.' },
  { name: 'Blanket Fort Takeaway', line: 'Architecture degree not required. Snacks mandatory.' },
  { name: 'Mystery Day Trip', line: 'Destination unknown. Playlist probably suspicious.' },
  { name: 'Fancy Dessert Run', line: 'Dinner is optional. Dessert is leadership.' },
  { name: 'Chore-Free Day', line: 'One day off from boring house stuff. The goblin has spoken.' },
  { name: 'Homemade Dinner', line: 'Cooked with love and only mild panic.' },
  { name: 'Spa Night At Home', line: 'Robes, face masks, and cucumber behaviour.' },
  { name: 'One Yes Day', line: 'Within reason. We are cute, not legally reckless.' },
  { name: 'Handwritten Letter', line: 'Old-school romance. Actual handwriting. Brace yourself.' },
  { name: 'Surprise Flowers', line: 'Florals incoming. Hay fever not included.' },
  { name: 'Walk & Brunch', line: 'Exercise followed by carbs. Balance restored.' },
  { name: 'Stargazing Date', line: 'Stars, snacks, and pretending we know constellations.' },
  { name: 'Board Games & Snacks', line: 'Cute night. Competitive behaviour may occur.' }
];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const littleMan = document.getElementById('littleMan');
const statusText = document.getElementById('statusText');
const ticket = document.getElementById('ticket');
const prizeName = document.getElementById('prizeName');
const prizeLine = document.getElementById('prizeLine');
const closeTicket = document.getElementById('closeTicket');
const lockedCard = document.getElementById('lockedCard');
const lockedMessage = document.getElementById('lockedMessage');
const lastPrizeText = document.getElementById('lastPrizeText');
const adminPanel = document.getElementById('adminPanel');
const passwordDialog = document.getElementById('passwordDialog');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');
const secretHeart = document.getElementById('secretHeart');
const titleTap = document.getElementById('titleTap');
const confetti = document.getElementById('confetti');

let rotation = 0;
let spinning = false;
let testMode = true; // Temporary testing build: unlimited spins enabled
let titleTapCount = 0;
let drag = null;

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadState(), ...next }));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthText() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function hasSpunThisMonth() {
  return loadState().lastSpinMonth === monthKey();
}

function drawWheel() {
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;
  const slice = (Math.PI * 2) / prizes.length;
  const colours = ['#ff7aa8', '#ffd166', '#8bd3ff', '#b8f2c2', '#f7a8ff', '#fff2a8'];

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  prizes.forEach((prize, i) => {
    const start = i * slice;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colours[i % colours.length];
    ctx.fill();
    ctx.strokeStyle = '#34212a';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#34212a';
    ctx.font = '800 25px system-ui, sans-serif';
    wrapText(prize.name, radius - 24, 8, 145, 24);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8ed';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#34212a';
  ctx.stroke();
  ctx.font = '900 38px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♥', 0, 2);
  ctx.restore();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  lines.push(line);
  lines.slice(0, 2).forEach((l, idx) => ctx.fillText(l, x, y + idx * lineHeight));
}

function setLockedView() {
  const state = loadState();
  if (!hasSpunThisMonth() || testMode) {
    lockedCard.classList.add('hidden');
    return;
  }
  lockedMessage.textContent = `Nice try, prize goblin. Come back on ${nextMonthText()}.`;
  lastPrizeText.textContent = state.lastPrize ? `Last prize: ${state.lastPrize.name}` : '';
  lockedCard.classList.remove('hidden');
  statusText.textContent = 'The monthly romance economy is currently closed.';
}

function spinWheel(force = false) {
  if (spinning) return;
  if (!force && !testMode && hasSpunThisMonth()) {
    setLockedView();
    wobbleMan();
    return;
  }

  spinning = true;
  lockedCard.classList.add('hidden');
  ticket.classList.add('hidden');
  statusText.textContent = 'Spinning. Romance bureaucracy in progress.';
  vibrate(20);

  const winningIndex = Math.floor(Math.random() * prizes.length);
  const slice = (Math.PI * 2) / prizes.length;
  const pointerAngle = -Math.PI / 2;
  const targetAngle = pointerAngle - (winningIndex * slice + slice / 2);
  const extraTurns = (Math.PI * 2) * (5 + Math.floor(Math.random() * 3));
  const startRotation = rotation;
  const endRotation = startRotation + extraTurns + normalizeAngle(targetAngle - startRotation);
  const duration = 4300;
  const startTime = performance.now();

  function animate(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    rotation = startRotation + (endRotation - startRotation) * eased;
    drawWheel();

    if (t < 1) requestAnimationFrame(animate);
    else {
      rotation = endRotation % (Math.PI * 2);
      drawWheel();
      revealPrize(winningIndex);
      spinning = false;
    }
  }

  requestAnimationFrame(animate);
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  while (angle < 0) angle += twoPi;
  while (angle >= twoPi) angle -= twoPi;
  return angle;
}

function revealPrize(index) {
  const prize = prizes[index];
  prizeName.textContent = prize.name;
  prizeLine.textContent = prize.line;
  ticket.classList.remove('hidden');
  burstConfetti();
  vibrate([30, 50, 30]);

  if (!testMode) {
    saveState({
      lastSpinDate: new Date().toISOString(),
      lastSpinMonth: monthKey(),
      lastPrize: prize,
      history: [...(loadState().history || []), { date: new Date().toISOString(), prize }].slice(-24)
    });
  }
  statusText.textContent = 'Ticket issued. Romance law is binding.';
}

function burstConfetti() {
  confetti.innerHTML = '';
  const colours = ['#ff7aa8', '#ffd166', '#8bd3ff', '#b8f2c2', '#f7a8ff'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-10 - Math.random() * 30}px`;
    piece.style.background = colours[i % colours.length];
    piece.style.animationDelay = `${Math.random() * .25}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.appendChild(piece);
  }
  setTimeout(() => confetti.innerHTML = '', 2300);
}

function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function wobbleMan() {
  littleMan.animate([
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(-12deg)' },
    { transform: 'rotate(12deg)' },
    { transform: 'rotate(0deg)' }
  ], { duration: 420, easing: 'ease-in-out' });
}

function resetMan() {
  littleMan.style.position = '';
  littleMan.style.left = '';
  littleMan.style.top = '';
  littleMan.style.transform = '';
  littleMan.classList.remove('dragging', 'flying');
}

function rectsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

littleMan.addEventListener('pointerdown', (event) => {
  if (spinning) return;
  littleMan.setPointerCapture(event.pointerId);
  const r = littleMan.getBoundingClientRect();
  drag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - r.left,
    offsetY: event.clientY - r.top,
    lastX: event.clientX,
    lastY: event.clientY,
    vx: 0,
    vy: 0,
    lastT: performance.now()
  };
  littleMan.classList.add('dragging');
  littleMan.style.position = 'fixed';
  littleMan.style.left = `${r.left}px`;
  littleMan.style.top = `${r.top}px`;
});

littleMan.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const now = performance.now();
  const dt = Math.max(16, now - drag.lastT);
  drag.vx = (event.clientX - drag.lastX) / dt;
  drag.vy = (event.clientY - drag.lastY) / dt;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.lastT = now;
  littleMan.style.left = `${event.clientX - drag.offsetX}px`;
  littleMan.style.top = `${event.clientY - drag.offsetY}px`;
});

littleMan.addEventListener('pointerup', (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const start = littleMan.getBoundingClientRect();
  littleMan.classList.remove('dragging');
  littleMan.classList.add('flying');

  const wheel = canvas.getBoundingClientRect();
  const wheelCenterX = wheel.left + wheel.width / 2;
  const wheelCenterY = wheel.top + wheel.height / 2;
  const manCenterX = start.left + start.width / 2;
  const manCenterY = start.top + start.height / 2;
  const dx = wheelCenterX - manCenterX;
  const dy = wheelCenterY - manCenterY;

  const velocityBoost = Math.min(1.4, Math.hypot(drag.vx, drag.vy) * 0.26);
  const endX = start.left + dx * (0.82 + velocityBoost * 0.12);
  const endY = start.top + dy * (0.82 + velocityBoost * 0.12);

  littleMan.animate([
    { left: `${start.left}px`, top: `${start.top}px`, transform: 'rotate(0deg) scale(1)' },
    { left: `${endX}px`, top: `${endY}px`, transform: 'rotate(380deg) scale(.92)' }
  ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => {
    littleMan.style.left = `${endX}px`;
    littleMan.style.top = `${endY}px`;
    const hit = rectsOverlap(littleMan.getBoundingClientRect(), canvas.getBoundingClientRect());
    if (hit) {
      statusText.textContent = 'Direct hit. Tiny Cupid has committed to the bit.';
      spinWheel();
    } else {
      statusText.textContent = 'Missed it. Even romance needs aim.';
      wobbleMan();
    }
    setTimeout(resetMan, hit ? 450 : 700);
  };
  drag = null;
});

closeTicket.addEventListener('click', () => {
  ticket.classList.add('hidden');
  setLockedView();
});

function openPasswordDialog() {
  passwordInput.value = '';
  passwordError.textContent = '';
  passwordDialog.showModal();
  setTimeout(() => passwordInput.focus(), 50);
}

secretHeart.addEventListener('click', openPasswordDialog);
titleTap.addEventListener('click', () => {
  titleTapCount += 1;
  clearTimeout(titleTap._timer);
  titleTap._timer = setTimeout(() => titleTapCount = 0, 1500);
  if (titleTapCount >= 5) {
    titleTapCount = 0;
    openPasswordDialog();
  }
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (passwordInput.value === PASSWORD) {
    testMode = true;
    adminPanel.classList.remove('hidden');
    lockedCard.classList.add('hidden');
    statusText.textContent = 'Testing mode unlocked. Prize goblin is off the leash.';
    passwordDialog.close();
  } else {
    passwordError.textContent = 'Nope. The goblin remains protected.';
    wobbleMan();
  }
});

document.getElementById('testSpin').addEventListener('click', () => spinWheel(true));
document.getElementById('resetSpin').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  statusText.textContent = 'Monthly spin reset. Romance has been rebooted.';
  lockedCard.classList.add('hidden');
});
document.getElementById('forceAvailable').addEventListener('click', () => {
  saveState({ lastSpinMonth: 'forced-open' });
  lockedCard.classList.add('hidden');
  statusText.textContent = 'Spin forced available. With great power comes questionable decisions.';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

drawWheel();
setLockedView();
