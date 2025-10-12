(function () {
  'use strict';

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');

  const gridSize = 24; // board is 480x480 -> 20x20 cells when 24px (with padding)
  const cell = Math.floor(canvas.width / gridSize);
  const boardCells = gridSize;

  const colors = {
    bg: '#0b1021',
    snakeHead: '#22d3ee',
    snakeBody: '#06b6d4',
    food: '#fbbf24',
    grid: 'rgba(148, 163, 184, 0.06)',
    text: '#e2e8f0',
    paused: 'rgba(2,6,23,0.6)'
  };

  let snake, direction, nextDirection, food, score, highScore, speedMs, lastTick, running, pendingGrowth;

  function resetGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speedMs = 120;
    lastTick = 0;
    running = true;
    pendingGrowth = 0;
    placeFood();
    updateScore();
  }

  function updateScore() {
    scoreEl.textContent = String(score);
    if (typeof localStorage !== 'undefined') {
      highScore = Math.max(Number(localStorage.getItem('snakeHighScore') || 0), score);
      localStorage.setItem('snakeHighScore', String(highScore));
      highScoreEl.textContent = String(highScore);
    } else {
      highScore = Math.max(highScore || 0, score);
      highScoreEl.textContent = String(highScore);
    }
  }

  function placeFood() {
    while (true) {
      const x = Math.floor(Math.random() * boardCells);
      const y = Math.floor(Math.random() * boardCells);
      const onSnake = snake.some(seg => seg.x === x && seg.y === y);
      if (!onSnake) {
        food = { x, y };
        return;
      }
    }
  }

  function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= boardCells; i++) {
      const p = i * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(canvas.width, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, canvas.height);
      ctx.stroke();
    }
  }

  function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const isHead = i === 0;
      ctx.fillStyle = isHead ? colors.snakeHead : colors.snakeBody;
      const pad = isHead ? 2 : 3;
      ctx.fillRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2);
    }
  }

  function drawFood() {
    ctx.fillStyle = colors.food;
    const pad = 4;
    const r = (cell - pad * 2) / 2;
    const cx = food.x * cell + cell / 2;
    const cy = food.y * cell + cell / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function clearBoard() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function step() {
    if (!running) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // wrap-around borders
    head.x = (head.x + boardCells) % boardCells;
    head.y = (head.y + boardCells) % boardCells;

    // self collision
    const hitSelf = snake.some((seg, idx) => idx !== 0 && seg.x === head.x && seg.y === head.y);
    if (hitSelf) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // food
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      pendingGrowth += 1;
      speedMs = Math.max(60, speedMs - 2);
      placeFood();
      updateScore();
    }

    if (pendingGrowth > 0) {
      pendingGrowth -= 1;
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    running = false;
    draw();
    ctx.fillStyle = 'rgba(2,6,23,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Cairo, sans-serif';
    ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '18px Cairo, sans-serif';
    ctx.fillText('اضغط R لإعادة البدء', canvas.width / 2, canvas.height / 2 + 20);
  }

  function draw() {
    clearBoard();
    drawGrid();
    drawFood();
    drawSnake();
    if (!running) {
      // overlay kept in gameOver()
    }
  }

  function loop(timestamp) {
    if (!lastTick) lastTick = timestamp;
    const elapsed = timestamp - lastTick;
    if (elapsed >= speedMs) {
      // apply buffered direction to prevent instant reverse
      if ((nextDirection.x !== -direction.x || nextDirection.y !== -direction.y)) {
        direction = nextDirection;
      }
      step();
      draw();
      lastTick = timestamp;
    }
    requestAnimationFrame(loop);
  }

  function setDirection(dx, dy) {
    nextDirection = { x: dx, y: dy };
  }

  function togglePause() {
    running = !running;
    if (!running) {
      ctx.fillStyle = colors.paused;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillText('متوقف مؤقتاً', canvas.width / 2, canvas.height / 2);
    } else {
      draw();
    }
  }

  function bindInputs() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') setDirection(0, -1);
      else if (key === 'arrowdown' || key === 's') setDirection(0, 1);
      else if (key === 'arrowleft' || key === 'a') setDirection(-1, 0);
      else if (key === 'arrowright' || key === 'd') setDirection(1, 0);
      else if (key === 'p') togglePause();
      else if (key === 'r') resetGame();
    });

    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnPause = document.getElementById('btnPause');

    btnUp.addEventListener('click', () => setDirection(0, -1));
    btnDown.addEventListener('click', () => setDirection(0, 1));
    btnLeft.addEventListener('click', () => setDirection(-1, 0));
    btnRight.addEventListener('click', () => setDirection(1, 0));
    btnPause.addEventListener('click', togglePause);

    // touch controls: swipe
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX; touchStartY = t.clientY;
    });
    canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) setDirection(1, 0); else if (dx < -20) setDirection(-1, 0);
      } else {
        if (dy > 20) setDirection(0, 1); else if (dy < -20) setDirection(0, -1);
      }
    });
  }

  // init
  resetGame();
  bindInputs();
  draw();
  requestAnimationFrame(loop);
})();
