'use strict';

const PASSWORD = 'Jukian84!';
const STORAGE_KEY = 'girlfriendPrizeWheelState.v2';
const LEGACY_STORAGE_KEY = 'girlfriendPrizeWheelState.v1';

const DEFAULT_PRIZES = [
  { name: 'Takeaway & Movie Night', line: 'Home date night. Your favourite takeaway, a film, and zero judgement for blanket hogging.' },
  { name: 'Dinner & Movie Out', line: 'Popcorn tax applies. Complaints department is closed.' },
  { name: 'Surprise Picnic', line: 'Location secret. Snack quality taken extremely seriously.' },
  { name: 'Surprise Present', line: 'A mystery gift. No, you cannot interrogate Cupid.' },
  { name: 'Night Away', line: 'Tiny escape unlocked. Bags packed, adulting ignored.' },
  { name: '3 Free Massages', line: 'Terms: I may sigh dramatically, but service will be delivered.' },
  { name: 'Breakfast in Bed', line: 'Crumbs included at no extra charge.' },
  { name: 'Coffee Walk Date', line: 'A stroll, caffeine, and pretending we are outdoorsy influencers.' },
  { name: 'Arcade Date', line: 'Loser buys the ice cream.' },
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

const DEFAULT_STATE = {
  adminSettings: { unlimited: true, monthlyLock: false },
  customPrizes: null,
  ticketHistory: []
};

const $ = id => document.getElementById(id);

const dom = {
  canvas: $('wheelCanvas'),
  littleMan: $('littleMan'),
  speechBubble: document.querySelector('.speech-bubble'),
  statusText: $('statusText'),
  modeLabel: $('modeLabel'),
  ticket: $('ticket'),
  prizeName: $('prizeName'),
  prizeLine: $('prizeLine'),
  closeTicket: $('closeTicket'),
  claimedTicketDetails: $('claimedTicketDetails'),
  claimedPrizeName: $('claimedPrizeName'),
  claimedDate: $('claimedDate'),
  expiryDate: $('expiryDate'),
  ticketCode: $('ticketCode'),
  saveTicketPhoto: $('saveTicketPhoto'),
  saveTicketHint: $('saveTicketHint'),
  lockedCard: $('lockedCard'),
  lockedMessage: $('lockedMessage'),
  lastPrizeText: $('lastPrizeText'),
  adminPanel: $('adminPanel'),
  passwordDialog: $('passwordDialog'),
  passwordForm: $('passwordForm'),
  passwordInput: $('passwordInput'),
  passwordError: $('passwordError'),
  secretHeart: $('secretHeart'),
  titleTap: $('titleTap'),
  confetti: $('confetti'),
  closeAdmin: $('closeAdmin'),
  unlimitedToggle: $('unlimitedToggle'),
  monthlyLockToggle: $('monthlyLockToggle'),
  forcePrizeSelect: $('forcePrizeSelect'),
  previewTicket: $('previewTicket'),
  viewHistory: $('viewHistory'),
  historyPanel: $('historyPanel'),
  historyList: $('historyList'),
  clearHistory: $('clearHistory'),
  resetAll: $('resetAll'),
  adminStatus: $('adminStatus'),
  cancelPassword: $('cancelPassword'),
  prizeEditorList: $('prizeEditorList'),
  addPrize: $('addPrize'),
  savePrizes: $('savePrizes'),
  restorePrizes: $('restorePrizes'),
  testSpin: $('testSpin'),
  resetSpin: $('resetSpin'),
  forceAvailable: $('forceAvailable')
};

const missing = Object.entries(dom).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) throw new Error(`Missing required UI elements: ${missing.join(', ')}`);

const ctx = dom.canvas.getContext('2d');
let state = loadState();
let prizes = normalisePrizeList(state.customPrizes) || clonePrizes(DEFAULT_PRIZES);
let rotation = 0;
let spinning = false;
let forcedPrizeIndex = null;
let currentPrize = null;
let titleTapCount = 0;
let drag = null;
let editorDraft = clonePrizes(prizes);

function clonePrizes(list) {
  return list.map(prize => ({ name: prize.name, line: prize.line }));
}

function safeParse(value) {
  try { return value ? JSON.parse(value) : null; }
  catch { return null; }
}

function migratePrize(prize) {
  if (!prize || typeof prize !== 'object') return null;
  const originalName = String(prize.name || '').trim();
  const originalLine = String(prize.line || '').trim();
  const lower = originalName.toLowerCase();

  if (lower.includes('fish') && lower.includes('movie')) {
    return { name: 'Takeaway & Movie Night', line: DEFAULT_PRIZES[0].line };
  }
  if (lower === 'no-phone dinner' || lower === 'no phone dinner') {
    return { name: 'Arcade Date', line: 'Loser buys the ice cream.' };
  }
  if (lower === 'surprise flowers') {
    return { name: 'Choose Our Next Date', line: 'You pick the next date idea and Cupid will make it happen.' };
  }
  return originalName ? { name: originalName, line: originalLine } : null;
}

function normalisePrizeList(value) {
  if (!Array.isArray(value)) return null;
  const seen = new Set();
  const cleaned = value
    .map(migratePrize)
    .filter(Boolean)
    .filter(prize => {
      const key = prize.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return cleaned.length >= 2 ? cleaned : null;
}

function loadState() {
  const current = safeParse(localStorage.getItem(STORAGE_KEY));
  if (current) {
    return {
      ...DEFAULT_STATE,
      ...current,
      adminSettings: { ...DEFAULT_STATE.adminSettings, ...(current.adminSettings || {}) },
      customPrizes: normalisePrizeList(current.customPrizes),
      lastPrize: migratePrize(current.lastPrize),
      ticketHistory: Array.isArray(current.ticketHistory) ? current.ticketHistory : []
    };
  }

  const legacy = safeParse(localStorage.getItem(LEGACY_STORAGE_KEY)) || {};
  const migrated = {
    ...DEFAULT_STATE,
    customPrizes: normalisePrizeList(legacy.customPrizes),
    ticketHistory: Array.isArray(legacy.ticketHistory) ? legacy.ticketHistory : [],
    history: Array.isArray(legacy.history) ? legacy.history : []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function saveState(patch) {
  state = {
    ...state,
    ...patch,
    adminSettings: patch.adminSettings
      ? { ...state.adminSettings, ...patch.adminSettings }
      : state.adminSettings
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthText() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function isUnlimited() { return Boolean(state.adminSettings.unlimited); }
function isMonthlyLockEnabled() { return Boolean(state.adminSettings.monthlyLock); }
function hasSpunThisMonth() { return isMonthlyLockEnabled() && state.lastSpinMonth === monthKey(); }

function updateModeCopy() {
  dom.modeLabel.textContent = isUnlimited() ? 'Unlimited testing chaos' : 'Cupid’s monthly surprise';
}

function ensureCanvasSize() {
  const rect = dom.canvas.getBoundingClientRect();
  const cssSize = Math.max(280, Math.round(rect.width || dom.canvas.parentElement?.clientWidth || 360));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pixelSize = Math.round(cssSize * dpr);
  if (dom.canvas.width !== pixelSize || dom.canvas.height !== pixelSize) {
    dom.canvas.width = pixelSize;
    dom.canvas.height = pixelSize;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return cssSize;
}

function drawWheel() {
  if (!prizes.length) return;
  const size = ensureCanvasSize();
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * .455;
  const slice = Math.PI * 2 / prizes.length;
  const colours = ['#ff7aa8', '#ffd166', '#8bd3ff', '#b8f2c2', '#f7a8ff', '#fff2a8'];

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  prizes.forEach((prize, index) => {
    const start = index * slice;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colours[index % colours.length];
    ctx.fill();
    ctx.strokeStyle = '#34212a';
    ctx.lineWidth = Math.max(2.5, size * .007);
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#34212a';
    const fontSize = Math.max(10, Math.min(17, size / 28));
    ctx.font = `850 ${fontSize}px system-ui, sans-serif`;
    drawSliceLabel(prize.name, radius - size * .035, 0, radius * .36, fontSize * 1.05);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, size * .088, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8ed';
  ctx.fill();
  ctx.lineWidth = Math.max(4, size * .01);
  ctx.strokeStyle = '#34212a';
  ctx.stroke();
  ctx.fillStyle = '#34212a';
  ctx.font = `900 ${Math.max(25, size * .055)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♥', 0, 2);
  ctx.restore();
}

function drawSliceLabel(text, x, y, maxWidth, lineHeight) {
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
  const visible = lines.slice(0, 2);
  const offset = (visible.length - 1) * lineHeight / 2;
  visible.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight - offset));
}

function setLockedView() {
  updateModeCopy();
  if (!hasSpunThisMonth() || isUnlimited()) {
    dom.lockedCard.classList.add('hidden');
    if (!spinning && dom.ticket.classList.contains('hidden')) {
      dom.statusText.textContent = 'Throw Cupid at the wheel to reveal your prize.';
    }
    return;
  }

  dom.lockedMessage.textContent = `Cupid says come back on ${nextMonthText()}.`;
  dom.lastPrizeText.textContent = state.lastPrize?.name ? `Last prize: ${state.lastPrize.name}` : '';
  dom.lockedCard.classList.remove('hidden');
  dom.statusText.textContent = 'The wheel is still here, but the next official spin opens next month.';
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  while (angle < 0) angle += twoPi;
  while (angle >= twoPi) angle -= twoPi;
  return angle;
}

function spinWheel(force = false) {
  if (spinning) return;
  if (!force && !isUnlimited() && hasSpunThisMonth()) {
    setLockedView();
    wobbleCupid();
    return;
  }

  spinning = true;
  dom.ticket.classList.add('hidden');
  dom.lockedCard.classList.add('hidden');
  dom.statusText.textContent = 'Spinning. Romance bureaucracy in progress.';
  vibrate(20);

  const winningIndex = Number.isInteger(forcedPrizeIndex)
    ? Math.min(forcedPrizeIndex, prizes.length - 1)
    : Math.floor(Math.random() * prizes.length);
  forcedPrizeIndex = null;

  const slice = Math.PI * 2 / prizes.length;
  const pointerAngle = -Math.PI / 2;
  const targetAngle = pointerAngle - (winningIndex * slice + slice / 2);
  const startRotation = rotation;
  const endRotation = startRotation + Math.PI * 2 * (5 + Math.floor(Math.random() * 3)) + normalizeAngle(targetAngle - startRotation);
  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (endRotation - startRotation) * eased;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation = endRotation % (Math.PI * 2);
      drawWheel();
      spinning = false;
      revealPrize(winningIndex);
    }
  }
  requestAnimationFrame(animate);
}

function revealPrize(index) {
  const prize = prizes[index];
  if (!prize) return;
  currentPrize = { ...prize };
  dom.claimedTicketDetails.classList.add('hidden');
  dom.closeTicket.textContent = 'Claim ticket';
  dom.prizeName.textContent = prize.name;
  dom.prizeLine.textContent = prize.line;
  dom.ticket.classList.remove('hidden');
  burstConfetti();
  vibrate([30, 50, 30]);

  if (!isUnlimited()) {
    const spinRecord = { date: new Date().toISOString(), prize: { ...prize } };
    saveState({
      lastSpinDate: spinRecord.date,
      lastSpinMonth: monthKey(),
      lastPrize: { ...prize },
      history: [...(Array.isArray(state.history) ? state.history : []), spinRecord].slice(-24)
    });
  }
  dom.statusText.textContent = 'Ticket issued. Romance law is binding.';
}

function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function wobbleCupid() {
  dom.littleMan.animate([
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(-11deg)' },
    { transform: 'rotate(11deg)' },
    { transform: 'rotate(0deg)' }
  ], { duration: 420, easing: 'ease-in-out' });
}

function resetCupid() {
  dom.littleMan.style.position = '';
  dom.littleMan.style.left = '';
  dom.littleMan.style.top = '';
  dom.littleMan.style.transform = '';
  dom.littleMan.classList.remove('dragging', 'flying');
  dom.speechBubble.textContent = 'Throw me!';
}

function startCupidDrag(event) {
  if (spinning || event.button > 0) return;
  const rect = dom.littleMan.getBoundingClientRect();
  dom.littleMan.setPointerCapture?.(event.pointerId);
  drag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    lastX: event.clientX,
    lastY: event.clientY,
    lastT: performance.now(),
    vx: 0,
    vy: 0
  };
  dom.littleMan.classList.add('dragging');
  dom.littleMan.style.position = 'fixed';
  dom.littleMan.style.left = `${rect.left}px`;
  dom.littleMan.style.top = `${rect.top}px`;
  dom.speechBubble.textContent = 'Wheeeee!';
  event.preventDefault();
}

function moveCupid(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const now = performance.now();
  const dt = Math.max(16, now - drag.lastT);
  drag.vx = (event.clientX - drag.lastX) / dt;
  drag.vy = (event.clientY - drag.lastY) / dt;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.lastT = now;
  dom.littleMan.style.left = `${event.clientX - drag.offsetX}px`;
  dom.littleMan.style.top = `${event.clientY - drag.offsetY}px`;
  event.preventDefault();
}

function releaseCupid(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const start = dom.littleMan.getBoundingClientRect();
  const wheel = dom.canvas.getBoundingClientRect();
  dom.littleMan.classList.remove('dragging');
  dom.littleMan.classList.add('flying');

  const endLeft = wheel.left + wheel.width / 2 - start.width / 2;
  const endTop = wheel.top + wheel.height / 2 - start.height / 2;
  const animation = dom.littleMan.animate([
    { left: `${start.left}px`, top: `${start.top}px`, transform: 'rotate(0deg) scale(1)' },
    { left: `${endLeft}px`, top: `${endTop}px`, transform: 'rotate(380deg) scale(.88)' }
  ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });

  animation.onfinish = () => {
    dom.statusText.textContent = 'BONK! Cupid has fulfilled his tiny romantic destiny.';
    spinWheel();
    setTimeout(resetCupid, 500);
  };
  drag = null;
  event.preventDefault();
}

function cancelCupid(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = null;
  resetCupid();
}

function burstConfetti() {
  dom.confetti.innerHTML = '';
  const colours = ['#ff7aa8', '#ffd166', '#8bd3ff', '#b8f2c2', '#f7a8ff'];
  for (let index = 0; index < 80; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-10 - Math.random() * 30}px`;
    piece.style.background = colours[index % colours.length];
    piece.style.animationDelay = `${Math.random() * .28}s`;
    dom.confetti.appendChild(piece);
  }
  setTimeout(() => { dom.confetti.innerHTML = ''; }, 2400);
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function claimTicket() {
  if (!currentPrize) return;
  if (!dom.claimedTicketDetails.classList.contains('hidden')) {
    dom.ticket.classList.add('hidden');
    dom.claimedTicketDetails.classList.add('hidden');
    dom.closeTicket.textContent = 'Claim ticket';
    currentPrize = null;
    setLockedView();
    return;
  }

  const claimedAt = new Date();
  const expiresAt = new Date(claimedAt);
  expiresAt.setDate(expiresAt.getDate() + 31);
  const code = `LOVE-${claimedAt.getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const claimedTicket = {
    prize: { ...currentPrize },
    claimedAt: claimedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    code
  };

  dom.claimedPrizeName.textContent = currentPrize.name;
  dom.claimedDate.textContent = formatDate(claimedAt);
  dom.expiryDate.textContent = formatDate(expiresAt);
  dom.ticketCode.textContent = code;
  dom.claimedTicketDetails.classList.remove('hidden');
  dom.closeTicket.textContent = 'Done';
  dom.saveTicketPhoto.textContent = 'Download ticket photo';
  dom.saveTicketHint.textContent = 'Downloads straight to your device as a PNG image.';
  saveState({
    lastClaimedTicket: claimedTicket,
    ticketHistory: [claimedTicket, ...(Array.isArray(state.ticketHistory) ? state.ticketHistory : [])].slice(0, 50)
  });
  dom.statusText.textContent = 'Ticket claimed. It expires in 31 days, so no strategic hoarding.';
  burstConfetti();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
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
  const imageCanvas = document.createElement('canvas');
  imageCanvas.width = 1200;
  imageCanvas.height = 1600;
  const imageCtx = imageCanvas.getContext('2d');
  const gradient = imageCtx.createLinearGradient(0, 0, 1200, 1600);
  gradient.addColorStop(0, '#ffe8f0');
  gradient.addColorStop(1, '#fff7dc');
  imageCtx.fillStyle = gradient;
  imageCtx.fillRect(0, 0, 1200, 1600);
  imageCtx.fillStyle = '#fff8ed';
  imageCtx.strokeStyle = '#34212a';
  imageCtx.lineWidth = 12;
  roundedRect(imageCtx, 90, 110, 1020, 1380, 58);
  imageCtx.fill();
  imageCtx.stroke();
  imageCtx.fillStyle = '#ff4f8b';
  imageCtx.font = '900 42px system-ui, sans-serif';
  imageCtx.textAlign = 'center';
  imageCtx.fillText('YOU HAVE WON', 600, 250);
  imageCtx.fillStyle = '#34212a';
  imageCtx.font = '900 82px system-ui, sans-serif';
  const prizeLines = wrapCanvasText(imageCtx, dom.claimedPrizeName.textContent, 850);
  let y = 390;
  prizeLines.forEach(line => { imageCtx.fillText(line, 600, y); y += 92; });
  imageCtx.strokeStyle = '#745864';
  imageCtx.lineWidth = 5;
  imageCtx.setLineDash([18, 14]);
  imageCtx.beginPath();
  imageCtx.moveTo(170, y + 30);
  imageCtx.lineTo(1030, y + 30);
  imageCtx.stroke();
  imageCtx.setLineDash([]);
  const detailY = y + 130;
  imageCtx.textAlign = 'left';
  imageCtx.fillStyle = '#34212a';
  imageCtx.font = '700 43px system-ui, sans-serif';
  imageCtx.fillText(`Claimed: ${dom.claimedDate.textContent}`, 180, detailY);
  imageCtx.fillText(`Valid until: ${dom.expiryDate.textContent}`, 180, detailY + 90);
  imageCtx.font = '700 38px ui-monospace, monospace';
  imageCtx.fillText(`Ticket: ${dom.ticketCode.textContent}`, 180, detailY + 200);
  imageCtx.textAlign = 'center';
  imageCtx.fillStyle = '#745864';
  imageCtx.font = '500 34px system-ui, sans-serif';
  wrapCanvasText(imageCtx, 'Redeem within 31 days. Excessive smugness is permitted.', 780)
    .forEach((line, index) => imageCtx.fillText(line, 600, detailY + 340 + index * 48));
  imageCtx.fillStyle = '#ff7aa8';
  imageCtx.beginPath();
  imageCtx.arc(600, 1315, 74, 0, Math.PI * 2);
  imageCtx.fill();
  imageCtx.fillStyle = '#34212a';
  imageCtx.font = '70px system-ui, sans-serif';
  imageCtx.fillText('♥', 600, 1340);
  imageCtx.fillStyle = '#745864';
  imageCtx.font = '600 28px system-ui, sans-serif';
  imageCtx.fillText('Girlfriend Prize Wheel', 600, 1430);
  return new Promise(resolve => imageCanvas.toBlob(resolve, 'image/png', 1));
}

async function saveTicketAsPhoto() {
  if (!dom.ticketCode.textContent) return;
  dom.saveTicketPhoto.disabled = true;
  dom.saveTicketPhoto.textContent = 'Making your ticket...';
  try {
    const blob = await buildTicketImageBlob();
    if (!blob) throw new Error('Image creation failed');
    const safePrize = dom.claimedPrizeName.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safePrize || 'prize'}-ticket.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    dom.saveTicketHint.textContent = 'Ticket downloaded as a PNG. Check Downloads on your phone or computer.';
    dom.saveTicketPhoto.textContent = 'Saved. Very official.';
  } catch {
    dom.saveTicketHint.textContent = 'Could not save automatically. Try again in Chrome or Safari.';
    dom.saveTicketPhoto.textContent = 'Download ticket photo';
  } finally {
    dom.saveTicketPhoto.disabled = false;
  }
}

function openPasswordDialog() {
  dom.passwordInput.value = '';
  dom.passwordError.textContent = '';
  if (typeof dom.passwordDialog.showModal === 'function') {
    if (!dom.passwordDialog.open) dom.passwordDialog.showModal();
  } else {
    dom.passwordDialog.setAttribute('open', '');
  }
  setTimeout(() => dom.passwordInput.focus(), 50);
}

function closePasswordDialog() {
  if (typeof dom.passwordDialog.close === 'function' && dom.passwordDialog.open) dom.passwordDialog.close();
  else dom.passwordDialog.removeAttribute('open');
}

function refreshAdminControls() {
  dom.unlimitedToggle.checked = isUnlimited();
  dom.monthlyLockToggle.checked = isMonthlyLockEnabled();
  dom.adminStatus.textContent = `${isUnlimited() ? 'Unlimited spins on' : 'Unlimited spins off'} · ${isMonthlyLockEnabled() ? 'Monthly lock on' : 'Monthly lock off'}`;
}

function populatePrizeSelector() {
  const selected = dom.forcePrizeSelect.value;
  dom.forcePrizeSelect.innerHTML = '';
  const random = document.createElement('option');
  random.value = '';
  random.textContent = 'Random prize';
  dom.forcePrizeSelect.appendChild(random);
  prizes.forEach((prize, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = prize.name;
    dom.forcePrizeSelect.appendChild(option);
  });
  if ([...dom.forcePrizeSelect.options].some(option => option.value === selected)) dom.forcePrizeSelect.value = selected;
}

function renderPrizeEditor() {
  dom.prizeEditorList.innerHTML = '';
  editorDraft.forEach((prize, index) => {
    const row = document.createElement('div');
    row.className = 'prize-editor-row';

    const number = document.createElement('div');
    number.className = 'prize-editor-number';
    number.textContent = String(index + 1);

    const fields = document.createElement('div');
    fields.className = 'prize-editor-fields';

    const nameInput = document.createElement('input');
    nameInput.className = 'admin-input prize-name-input';
    nameInput.type = 'text';
    nameInput.value = prize.name;
    nameInput.setAttribute('aria-label', `Prize ${index + 1} name`);
    nameInput.addEventListener('input', () => { editorDraft[index].name = nameInput.value; });

    const lineInput = document.createElement('textarea');
    lineInput.className = 'admin-input prize-line-input';
    lineInput.rows = 2;
    lineInput.value = prize.line;
    lineInput.setAttribute('aria-label', `Prize ${index + 1} caption`);
    lineInput.addEventListener('input', () => { editorDraft[index].line = lineInput.value; });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'prize-delete-btn';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      if (editorDraft.length <= 2) {
        dom.adminStatus.textContent = 'Keep at least two prizes so the wheel still has something to do.';
        return;
      }
      editorDraft.splice(index, 1);
      renderPrizeEditor();
    });

    fields.append(nameInput, lineInput);
    row.append(number, fields, deleteButton);
    dom.prizeEditorList.appendChild(row);
  });
}

function savePrizeChanges() {
  const cleaned = normalisePrizeList(editorDraft);
  if (!cleaned) {
    dom.adminStatus.textContent = 'Please keep at least two named prizes.';
    return;
  }
  prizes = clonePrizes(cleaned);
  editorDraft = clonePrizes(prizes);
  forcedPrizeIndex = null;
  saveState({ customPrizes: clonePrizes(prizes) });
  populatePrizeSelector();
  renderPrizeEditor();
  drawWheel();
  dom.adminStatus.textContent = `${prizes.length} prizes saved. The wheel updated immediately.`;
}

function renderHistory() {
  const history = Array.isArray(state.ticketHistory) ? state.ticketHistory : [];
  dom.historyList.innerHTML = '';
  if (!history.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No claimed tickets yet. Cupid has paperwork to catch up on.';
    dom.historyList.appendChild(empty);
    return;
  }
  history.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    const title = document.createElement('strong');
    title.textContent = item.prize?.name || 'Mystery prize';
    const details = document.createElement('small');
    const claimed = item.claimedAt ? new Date(item.claimedAt).toLocaleDateString() : 'unknown';
    const expires = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'unknown';
    details.textContent = `Claimed ${claimed} · Expires ${expires} · ${item.code || ''}`;
    row.append(title, details);
    dom.historyList.appendChild(row);
  });
}

function openAdmin() {
  editorDraft = clonePrizes(prizes);
  refreshAdminControls();
  populatePrizeSelector();
  renderPrizeEditor();
  dom.adminPanel.classList.remove('hidden');
  dom.adminPanel.scrollTop = 0;
  dom.statusText.textContent = 'Admin mode unlocked. Cupid is now under questionable management.';
  setTimeout(() => dom.closeAdmin.focus(), 50);
}

function closeAdmin() {
  dom.adminPanel.classList.add('hidden');
  setLockedView();
}

function resetMonthlySpin() {
  const next = { ...state };
  delete next.lastSpinDate;
  delete next.lastSpinMonth;
  delete next.lastPrize;
  state = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  dom.lockedCard.classList.add('hidden');
  dom.adminStatus.textContent = 'Monthly spin reset. Romance bureaucracy cleared.';
  dom.statusText.textContent = 'Spin reset. Cupid is ready for another launch.';
}

function registerEvents() {
  dom.littleMan.addEventListener('pointerdown', startCupidDrag);
  dom.littleMan.addEventListener('pointermove', moveCupid);
  dom.littleMan.addEventListener('pointerup', releaseCupid);
  dom.littleMan.addEventListener('pointercancel', cancelCupid);
  dom.littleMan.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') spinWheel();
  });

  dom.closeTicket.addEventListener('click', claimTicket);
  dom.saveTicketPhoto.addEventListener('click', saveTicketAsPhoto);
  dom.secretHeart.addEventListener('click', openPasswordDialog);
  dom.titleTap.addEventListener('click', () => {
    titleTapCount += 1;
    clearTimeout(dom.titleTap._timer);
    dom.titleTap._timer = setTimeout(() => { titleTapCount = 0; }, 1600);
    if (titleTapCount >= 5) {
      titleTapCount = 0;
      openPasswordDialog();
    }
  });

  dom.passwordForm.addEventListener('submit', event => {
    event.preventDefault();
    if (dom.passwordInput.value !== PASSWORD) {
      dom.passwordError.textContent = 'Nope. Cupid says the password is wrong.';
      wobbleCupid();
      return;
    }
    closePasswordDialog();
    openAdmin();
  });
  dom.cancelPassword.addEventListener('click', closePasswordDialog);
  dom.closeAdmin.addEventListener('click', closeAdmin);

  dom.unlimitedToggle.addEventListener('change', () => {
    saveState({ adminSettings: { unlimited: dom.unlimitedToggle.checked } });
    refreshAdminControls();
    setLockedView();
  });
  dom.monthlyLockToggle.addEventListener('change', () => {
    saveState({ adminSettings: { monthlyLock: dom.monthlyLockToggle.checked } });
    refreshAdminControls();
    setLockedView();
  });
  dom.forcePrizeSelect.addEventListener('change', () => {
    forcedPrizeIndex = dom.forcePrizeSelect.value === '' ? null : Number(dom.forcePrizeSelect.value);
    dom.adminStatus.textContent = forcedPrizeIndex === null
      ? 'Next spin will be random.'
      : `Next spin forced to: ${prizes[forcedPrizeIndex].name}`;
  });
  dom.testSpin.addEventListener('click', () => {
    if (dom.forcePrizeSelect.value !== '') forcedPrizeIndex = Number(dom.forcePrizeSelect.value);
    closeAdmin();
    spinWheel(true);
  });
  dom.resetSpin.addEventListener('click', resetMonthlySpin);
  dom.forceAvailable.addEventListener('click', resetMonthlySpin);
  dom.previewTicket.addEventListener('click', () => {
    const index = dom.forcePrizeSelect.value === '' ? 0 : Number(dom.forcePrizeSelect.value);
    closeAdmin();
    revealPrize(index);
  });
  dom.viewHistory.addEventListener('click', () => {
    renderHistory();
    dom.historyPanel.classList.toggle('hidden');
  });
  dom.addPrize.addEventListener('click', () => {
    editorDraft.push({ name: 'New Prize', line: 'Add the funny little terms and conditions here.' });
    renderPrizeEditor();
    dom.prizeEditorList.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  dom.savePrizes.addEventListener('click', savePrizeChanges);
  dom.restorePrizes.addEventListener('click', () => {
    if (!window.confirm('Restore the original prize list? Your custom edits will be replaced.')) return;
    prizes = clonePrizes(DEFAULT_PRIZES);
    editorDraft = clonePrizes(DEFAULT_PRIZES);
    saveState({ customPrizes: null });
    forcedPrizeIndex = null;
    populatePrizeSelector();
    renderPrizeEditor();
    drawWheel();
    dom.adminStatus.textContent = 'Original prize list restored.';
  });
  dom.clearHistory.addEventListener('click', () => {
    if (!window.confirm('Clear all claimed ticket history?')) return;
    saveState({ ticketHistory: [] });
    renderHistory();
    dom.adminStatus.textContent = 'Ticket history cleared.';
  });
  dom.resetAll.addEventListener('click', () => {
    if (!window.confirm('Reset every prize, ticket and admin setting on this device?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    state = { ...DEFAULT_STATE, adminSettings: { ...DEFAULT_STATE.adminSettings }, ticketHistory: [] };
    prizes = clonePrizes(DEFAULT_PRIZES);
    editorDraft = clonePrizes(prizes);
    forcedPrizeIndex = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    populatePrizeSelector();
    renderPrizeEditor();
    refreshAdminControls();
    dom.historyPanel.classList.add('hidden');
    dom.ticket.classList.add('hidden');
    dom.lockedCard.classList.add('hidden');
    drawWheel();
    setLockedView();
    dom.adminStatus.textContent = 'All local app data reset. Testing mode is ready.';
  });
}

function scheduleWheelDraws() {
  drawWheel();
  requestAnimationFrame(drawWheel);
  setTimeout(drawWheel, 80);
  setTimeout(drawWheel, 240);
  window.addEventListener('load', drawWheel, { once: true });
  window.addEventListener('resize', () => requestAnimationFrame(drawWheel));
  window.addEventListener('orientationchange', () => setTimeout(drawWheel, 180));
  if (document.fonts?.ready) document.fonts.ready.then(drawWheel).catch(() => {});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => requestAnimationFrame(drawWheel));
    observer.observe(dom.canvas.parentElement);
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();
    } catch {
      // The app still works without offline caching.
    }
  });
}

function initialiseApp() {
  registerEvents();
  populatePrizeSelector();
  refreshAdminControls();
  renderPrizeEditor();
  updateModeCopy();
  scheduleWheelDraws();
  setLockedView();
  registerServiceWorker();
}

initialiseApp();
