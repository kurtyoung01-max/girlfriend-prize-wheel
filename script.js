const PASSWORD = 'Jukian84!';
const STORAGE_KEY = 'girlfriendPrizeWheelState.v1';

const DEFAULT_PRIZES = [
  { name: 'Takeaway & Movie Night', line: 'Home date night. Your favourite takeaway, a film, and zero judgement for blanket hogging.' },
  { name: 'Dinner & Movie Out', line: 'Popcorn tax applies. Complaints department is closed.' },
  { name: 'Surprise Picnic', line: 'Location secret. Snack quality taken extremely seriously.' },
  { name: 'Surprise Present', line: 'A mystery gift. No, you cannot interrogate Cupid.' },
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
  { name: 'Chore-Free Day', line: 'One day off from boring house stuff. Cupid has spoken.' },
  { name: 'Homemade Dinner', line: 'Cooked with love and only mild panic.' },
  { name: 'Spa Night At Home', line: 'Robes, face masks, and cucumber behaviour.' },
  { name: 'One Yes Day', line: 'Within reason. We are cute, not legally reckless.' },
  { name: 'Handwritten Letter', line: 'Old-school romance. Actual handwriting. Brace yourself.' },
  { name: 'Choose Our Next Date', line: 'You pick the next date idea and Cupid will make it happen.' },
  { name: 'Walk & Brunch', line: 'Exercise followed by carbs. Balance restored.' },
  { name: 'Stargazing Date', line: 'Stars, snacks, and pretending we know constellations.' },
  { name: 'Board Games & Snacks', line: 'Cute night. Competitive behaviour may occur.' }
];

function normalisePrizeList(value) {
  if (!Array.isArray(value)) return null;
  const cleaned = value.map(item => ({
    name: String(item?.name || '').trim(),
    line: String(item?.line || '').trim()
  })).filter(item => item.name);
  return cleaned.length >= 2 ? cleaned : null;
}

let prizes = normalisePrizeList(loadState().customPrizes) || DEFAULT_PRIZES.map(prize => ({ ...prize }));

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const littleMan = document.getElementById('littleMan');
const statusText = document.getElementById('statusText');
const ticket = document.getElementById('ticket');
const prizeName = document.getElementById('prizeName');
const prizeLine = document.getElementById('prizeLine');
const closeTicket = document.getElementById('closeTicket');
const claimedTicketDetails = document.getElementById('claimedTicketDetails');
const claimedPrizeName = document.getElementById('claimedPrizeName');
const claimedDate = document.getElementById('claimedDate');
const expiryDate = document.getElementById('expiryDate');
const ticketCode = document.getElementById('ticketCode');
const saveTicketPhoto = document.getElementById('saveTicketPhoto');
const saveTicketHint = document.getElementById('saveTicketHint');
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
let testMode = Boolean(loadState().adminSettings?.unlimited);
let monthlyLockEnabled = loadState().adminSettings?.monthlyLock ?? false;
let forcedPrizeIndex = null
let titleTapCount = 0;
let drag = null;
let currentPrize = null;

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
  return monthlyLockEnabled && loadState().lastSpinMonth === monthKey();
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
  lockedMessage.textContent = `Nice try. Cupid says come back on ${nextMonthText()}.`;
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

  const winningIndex = Number.isInteger(forcedPrizeIndex) ? forcedPrizeIndex : Math.floor(Math.random() * prizes.length);
  forcedPrizeIndex = null;
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
  currentPrize = prize;
  claimedTicketDetails.classList.add('hidden');
  closeTicket.textContent = 'Claim ticket';
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
      statusText.textContent = 'Direct hit. Cupid has fulfilled his tiny romantic destiny.';
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
  if (!currentPrize) return;

  if (claimedTicketDetails.classList.contains('hidden')) {
    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt);
    expiresAt.setDate(expiresAt.getDate() + 31);
    const formatDate = (date) => date.toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
    const code = `LOVE-${claimedAt.getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    claimedPrizeName.textContent = currentPrize.name;
    claimedDate.textContent = formatDate(claimedAt);
    expiryDate.textContent = formatDate(expiresAt);
    ticketCode.textContent = code;
    claimedTicketDetails.classList.remove('hidden');
    saveTicketPhoto.textContent = 'Download ticket photo';
    saveTicketHint.textContent = 'Downloads straight to your device as a PNG image.';
    closeTicket.textContent = 'Done';
    const claimedTicket = {
      prize: currentPrize,
      claimedAt: claimedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      code
    };
    const state = loadState();
    saveState({
      lastClaimedTicket: claimedTicket,
      ticketHistory: [claimedTicket, ...(state.ticketHistory || [])].slice(0, 50)
    });
    statusText.textContent = 'Ticket claimed. It expires in 31 days, so no strategic hoarding.';
    burstConfetti();
    vibrate([25, 40, 25]);
    return;
  }

  ticket.classList.add('hidden');
  claimedTicketDetails.classList.add('hidden');
  closeTicket.textContent = 'Claim ticket';
  currentPrize = null;
  setLockedView();
});


function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildTicketImageBlob() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 1200, 1600);
  gradient.addColorStop(0, '#ffe8f0');
  gradient.addColorStop(1, '#fff7dc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff8ed';
  ctx.strokeStyle = '#34212a';
  ctx.lineWidth = 12;
  roundedRect(ctx, 90, 110, 1020, 1380, 58);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ff4f8b';
  ctx.font = '900 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU HAVE WON', 600, 250);

  ctx.fillStyle = '#34212a';
  ctx.font = '900 82px system-ui, sans-serif';
  const prizeLines = wrapCanvasText(ctx, claimedPrizeName.textContent, 850);
  let y = 390;
  prizeLines.forEach(line => {
    ctx.fillText(line, 600, y);
    y += 92;
  });

  ctx.strokeStyle = '#745864';
  ctx.lineWidth = 5;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(170, y + 30);
  ctx.lineTo(1030, y + 30);
  ctx.stroke();
  ctx.setLineDash([]);

  const detailY = y + 130;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#34212a';
  ctx.font = '700 43px system-ui, sans-serif';
  ctx.fillText(`Claimed: ${claimedDate.textContent}`, 180, detailY);
  ctx.fillText(`Valid until: ${expiryDate.textContent}`, 180, detailY + 90);

  ctx.font = '700 38px ui-monospace, monospace';
  ctx.fillText(`Ticket: ${ticketCode.textContent}`, 180, detailY + 200);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#745864';
  ctx.font = '500 34px system-ui, sans-serif';
  const small = wrapCanvasText(ctx, 'Redeem within 31 days. Excessive smugness is permitted.', 780);
  let smallY = detailY + 340;
  small.forEach(line => {
    ctx.fillText(line, 600, smallY);
    smallY += 48;
  });

  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath();
  ctx.arc(600, 1315, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34212a';
  ctx.font = '70px system-ui, sans-serif';
  ctx.fillText('♥', 600, 1340);

  ctx.fillStyle = '#745864';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.fillText('Girlfriend Prize Wheel', 600, 1430);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
}

async function saveTicketAsPhoto() {
  if (!ticketCode.textContent) return;
  saveTicketPhoto.disabled = true;
  saveTicketPhoto.textContent = 'Making your ticket...';
  try {
    const blob = await buildTicketImageBlob();
    if (!blob) throw new Error('Image creation failed');
    const safePrize = claimedPrizeName.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileName = `${safePrize || 'prize'}-ticket.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    saveTicketHint.textContent = 'Ticket downloaded as a PNG. Check Downloads on your phone or computer.';
    saveTicketPhoto.textContent = 'Saved. Very official.';
    vibrate([20, 30, 20]);
  } catch (error) {
    if (error && error.name === 'AbortError') {
      saveTicketHint.textContent = 'Save cancelled. The ticket is still here when you are ready.';
    } else {
      saveTicketHint.textContent = 'Could not save automatically. Try again in Chrome or Safari.';
    }
    saveTicketPhoto.textContent = 'Download ticket photo';
  } finally {
    saveTicketPhoto.disabled = false;
  }
}

saveTicketPhoto.addEventListener('click', saveTicketAsPhoto);

function openPasswordDialog() {
  passwordInput.value = '';
  passwordError.textContent = '';
  if (typeof passwordDialog.showModal === 'function') passwordDialog.showModal();
  else passwordDialog.setAttribute('open', '');
  setTimeout(() => passwordInput.focus(), 50);
}

const closeAdmin = document.getElementById('closeAdmin');
const unlimitedToggle = document.getElementById('unlimitedToggle');
const monthlyLockToggle = document.getElementById('monthlyLockToggle');
const forcePrizeSelect = document.getElementById('forcePrizeSelect');
const previewTicket = document.getElementById('previewTicket');
const viewHistory = document.getElementById('viewHistory');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');
const resetAll = document.getElementById('resetAll');
const adminStatus = document.getElementById('adminStatus');
const cancelPassword = document.getElementById('cancelPassword');
const prizeEditorList = document.getElementById('prizeEditorList');
const addPrize = document.getElementById('addPrize');
const savePrizes = document.getElementById('savePrizes');
const restorePrizes = document.getElementById('restorePrizes');

function saveAdminSettings() {
  saveState({ adminSettings: { unlimited: testMode, monthlyLock: monthlyLockEnabled } });
}

function refreshAdminControls() {
  unlimitedToggle.checked = testMode;
  monthlyLockToggle.checked = monthlyLockEnabled;
  adminStatus.textContent = `${testMode ? 'Unlimited spins on' : 'Unlimited spins off'} · ${monthlyLockEnabled ? 'Monthly lock on' : 'Monthly lock off'}`;
}

function populatePrizeSelector() {
  const selected = forcePrizeSelect.value;
  forcePrizeSelect.innerHTML = '<option value="">Random prize</option>';
  prizes.forEach((prize, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = prize.name;
    forcePrizeSelect.appendChild(option);
  });
  if ([...forcePrizeSelect.options].some(option => option.value === selected)) forcePrizeSelect.value = selected;
}

function renderPrizeEditor() {
  prizeEditorList.innerHTML = '';
  prizes.forEach((prize, index) => {
    const row = document.createElement('div');
    row.className = 'prize-editor-row';
    row.innerHTML = `
      <div class="prize-editor-number">${index + 1}</div>
      <div class="prize-editor-fields">
        <input class="admin-input prize-name-input" type="text" value="${escapeHtml(prize.name)}" aria-label="Prize ${index + 1} name">
        <textarea class="admin-input prize-line-input" rows="2" aria-label="Prize ${index + 1} description">${escapeHtml(prize.line)}</textarea>
      </div>
      <button class="prize-delete-btn" type="button" aria-label="Delete ${escapeHtml(prize.name)}">Delete</button>`;
    row.querySelector('.prize-delete-btn').addEventListener('click', () => {
      if (prizes.length <= 2) {
        adminStatus.textContent = 'Keep at least two prizes so the wheel still has something to do.';
        return;
      }
      prizes.splice(index, 1);
      renderPrizeEditor();
    });
    prizeEditorList.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function readPrizeEditor() {
  return [...prizeEditorList.querySelectorAll('.prize-editor-row')].map(row => ({
    name: row.querySelector('.prize-name-input').value.trim(),
    line: row.querySelector('.prize-line-input').value.trim()
  })).filter(prize => prize.name);
}

function applyPrizeChanges(nextPrizes) {
  const cleaned = normalisePrizeList(nextPrizes);
  if (!cleaned) {
    adminStatus.textContent = 'Please keep at least two named prizes.';
    return false;
  }
  prizes = cleaned;
  forcedPrizeIndex = null;
  saveState({ customPrizes: prizes });
  populatePrizeSelector();
  renderPrizeEditor();
  drawWheel();
  adminStatus.textContent = `${prizes.length} prizes saved. The wheel has been updated.`;
  return true;
}

function formatAdminDate(value) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderHistory() {
  const history = loadState().ticketHistory || [];
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = '<p>No claimed tickets yet. Cupid has paperwork to catch up on.</p>';
    return;
  }
  history.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `<strong>${item.prize?.name || 'Mystery prize'}</strong><small>Claimed ${formatAdminDate(item.claimedAt)} · Expires ${formatAdminDate(item.expiresAt)}<br>${item.code || ''}</small>`;
    historyList.appendChild(row);
  });
}

function openAdmin() {
  refreshAdminControls();
  renderPrizeEditor();
  adminPanel.classList.remove('hidden');
  lockedCard.classList.add('hidden');
  statusText.textContent = 'Admin mode unlocked. Cupid is now under questionable management.';
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
    if (typeof passwordDialog.close === 'function') passwordDialog.close();
    else passwordDialog.removeAttribute('open');
    openAdmin();
    requestAnimationFrame(() => adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } else {
    passwordError.textContent = 'Nope. Cupid says the password is wrong.';
    wobbleMan();
  }
});


cancelPassword.addEventListener('click', () => {
  if (typeof passwordDialog.close === 'function') passwordDialog.close();
  else passwordDialog.removeAttribute('open');
});

closeAdmin.addEventListener('click', () => adminPanel.classList.add('hidden'));

unlimitedToggle.addEventListener('change', () => {
  testMode = unlimitedToggle.checked;
  saveAdminSettings();
  refreshAdminControls();
  setLockedView();
});

monthlyLockToggle.addEventListener('change', () => {
  monthlyLockEnabled = monthlyLockToggle.checked;
  saveAdminSettings();
  refreshAdminControls();
  setLockedView();
});

forcePrizeSelect.addEventListener('change', () => {
  forcedPrizeIndex = forcePrizeSelect.value === '' ? null : Number(forcePrizeSelect.value);
  adminStatus.textContent = forcedPrizeIndex === null ? 'Next spin will be random.' : `Next spin forced to: ${prizes[forcedPrizeIndex].name}`;
});

document.getElementById('testSpin').addEventListener('click', () => {
  adminPanel.classList.add('hidden');
  if (forcePrizeSelect.value !== '') forcedPrizeIndex = Number(forcePrizeSelect.value);
  spinWheel(true);
});

document.getElementById('resetSpin').addEventListener('click', () => {
  const state = loadState();
  delete state.lastSpinDate;
  delete state.lastSpinMonth;
  delete state.lastPrize;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  lockedCard.classList.add('hidden');
  adminStatus.textContent = 'Monthly spin reset. Romance bureaucracy cleared.';
  statusText.textContent = 'Spin reset. Cupid is ready for another launch.';
});

previewTicket.addEventListener('click', () => {
  const index = forcePrizeSelect.value === '' ? 0 : Number(forcePrizeSelect.value);
  adminPanel.classList.add('hidden');
  revealPrize(index);
});

viewHistory.addEventListener('click', () => {
  renderHistory();
  historyPanel.classList.toggle('hidden');
});

addPrize.addEventListener('click', () => {
  const current = readPrizeEditor();
  prizes = [...current, { name: 'New Prize', line: 'Add the funny little terms and conditions here.' }];
  renderPrizeEditor();
  prizeEditorList.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

savePrizes.addEventListener('click', () => applyPrizeChanges(readPrizeEditor()));

restorePrizes.addEventListener('click', () => {
  if (!confirm('Restore the original prize list? Your custom edits will be replaced.')) return;
  prizes = DEFAULT_PRIZES.map(prize => ({ ...prize }));
  const state = loadState();
  delete state.customPrizes;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  forcedPrizeIndex = null;
  populatePrizeSelector();
  renderPrizeEditor();
  drawWheel();
  adminStatus.textContent = 'Original prize list restored.';
});

document.getElementById('forceAvailable').addEventListener('click', () => {
  const state = loadState();
  delete state.lastSpinDate;
  delete state.lastSpinMonth;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  lockedCard.classList.add('hidden');
  adminStatus.textContent = 'Spin is available again.';
});

clearHistory.addEventListener('click', () => {
  if (!confirm('Clear all claimed ticket history?')) return;
  saveState({ ticketHistory: [] });
  renderHistory();
  adminStatus.textContent = 'Ticket history cleared.';
});

resetAll.addEventListener('click', () => {
  if (!confirm('Reset every prize, ticket and admin setting on this device?')) return;
  localStorage.removeItem(STORAGE_KEY);
  testMode = false;
  monthlyLockEnabled = false;
  forcedPrizeIndex = null;
  prizes = DEFAULT_PRIZES.map(prize => ({ ...prize }));
  populatePrizeSelector();
  renderPrizeEditor();
  drawWheel();
  refreshAdminControls();
  historyPanel.classList.add('hidden');
  adminStatus.textContent = 'All local app data reset.';
  lockedCard.classList.add('hidden');
  ticket.classList.add('hidden');
});

populatePrizeSelector();
refreshAdminControls();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

function initialiseApp() {
  // Draw immediately, then again after layout and fonts settle on mobile browsers.
  drawWheel();
  setLockedView();
  requestAnimationFrame(drawWheel);
  window.setTimeout(drawWheel, 120);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiseApp, { once: true });
} else {
  initialiseApp();
}

window.addEventListener('load', drawWheel, { once: true });
window.addEventListener('resize', () => requestAnimationFrame(drawWheel));
