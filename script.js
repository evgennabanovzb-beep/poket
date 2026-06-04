const canvas = document.querySelector("#chart");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const modeLabel = document.querySelector("#modeLabel");
const statusText = document.querySelector("#statusText");
const lastMove = document.querySelector("#lastMove");

const upButton = document.querySelector("#upButton");
const downButton = document.querySelector("#downButton");
const neutralButton = document.querySelector("#neutralButton");
const resetButton = document.querySelector("#resetButton");

const state = {
  points: [],
  price: 100,
  score: 0,
  mode: "neutral",
  impulseFrames: 0,
  frame: 0,
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function resetDemo() {
  state.points = [];
  state.price = 100;
  state.score = 0;
  state.mode = "neutral";
  state.impulseFrames = 0;
  state.frame = 0;

  for (let i = 0; i < 90; i += 1) {
    state.price += Math.sin(i / 7) * 0.08 + (Math.random() - 0.5) * 0.12;
    state.points.push(state.price);
  }

  updateCopy("Neutral drift", "The chart is idling with small local movements.", "Last move: none");
  scoreEl.textContent = state.score;
}

function updateCopy(mode, status, movement) {
  modeLabel.textContent = mode;
  statusText.textContent = status;
  lastMove.textContent = movement;
}

function setDirection(direction) {
  state.mode = direction;
  state.impulseFrames = 130;

  if (direction === "up") {
    state.score += 1;
    updateCopy("Upward animation", "A local scripted impulse is pushing the generated line upward.", "Last move: pushed up");
  } else if (direction === "down") {
    state.score += 1;
    updateCopy("Downward animation", "A local scripted impulse is pushing the generated line downward.", "Last move: pushed down");
  } else {
    updateCopy("Neutral drift", "The chart returned to idle generated motion.", "Last move: neutral drift");
  }

  scoreEl.textContent = state.score;
}

function nextPrice() {
  const wave = Math.sin(state.frame / 12) * 0.045;
  const noise = (Math.random() - 0.5) * 0.09;
  let directed = 0;

  if (state.impulseFrames > 0) {
    const easing = state.impulseFrames / 130;
    directed = state.mode === "up" ? 0.34 * easing : state.mode === "down" ? -0.34 * easing : 0;
    state.impulseFrames -= 1;
  } else if (state.mode !== "neutral") {
    state.mode = "neutral";
    updateCopy("Neutral drift", "The scripted impulse finished and the chart is idling again.", "Last move: impulse complete");
  }

  state.price += wave + noise + directed;
  state.points.push(state.price);
  state.points = state.points.slice(-120);
  state.frame += 1;
}

function drawGrid(width, height) {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += width / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += height / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawChart() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  drawGrid(width, height);

  const min = Math.min(...state.points) - 1;
  const max = Math.max(...state.points) + 1;
  const range = max - min || 1;

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#60a5fa");
  gradient.addColorStop(0.5, "#a78bfa");
  gradient.addColorStop(1, state.mode === "down" ? "#ef4444" : "#22c55e");

  ctx.beginPath();
  state.points.forEach((point, index) => {
    const x = (index / (state.points.length - 1)) * width;
    const y = height - ((point - min) / range) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.shadowColor = state.mode === "down" ? "rgba(239, 68, 68, 0.35)" : "rgba(34, 197, 94, 0.35)";
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const latest = state.points[state.points.length - 1];
  const latestY = height - ((latest - min) / range) * height;
  ctx.fillStyle = state.mode === "down" ? "#ef4444" : "#22c55e";
  ctx.beginPath();
  ctx.arc(width - 6, latestY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.font = "800 64px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SIMULATION", width / 2, height / 2);
}

function tick() {
  nextPrice();
  drawChart();
  requestAnimationFrame(tick);
}

upButton.addEventListener("click", () => setDirection("up"));
downButton.addEventListener("click", () => setDirection("down"));
neutralButton.addEventListener("click", () => setDirection("neutral"));
resetButton.addEventListener("click", resetDemo);
window.addEventListener("resize", () => {
  resizeCanvas();
  drawChart();
});

resizeCanvas();
resetDemo();
tick();
