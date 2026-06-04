const canvas = document.querySelector('#chart');
const ctx = canvas.getContext('2d');
const balanceEl = document.querySelector('#balance');
const priceEl = document.querySelector('#price');
const stakeInput = document.querySelector('#stake');
const durationInput = document.querySelector('#duration');
const upButton = document.querySelector('#upButton');
const downButton = document.querySelector('#downButton');
const resetButton = document.querySelector('#resetButton');
const tradeLog = document.querySelector('#tradeLog');

const initialBalance = 10000;
const payoutRate = 0.82;
const candleCount = 42;
let balance = initialBalance;
let price = 1.2842;
let candles = createCandles();
let activeAnimation = null;

function createCandles() {
  const output = [];
  let lastClose = 1.279;

  for (let index = 0; index < candleCount; index += 1) {
    const wave = Math.sin(index * 0.75) * 0.0018;
    const drift = (index - candleCount / 2) * 0.00003;
    const open = lastClose;
    const close = open + wave * 0.28 + drift;
    const high = Math.max(open, close) + 0.0011 + Math.abs(Math.cos(index)) * 0.0007;
    const low = Math.min(open, close) - 0.0011 - Math.abs(Math.sin(index)) * 0.0007;
    output.push({ open, high, low, close });
    lastClose = close;
  }

  price = output.at(-1).close;
  return output;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawChart();
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value) {
  return value.toFixed(5);
}

function getScale() {
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const min = Math.min(...lows) - 0.001;
  const max = Math.max(...highs) + 0.001;
  const rect = canvas.getBoundingClientRect();
  const top = 28;
  const bottom = rect.height - 32;

  return {
    width: rect.width,
    height: rect.height,
    top,
    bottom,
    y(value) {
      return bottom - ((value - min) / (max - min)) * (bottom - top);
    },
  };
}

function drawGrid(scale) {
  ctx.clearRect(0, 0, scale.width, scale.height);
  ctx.fillStyle = '#09131d';
  ctx.fillRect(0, 0, scale.width, scale.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;

  for (let x = 0; x < scale.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, scale.height);
    ctx.stroke();
  }

  for (let y = 40; y < scale.height; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(scale.width, y);
    ctx.stroke();
  }
}

function drawCandle(candle, x, bodyWidth, scale, isActive = false) {
  const bullish = candle.close >= candle.open;
  const color = bullish ? '#1ed98b' : '#ff5c7a';
  const openY = scale.y(candle.open);
  const closeY = scale.y(candle.close);
  const highY = scale.y(candle.high);
  const lowY = scale.y(candle.low);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(3, Math.abs(closeY - openY));

  ctx.strokeStyle = color;
  ctx.lineWidth = isActive ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(x, highY);
  ctx.lineTo(x, lowY);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.globalAlpha = isActive ? 1 : 0.92;
  ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
  ctx.globalAlpha = 1;
}

function drawPriceLine(scale) {
  const y = scale.y(price);
  ctx.strokeStyle = 'rgba(100,168,255,0.9)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(scale.width, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64a8ff';
  ctx.fillRect(scale.width - 104, y - 15, 96, 30);
  ctx.fillStyle = '#03111e';
  ctx.font = '700 13px Inter, sans-serif';
  ctx.fillText(formatPrice(price), scale.width - 94, y + 5);
}

function drawChart() {
  const scale = getScale();
  drawGrid(scale);

  const gap = scale.width / (candles.length + 4);
  const bodyWidth = Math.max(7, Math.min(16, gap * 0.55));

  candles.forEach((candle, index) => {
    const x = gap * (index + 2);
    drawCandle(candle, x, bodyWidth, scale, index === candles.length - 1);
  });

  drawPriceLine(scale);
  priceEl.textContent = formatPrice(price);
}

function setTradingEnabled(enabled) {
  upButton.disabled = !enabled;
  downButton.disabled = !enabled;
}

function addLog(direction, stake, profit) {
  const item = document.createElement('li');
  const directionClass = direction === 'up' ? 'direction-up' : 'direction-down';
  const directionText = direction === 'up' ? 'ВВЕРХ' : 'ВНИЗ';
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  item.innerHTML = `
    <time>${time}</time>
    <span><strong class="${directionClass}">${directionText}</strong> • демо-сделка ${formatCurrency(stake)}</span>
    <span class="win">+${formatCurrency(profit)}</span>
  `;
  tradeLog.prepend(item);
}

function animateTrade(direction) {
  if (activeAnimation) return;

  const stake = Math.max(1, Number(stakeInput.value) || 1);
  const duration = Number(durationInput.value);
  const startPrice = price;
  const delta = direction === 'up' ? 0.0048 : -0.0048;
  const endPrice = startPrice + delta;
  const activeCandle = candles.at(-1);
  const startClose = activeCandle.close;
  const startHigh = activeCandle.high;
  const startLow = activeCandle.low;
  const startedAt = performance.now();

  setTradingEnabled(false);
  activeAnimation = requestAnimationFrame(function tick(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    price = startPrice + delta * eased;
    activeCandle.close = startClose + delta * eased;
    activeCandle.high = Math.max(startHigh, activeCandle.open, activeCandle.close) + 0.0005;
    activeCandle.low = Math.min(startLow, activeCandle.open, activeCandle.close) - 0.0005;
    drawChart();

    if (progress < 1) {
      activeAnimation = requestAnimationFrame(tick);
      return;
    }

    price = endPrice;
    activeCandle.close = endPrice;
    const profit = stake * payoutRate;
    balance += profit;
    balanceEl.textContent = formatCurrency(balance);
    addLog(direction, stake, profit);
    activeAnimation = null;
    setTradingEnabled(true);
  });
}

function resetDemo() {
  if (activeAnimation) {
    cancelAnimationFrame(activeAnimation);
    activeAnimation = null;
  }
  balance = initialBalance;
  candles = createCandles();
  balanceEl.textContent = formatCurrency(balance);
  tradeLog.innerHTML = '';
  setTradingEnabled(true);
  drawChart();
}

upButton.addEventListener('click', () => animateTrade('up'));
downButton.addEventListener('click', () => animateTrade('down'));
resetButton.addEventListener('click', resetDemo);
window.addEventListener('resize', resizeCanvas);

balanceEl.textContent = formatCurrency(balance);
resizeCanvas();
