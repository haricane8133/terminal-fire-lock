#!/usr/bin/env node

const readline = require('readline');

const THEMES = ['fire', 'matrix', 'stars', 'static', 'rain'];

const DAY_NAMES = {
  mon: 0, monday: 0,
  tue: 1, tuesday: 1,
  wed: 2, wednesday: 2,
  thu: 3, thursday: 3,
  fri: 4, friday: 4,
  sat: 5, saturday: 5,
  sun: 6, sunday: 6,
};

// =============================================================================
// CONFIGURATION (can be overridden via CLI args)
// =============================================================================
const CONFIG = {
  frameDelayMs: 30,
  passphraseWords: ['please', 'sorry'],
  bannerText: '!! ACCESS DENIED !!',
  hint: null,
  activeStartTime: null,
  activeEndTime: null,
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  activeDates: null,
  timeout: null,
  exitMessages: ['Access granted...', 'Welcome back, friend.', 'Remember: With great power comes great responsibility.'],
  messageDelay: 1000,
  blockSignals: true,
  theme: 'fire',
  randomTheme: false,
  sound: false,
};

// =============================================================================
// PARSE CLI ARGS
// =============================================================================
function parseDays(val) {
  if (!val || !val.trim()) return [];
  return val.split(',').map(d => {
    const trimmed = d.trim().toLowerCase();
    if (DAY_NAMES[trimmed] !== undefined) return DAY_NAMES[trimmed];
    const num = parseInt(trimmed, 10);
    // Validate numeric range 0-6
    return (!isNaN(num) && num >= 0 && num <= 6) ? num : NaN;
  }).filter(d => !isNaN(d));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let lastThemeArg = null; // Track whether --theme or --random-theme came last

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '-d':
      case '--delay':
        CONFIG.frameDelayMs = parseInt(next, 10) || 30;
        i++;
        break;
      case '-p':
      case '--passphrase': {
        const words = (next || '').split(',').map(w => w.trim().toLowerCase()).filter(w => w);
        if (words.length > 0) CONFIG.passphraseWords = words;
        i++;
        break;
      }
      case '-b':
      case '--banner':
        CONFIG.bannerText = next || CONFIG.bannerText;
        i++;
        break;
      case '--hint':
        CONFIG.hint = next || null;
        i++;
        break;
      case '-t':
      case '--theme':
        CONFIG.theme = (next || 'fire').toLowerCase();
        lastThemeArg = 'explicit';
        i++;
        break;
      case '-r':
      case '--random-theme':
        CONFIG.randomTheme = true;
        lastThemeArg = 'random';
        break;
      case '-s':
      case '--start-time':
        CONFIG.activeStartTime = next || null;
        i++;
        break;
      case '-e':
      case '--end-time':
        CONFIG.activeEndTime = next || null;
        i++;
        break;
      case '--days': {
        const parsed = parseDays(next || '');
        if (parsed.length > 0) CONFIG.activeDays = parsed;
        i++;
        break;
      }
      case '--dates':
        CONFIG.activeDates = (next || '').split(',').map(d => d.trim()).filter(d => d);
        i++;
        break;
      case '--timeout':
        CONFIG.timeout = parseInt(next, 10) || null;
        i++;
        break;
      case '-m':
      case '--messages': {
        const msgs = (next || '').split('|').map(m => m.trim()).filter(m => m);
        if (msgs.length > 0) CONFIG.exitMessages = msgs;
        i++;
        break;
      }
      case '--message-delay':
        CONFIG.messageDelay = parseInt(next, 10) || 1000;
        i++;
        break;
      case '--sound':
        CONFIG.sound = true;
        break;
      case '--no-block-signals':
        CONFIG.blockSignals = false;
        break;
      case '-v':
      case '--version':
        console.log(require('./package.json').version);
        process.exit(0);
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  // --random-theme wins only if it was the last theme-related arg
  if (lastThemeArg === 'random') {
    CONFIG.theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  // Validate theme
  if (!THEMES.includes(CONFIG.theme)) {
    console.error(`Unknown theme "${CONFIG.theme}". Valid themes: ${THEMES.join(', ')}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
terminal-fire-lock - A fun terminal lock with animations

Usage: terminal-fire-lock [options]

Options:
  -d, --delay <ms>           Frame delay in milliseconds (default: 30)
  -p, --passphrase <words>   Comma-separated passphrase words (default: please,sorry)
  -b, --banner <text>        Banner text to display (default: !! ACCESS DENIED !!)
      --hint <text>          Hint text shown below the banner
  -t, --theme <name>         Animation theme (default: fire)
  -r, --random-theme         Pick a random theme (overrides --theme if specified after it)
  -s, --start-time <HH:MM>   Active start time, 24h format (default: always)
  -e, --end-time <HH:MM>     Active end time, 24h format (default: always)
      --days <days>          Active days as numbers (0=Mon) or names (mon,tue,...)
      --dates <dates>        Only active on specific dates, comma-separated YYYY-MM-DD
      --timeout <seconds>    Auto-exit after N seconds without passphrase
  -m, --messages <msgs>      Exit messages, pipe-separated
      --message-delay <ms>   Delay between exit messages in ms (default: 1000)
      --sound                Enable sound effects (terminal bell)
      --no-block-signals     Allow CTRL+C to exit
  -v, --version              Show version number
  -h, --help                 Show this help

Themes:
  fire    - Classic ASCII fire animation (default)
  matrix  - Falling green Matrix-style characters
  stars   - Twinkling starfield
  static  - TV static/noise
  rain    - Falling rain drops

Examples:
  terminal-fire-lock
  terminal-fire-lock -p "secret,code" -b "SYSTEM LOCKED"
  terminal-fire-lock --theme matrix --sound
  terminal-fire-lock -s "09:00" -e "17:00" --days "mon,tue,wed,thu,fri"
  terminal-fire-lock --dates "2026-02-24,2026-02-25" -s "10:30" -e "15:30"
  terminal-fire-lock --random-theme --hint "Think about what you did"
  terminal-fire-lock --timeout 60
`);
}

parseArgs();

// =============================================================================
// TIME & DATE CHECK
// =============================================================================
function todayLocalString() {
  // Use local date string to avoid UTC timezone mismatch
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWithinActivePeriod() {
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Convert to Mon=0

  // Check specific dates if provided
  if (CONFIG.activeDates && CONFIG.activeDates.length > 0) {
    if (!CONFIG.activeDates.includes(todayLocalString())) return false;
  }

  // Check time window if either time is provided
  if (CONFIG.activeStartTime || CONFIG.activeEndTime) {
    // Day check only applies when a time window is set
    if (!CONFIG.activeDays.includes(currentDay)) return false;

    const [startH, startM] = (CONFIG.activeStartTime || '00:00').split(':').map(Number);
    const [endH, endM]     = (CONFIG.activeEndTime   || '23:59').split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes   = startH * 60 + startM;
    const endMinutes     = endH   * 60 + endM;

    if (startMinutes <= endMinutes) {
      if (!(currentMinutes >= startMinutes && currentMinutes <= endMinutes)) return false;
    } else {
      // Overnight range e.g. 22:00 to 06:00
      if (!(currentMinutes >= startMinutes || currentMinutes <= endMinutes)) return false;
    }
  }

  return true;
}

if (!isWithinActivePeriod()) {
  process.exit(1);
}

// =============================================================================
// SOUND EFFECTS
// =============================================================================
function playBeep() {
  if (CONFIG.sound) process.stdout.write('\x07');
}

function playUnlockSound() {
  if (!CONFIG.sound) return;
  let count = 0;
  const interval = setInterval(() => {
    process.stdout.write('\x07');
    if (++count >= 3) clearInterval(interval);
  }, 150);
}

// =============================================================================
// TERMINAL SETUP
// =============================================================================
let width = process.stdout.columns || 80;
let height = process.stdout.rows || 24;
let size = width * height;
let inputBuffer = '';
let running = true;
let loopTimeout = null;
let timeoutHandle = null;

process.stdout.on('resize', () => {
  width = process.stdout.columns || 80;
  height = process.stdout.rows || 24;
  size = width * height;
  initTheme();
});

// =============================================================================
// SIGNAL HANDLERS
// =============================================================================
if (CONFIG.blockSignals) {
  process.on('SIGINT',  playBeep);
  process.on('SIGTSTP', playBeep);
  process.on('SIGQUIT', playBeep);
}

// =============================================================================
// THEME: FIRE
// =============================================================================
const fireChars = [' ', '.', ':', '^', '*', 'x', 's', 'S', '#', '$'];
let fireBuffer = [];

function initFire() {
  fireBuffer = new Array(size + width + 1).fill(0);
}

function renderFire() {
  for (let i = 0; i < Math.floor(width / 9); i++) {
    const idx = Math.floor(Math.random() * width) + width * (height - 1);
    if (idx < fireBuffer.length) fireBuffer[idx] = 65;
  }
  for (let i = 0; i < size; i++) {
    if (i + width + 1 < fireBuffer.length) {
      fireBuffer[i] = Math.floor((fireBuffer[i] + fireBuffer[i + 1] + fireBuffer[i + width] + fireBuffer[i + width + 1]) / 4);
    }
  }
  let output = '\x1b[H';
  for (let y = 0; y < height - 1; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const val = fireBuffer[i] || 0;
      const color = val > 15 ? '\x1b[93;1m' : val > 9 ? '\x1b[33m' : val > 4 ? '\x1b[31m' : '\x1b[30m';
      line += color + fireChars[val > 9 ? 9 : val];
    }
    output += line + '\x1b[0m\n';
  }
  return output;
}

// =============================================================================
// THEME: MATRIX
// =============================================================================
const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let matrixDrops = [];

function initMatrix() {
  matrixDrops = [];
  for (let x = 0; x < width; x++) {
    matrixDrops.push({
      y: Math.floor(Math.random() * height),
      speed: 0.5 + Math.random() * 1.5,
      length: 5 + Math.floor(Math.random() * 15),
    });
  }
}

function renderMatrix() {
  let output = '\x1b[H';
  const screen = Array.from({ length: height - 1 }, () =>
    Array(width).fill({ char: ' ', brightness: 0 })
  );
  for (let x = 0; x < width; x++) {
    const drop = matrixDrops[x];
    drop.y += drop.speed;
    if (drop.y > height + drop.length) {
      drop.y = -drop.length;
      drop.speed = 0.5 + Math.random() * 1.5;
      drop.length = 5 + Math.floor(Math.random() * 15);
    }
    for (let i = 0; i < drop.length; i++) {
      const y = Math.floor(drop.y) - i;
      if (y >= 0 && y < height - 1) {
        screen[y][x] = { char: matrixChars[Math.floor(Math.random() * matrixChars.length)], brightness: i === 0 ? 3 : i < 3 ? 2 : 1 };
      }
    }
  }
  for (let y = 0; y < height - 1; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const { char, brightness } = screen[y][x];
      line += brightness === 3 ? '\x1b[97;1m' + char : brightness === 2 ? '\x1b[92;1m' + char : brightness === 1 ? '\x1b[32m' + char : '\x1b[30m ';
    }
    output += line + '\x1b[0m\n';
  }
  return output;
}

// =============================================================================
// THEME: STARS
// =============================================================================
let stars = [];

function initStars() {
  stars = [];
  const numStars = Math.floor(size * 0.02);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * (height - 1)),
      twinkleSpeed: 0.02 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function renderStars() {
  const starChars = ['.', '+', '*', 'o', 'O'];
  const screen = Array.from({ length: height - 1 }, () => new Array(width).fill(null));

  for (const star of stars) {
    star.phase += star.twinkleSpeed;
    const brightness = (Math.sin(star.phase) + 1) / 2;
    const charIdx = Math.floor(brightness * (starChars.length - 1));
    if (star.y < height - 1 && star.x < width) {
      const color = brightness > 0.8 ? '\x1b[97;1m' : brightness > 0.5 ? '\x1b[37m' : brightness > 0.2 ? '\x1b[90m' : '\x1b[30m';
      screen[star.y][star.x] = color + starChars[charIdx] + '\x1b[0m';
    }
  }

  let output = '\x1b[H';
  for (let y = 0; y < height - 1; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      line += screen[y][x] || '\x1b[30m ';
    }
    output += line + '\n';
  }
  return output;
}

// =============================================================================
// THEME: STATIC
// =============================================================================
const staticChars = ' .:-=+*#%@';
const staticColors = ['\x1b[30m', '\x1b[90m', '\x1b[37m', '\x1b[97m', '\x1b[97;1m'];

function initStatic() {}

function renderStatic() {
  let output = '\x1b[H';
  for (let y = 0; y < height - 1; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const val = Math.random();
      line += staticColors[Math.floor(val * 5)] + staticChars[Math.floor(val * staticChars.length)];
    }
    output += line + '\x1b[0m\n';
  }
  return output;
}

// =============================================================================
// THEME: RAIN
// =============================================================================
let rainDrops = [];

function initRain() {
  rainDrops = [];
  for (let i = 0; i < Math.floor(width * 0.3); i++) {
    rainDrops.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      speed: 1 + Math.random() * 2,
      char: Math.random() > 0.5 ? '|' : ':',
    });
  }
}

function renderRain() {
  const screen = Array.from({ length: height - 1 }, () => new Array(width).fill(null));
  for (const drop of rainDrops) {
    drop.y += drop.speed;
    if (drop.y >= height - 1) {
      drop.y = 0;
      drop.x = Math.floor(Math.random() * width);
      drop.speed = 1 + Math.random() * 2;
    }
    const y = Math.floor(drop.y);
    if (y >= 0 && y < height - 1 && drop.x < width) {
      screen[y][drop.x] = '\x1b[94m' + drop.char + '\x1b[0m';
      if (y > 0) screen[y - 1][drop.x] = '\x1b[34m' + drop.char + '\x1b[0m';
    }
  }
  let output = '\x1b[H';
  for (let y = 0; y < height - 1; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      line += screen[y][x] || '\x1b[30m ';
    }
    output += line + '\n';
  }
  return output;
}

// =============================================================================
// THEME CONTROLLER
// =============================================================================
function initTheme() {
  switch (CONFIG.theme) {
    case 'matrix': initMatrix(); break;
    case 'stars':  initStars();  break;
    case 'static': initStatic(); break;
    case 'rain':   initRain();   break;
    default:       initFire();   break;
  }
}

function renderTheme() {
  switch (CONFIG.theme) {
    case 'matrix': return renderMatrix();
    case 'stars':  return renderStars();
    case 'static': return renderStatic();
    case 'rain':   return renderRain();
    default:       return renderFire();
  }
}

function getBannerColors() {
  switch (CONFIG.theme) {
    case 'matrix': return '\x1b[42;30;1m';
    case 'stars':  return '\x1b[44;97;1m';
    case 'static': return '\x1b[47;30;1m';
    case 'rain':   return '\x1b[44;97;1m';
    default:       return '\x1b[41;97;1m';
  }
}

// =============================================================================
// INPUT HANDLING
// =============================================================================
function setupInput() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('keypress', (ch, key) => {
    if (!running) return;

    if (ch && ch.length === 1) {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) inputBuffer += ch;
    } else if (key && key.name === 'backspace') {
      inputBuffer = inputBuffer.slice(0, -1);
    }

    if (inputBuffer.length > 1000) inputBuffer = inputBuffer.slice(-500);

    if (checkPassphrase(inputBuffer)) {
      running = false;
      if (loopTimeout)   clearTimeout(loopTimeout);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      playUnlockSound();
      showExitMessages();
    }
  });
}

function checkPassphrase(buf) {
  // Guard against empty passphrase unlocking instantly
  const words = CONFIG.passphraseWords.filter(w => w);
  if (words.length === 0) return false;
  const lower = buf.toLowerCase();
  return words.every(word => lower.includes(word));
}

// =============================================================================
// AUTO-TIMEOUT
// =============================================================================
function setupTimeout() {
  if (!CONFIG.timeout) return;
  timeoutHandle = setTimeout(() => {
    running = false;
    if (loopTimeout) clearTimeout(loopTimeout);
    cleanup();
    process.exit(1);
  }, CONFIG.timeout * 1000);
}

// =============================================================================
// EXIT SEQUENCE
// =============================================================================
function showExitMessages() {
  process.stdout.write('\x1b[2J\x1b[H');
  let index = 0;

  const printNext = () => {
    if (index >= CONFIG.exitMessages.length) {
      setTimeout(() => {
        cleanup();
        process.exit(0);
      }, CONFIG.messageDelay);
      return;
    }
    const msg = CONFIG.exitMessages[index];
    const padding = Math.max(0, Math.floor((width - msg.length) / 2));
    const row = Math.floor(height / 2) - Math.floor(CONFIG.exitMessages.length / 2) + index + 1;
    process.stdout.write(`\x1b[${row};${padding}H\x1b[32;1m${msg}\x1b[0m`);
    index++;
    setTimeout(printNext, CONFIG.messageDelay);
  };

  printNext();
}

// =============================================================================
// MAIN RENDER
// =============================================================================
function render() {
  if (!running) return;

  process.stdout.write(renderTheme());

  const bannerY = Math.floor(height / 2);
  const paddedBanner = `  ${CONFIG.bannerText}  `;
  const bannerX = Math.max(1, Math.floor((width - paddedBanner.length) / 2));
  process.stdout.write(`\x1b[${bannerY};${bannerX}H${getBannerColors()}${paddedBanner}\x1b[0m`);

  if (CONFIG.hint) {
    const hintY = bannerY + 2;
    const hintX = Math.max(1, Math.floor((width - CONFIG.hint.length) / 2));
    process.stdout.write(`\x1b[${hintY};${hintX}H\x1b[33m${CONFIG.hint}\x1b[0m`);
  }
}

// =============================================================================
// MAIN LOOP
// =============================================================================
function loop() {
  if (!running) return;
  render();
  loopTimeout = setTimeout(loop, CONFIG.frameDelayMs);
}

function cleanup() {
  process.stdin.removeAllListeners('keypress');
  process.stdout.removeAllListeners('resize');
  if (CONFIG.blockSignals) {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTSTP');
    process.removeAllListeners('SIGQUIT');
  }
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdout.write('\x1b[?25h\x1b[0m');
  process.stdout.write('\x1b[2J\x1b[H');
}

function start() {
  process.stdout.write('\x1b[?25l\x1b[2J\x1b[H');
  initTheme();
  setupInput();
  setupTimeout();
  loop();
}

process.once('exit', cleanup);
start();
