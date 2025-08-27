(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const gridSize = 24; // logical grid size (24x24 cells)
  const cellSize = canvas.width / gridSize; // pixel size per cell

  const Direction = {
    Up: 'Up',
    Down: 'Down',
    Left: 'Left',
    Right: 'Right'
  };

  let snake = [];
  let direction = Direction.Right;
  let pendingDirection = Direction.Right;
  let food = null;
  let score = 0;
  let highscore = Number(localStorage.getItem('snake_highscore') || '0');
  let isRunning = false;
  let isGameOver = false;
  let tickMs = 120;
  let lastTick = 0;

  const scoreEl = document.getElementById('score');
  const overlayEl = document.getElementById('overlay');
  const overlayTitleEl = document.getElementById('overlay-title');
  const overlayTextEl = document.getElementById('overlay-text');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  function showOverlay(title, text) {
    overlayTitleEl.textContent = title;
    overlayTextEl.textContent = text;
    overlayEl.classList.add('visible');
  }

  function hideOverlay() {
    overlayEl.classList.remove('visible');
  }

  function initGame() {
    snake = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 }
    ];
    direction = Direction.Right;
    pendingDirection = Direction.Right;
    score = 0;
    updateScore(0);
    isRunning = false;
    isGameOver = false;
    tickMs = 120;
    spawnFood();
    draw();
  }

  function updateScore(delta) {
    score += delta;
    scoreEl.textContent = `${score}`;
  }

  function spawnFood() {
    while (true) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const onSnake = snake.some(seg => seg.x === x && seg.y === y);
      if (!onSnake) {
        food = { x, y };
        return;
      }
    }
  }

  function setDirectionFromKey(key) {
    if (key === 'ArrowUp' && direction !== Direction.Down) pendingDirection = Direction.Up;
    else if (key === 'ArrowDown' && direction !== Direction.Up) pendingDirection = Direction.Down;
    else if (key === 'ArrowLeft' && direction !== Direction.Right) pendingDirection = Direction.Left;
    else if (key === 'ArrowRight' && direction !== Direction.Left) pendingDirection = Direction.Right;
  }

  function step() {
    direction = pendingDirection;
    const head = { ...snake[0] };
    if (direction === Direction.Up) head.y -= 1;
    else if (direction === Direction.Down) head.y += 1;
    else if (direction === Direction.Left) head.x -= 1;
    else if (direction === Direction.Right) head.x += 1;

    // Wall collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
      return endGame();
    }

    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      return endGame();
    }

    snake.unshift(head);

    // Food
    if (food && head.x === food.x && head.y === food.y) {
      updateScore(1);
      // speed up slightly every 4 points
      if (score % 4 === 0 && tickMs > 60) tickMs -= 6;
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function endGame() {
    isRunning = false;
    isGameOver = true;
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('snake_highscore', String(highscore));
    }
    showOverlay('انتهت اللعبة', `النتيجة: ${score} — أعلى نتيجة: ${highscore}. اضغط إعادة للبدء.`);
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x * cellSize), Math.floor(y * cellSize), Math.ceil(cellSize), Math.ceil(cellSize));
  }

  function drawGridBackground() {
    ctx.fillStyle = '#0a0f1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#0b1224';
        } else {
          ctx.fillStyle = '#0c1428';
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  function draw() {
    drawGridBackground();
    // Food
    if (food) drawCell(food.x, food.y, '#f43f5e');
    // Snake
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const color = i === 0 ? '#22d3ee' : '#06b6d4';
      drawCell(seg.x, seg.y, color);
    }
  }

  function loop(ts) {
    if (!isRunning) return; // paused or game over
    if (ts - lastTick >= tickMs) {
      lastTick = ts;
      step();
      draw();
    }
    requestAnimationFrame(loop);
  }

  function start() {
    if (isGameOver) initGame();
    isRunning = true;
    hideOverlay();
    requestAnimationFrame(ts => {
      lastTick = ts;
      loop(ts);
    });
  }

  function pauseOrResume() {
    if (isGameOver) return;
    isRunning = !isRunning;
    if (isRunning) {
      hideOverlay();
      requestAnimationFrame(ts => {
        lastTick = ts;
        loop(ts);
      });
    } else {
      showOverlay('إيقاف مؤقت', 'اضغط المسافة للمتابعة');
    }
  }

  function reset() {
    initGame();
    showOverlay('ابدأ اللعبة', 'اضغط مفتاح المسافة للبدء. استخدم الأسهم للتحكم.');
  }

  // Events
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (!isRunning && !isGameOver && snake.length) start();
      else if (!isRunning && isGameOver) initGame();
      else pauseOrResume();
      return;
    }
    if (!isRunning) return;
    setDirectionFromKey(e.key);
  }, { passive: false });

  startBtn.addEventListener('click', () => {
    if (!isRunning) start();
  });
  pauseBtn.addEventListener('click', pauseOrResume);
  resetBtn.addEventListener('click', reset);

  // Boot
  initGame();
})();

