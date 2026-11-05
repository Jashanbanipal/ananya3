const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const overlay = document.getElementById('overlay');

const game = {
  state: 'ready',
  gravity: 0.64,
  groundY: 202,
  speed: 6,
  score: 0,
  bestScore: Number(localStorage.getItem('dino-best-score') || 0),
  lastTime: 0,
  spawnTimer: 0,
  obstacleChance: 0.8,
};

const dino = {
  x: 64,
  y: game.groundY - 44,
  width: 42,
  height: 44,
  vy: 0,
  jumpStrength: 12,
  grounded: true,
  legPhase: 0,
};

const obstacles = [];

function resetDino() {
  dino.y = game.groundY - dino.height;
  dino.vy = 0;
  dino.grounded = true;
  dino.legPhase = 0;
}

function updateHud() {
  scoreEl.textContent = String(Math.floor(game.score));
  bestScoreEl.textContent = String(game.bestScore);
}

function setOverlay(message, show = true) {
  overlay.innerHTML = `<h1>${message}</h1><p>Jump over obstacles and survive as long as you can.</p>`;
  overlay.classList.toggle('visible', show);
}

function startGame() {
  if (game.state === 'running') return;

  if (game.state === 'gameover') {
    obstacles.length = 0;
    game.score = 0;
    game.speed = 6;
    game.spawnTimer = 0;
    resetDino();
  }

  game.state = 'running';
  overlay.classList.remove('visible');
}

function endGame() {
  game.state = 'gameover';
  game.bestScore = Math.max(game.bestScore, Math.floor(game.score));
  localStorage.setItem('dino-best-score', String(game.bestScore));
  updateHud();
  setOverlay('Game Over', true);
}

function jump() {
  if (game.state === 'ready') {
    startGame();
  }

  if (game.state !== 'running') return;

  if (dino.grounded) {
    dino.vy = -dino.jumpStrength;
    dino.grounded = false;
  }
}

function createObstacle() {
  const typeRoll = Math.random();
  const width = typeRoll < 0.7 ? randomRange(20, 36) : randomRange(26, 48);
  const height = typeRoll < 0.7 ? randomRange(30, 56) : randomRange(18, 36);

  obstacles.push({
    x: canvas.width + 20,
    y: game.groundY - height,
    width,
    height,
    type: typeRoll < 0.7 ? 'cactus' : 'bird',
    wingPhase: Math.random() * Math.PI * 2,
  });
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function update(delta) {
  if (game.state !== 'running') return;

  game.score += delta * 0.016;
  game.speed += delta * 0.0007;
  game.spawnTimer += delta;

  if (game.spawnTimer > Math.max(1000, 1800 - game.speed * 40)) {
    createObstacle();
    game.spawnTimer = 0;
  }

  dino.vy += game.gravity;
  dino.y += dino.vy;

  const groundTop = game.groundY - dino.height;
  if (dino.y >= groundTop) {
    dino.y = groundTop;
    dino.vy = 0;
    dino.grounded = true;
  }

  dino.legPhase += delta * 0.015;

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.x -= game.speed + delta * 0.009;

    if (obstacle.type === 'bird') {
      obstacle.y = game.groundY - obstacle.height - 28 + Math.sin((performance.now() * 0.01) + obstacle.wingPhase) * 16;
    }

    if (obstacle.x + obstacle.width < -20) {
      obstacles.splice(i, 1);
      continue;
    }

    if (checkCollision(dino, obstacle)) {
      endGame();
      return;
    }
  }

  updateHud();
}

function checkCollision(dinoObj, obstacle) {
  const dinoBox = {
    x: dinoObj.x + 8,
    y: dinoObj.y + 6,
    width: dinoObj.width - 12,
    height: dinoObj.height - 6,
  };

  const obsBox = {
    x: obstacle.x,
    y: obstacle.y,
    width: obstacle.width,
    height: obstacle.height,
  };

  return (
    dinoBox.x < obsBox.x + obsBox.width &&
    dinoBox.x + dinoBox.width > obsBox.x &&
    dinoBox.y < obsBox.y + obsBox.height &&
    dinoBox.y + dinoBox.height > obsBox.y
  );
}

function drawGround() {
  ctx.fillStyle = '#3f3f3f';
  ctx.fillRect(0, game.groundY, canvas.width, canvas.height - game.groundY);

  ctx.strokeStyle = '#6d6d6d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, game.groundY);
  ctx.lineTo(canvas.width, game.groundY);
  ctx.stroke();

  const offset = (game.score * 2.5) % 32;
  for (let x = -32; x < canvas.width + 32; x += 32) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - offset, game.groundY + 12, 18, 6);
    ctx.fillRect(x - offset + 10, game.groundY + 4, 10, 6);
  }
}

function drawCactus(x, y, width, height) {
  ctx.fillStyle = '#2a9d5b';
  ctx.fillRect(x, y, width, height);
  ctx.fillRect(x + width * 0.2, y - 16, width * 0.6, 16);
  ctx.fillStyle = '#1f7f49';
  ctx.fillRect(x + width * 0.18, y + 12, 6, height - 12);
  ctx.fillRect(x + width * 0.7, y + 12, 6, height - 12);
}

function drawBird(x, y, width, height) {
  const wingLift = Math.sin(performance.now() * 0.01) * 6;

  ctx.fillStyle = '#ff7a18';
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.5);
  ctx.quadraticCurveTo(x + width * 0.4, y - wingLift, x + width, y + height * 0.5);
  ctx.quadraticCurveTo(x + width * 0.6, y + height * 0.9, x, y + height * 0.5);
  ctx.fill();

  ctx.fillStyle = '#1d1d1d';
  ctx.fillRect(x + width * 0.78, y + height * 0.38, 4, 4);
}

function drawDino() {
  const { x, y, width, height } = dino;
  const legSwing = Math.sin(dino.legPhase) * 6;

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(x + 7, y + 12, width - 12, height - 12);
  ctx.fillRect(x + width * 0.2, y, width * 0.42, 14);
  ctx.fillRect(x + width * 0.68, y + 6, 12, 12);

  ctx.fillStyle = '#d5d5d5';
  ctx.fillRect(x + 8, y + 15, width - 14, 8);

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(x + width * 0.72, y + 18, 6, 6);

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(x + 10, y + height - 2, 10, 8 + legSwing);
  ctx.fillRect(x + width - 18, y + height - 2, 10, 8 - legSwing);
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (obstacle.type === 'cactus') {
      drawCactus(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      drawBird(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGround();
  drawObstacles();
  drawDino();
}

function tick(timestamp) {
  const delta = Math.min(32, timestamp - game.lastTime || 16);
  game.lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault();
    if (game.state === 'ready' || game.state === 'gameover') {
      game.score = 0;
      scoreEl.textContent = '0';
      obstacles.length = 0;
      setOverlay('Press Space to Start', false);
      startGame();
    }
    jump();
  }
});

canvas.addEventListener('pointerdown', () => {
  if (game.state === 'ready' || game.state === 'gameover') {
    game.score = 0;
    scoreEl.textContent = '0';
    obstacles.length = 0;
    setOverlay('Press Space to Start', false);
    startGame();
  }
  jump();
});

updateHud();
setOverlay('Press Space to Start', true);
requestAnimationFrame(tick);
