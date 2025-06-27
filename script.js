document.addEventListener('DOMContentLoaded', function () {
  const setup = document.getElementById('setup-container');
  const gameArea = document.getElementById('game-area');
  const playerSelect = document.getElementById('player-count');
  const namesContainer = document.getElementById('player-names-container');
  const startBtn = document.getElementById('start-game-btn');
  const rowsInput = document.getElementById('rows');
  const colsInput = document.getElementById('cols');
  const currentPlayerDisplay = document.getElementById('current-player');
  const playerScoresContainer = document.getElementById('player-scores');
  const boardsContainer = document.getElementById('boards-container');
  const die1 = document.getElementById('die1');
  const die2 = document.getElementById('die2');
  const rollBtn = document.getElementById('roll-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const currentNumberDisplay = document.getElementById('current-number');
  const winnerDisplay = document.getElementById('winner-display');
  const winnerName = document.getElementById('winner-name');
  const winnerScore = document.getElementById('winner-score');

  let players = [];
  let rows = 5, cols = 5;
  let gameActive = false;
  let currentNumber = null;
  let playersPlacedThisRound = [];

  playerSelect.addEventListener('change', function () {
    const count = parseInt(this.value);
    namesContainer.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      namesContainer.innerHTML += `
        <div class="form-group">
          <label>Player ${i} Name:</label>
          <input type="text" id="player-${i}-name" placeholder="Player ${i}">
        </div>`;
    }
  });
  playerSelect.dispatchEvent(new Event('change'));

  startBtn.addEventListener('click', () => {
    rows = parseInt(rowsInput.value);
    cols = parseInt(colsInput.value);
    const count = parseInt(playerSelect.value);
    players = [];

    for (let i = 1; i <= count; i++) {
      const name = document.getElementById(`player-${i}-name`).value || `Player ${i}`;
      players.push({
        name,
        board: Array(rows).fill().map(() => Array(cols).fill(null)),
        score: 0,
        movesLeft: rows * cols
      });
    }

    setup.style.display = 'none';
    gameArea.style.display = 'block';
    gameActive = true;
    renderBoards();
    updateScores();
  });

  function renderBoards() {
    boardsContainer.innerHTML = '';
    players.forEach((player, index) => {
      const div = document.createElement('div');
      div.className = 'player-board';
      div.innerHTML = `<div class="board-title">${player.name}</div><div class="game-board"></div>`;
      const boardEl = div.querySelector('.game-board');
      boardEl.style.gridTemplateColumns = `repeat(${cols}, 60px)`;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.addEventListener('click', () => place(r, c, index));
          boardEl.appendChild(cell);
        }
      }

      boardsContainer.appendChild(div);
    });
  }

  function updateScores() {
    playerScoresContainer.innerHTML = '';
    players.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'player-score';
      div.textContent = `${p.name}: ${p.score}`;
      playerScoresContainer.appendChild(div);
    });
  }

  rollBtn.addEventListener('click', () => {
    if (!gameActive) return;

    const val1 = Math.floor(Math.random() * 6) + 1;
    const val2 = Math.floor(Math.random() * 6) + 1;
    die1.textContent = val1;
    die2.textContent = val2;
    die1.classList.add('rolling');
    die2.classList.add('rolling');
    currentNumber = val1 + val2;
    currentNumberDisplay.textContent = currentNumber;
    playersPlacedThisRound = [];

    setTimeout(() => {
      die1.classList.remove('rolling');
      die2.classList.remove('rolling');
    }, 500);

    rollBtn.disabled = true;
  });

  function place(r, c, playerIndex) {
    if (!gameActive || currentNumber === null) return;
    const player = players[playerIndex];
    if (player.board[r][c] !== null || playersPlacedThisRound.includes(playerIndex)) return;

    const boardDiv = boardsContainer.querySelectorAll('.player-board')[playerIndex];
    const gameBoard = boardDiv.querySelector('.game-board');
    const cell = gameBoard.children[r * cols + c];
    cell.textContent = currentNumber;
    cell.classList.add('filled');
    player.board[r][c] = currentNumber;
    player.movesLeft--;

    highlightAdjacent(player.board, gameBoard, r, c);

    if (player.movesLeft === 0) {
      scorePlayer(playerIndex);
    }

    playersPlacedThisRound.push(playerIndex);

    if (playersPlacedThisRound.length === players.length) {
      // Everyone has placed
      currentNumber = null;
      currentNumberDisplay.textContent = '-';
      die1.textContent = '-';
      die2.textContent = '-';
      rollBtn.disabled = false;

      if (players.every(p => p.movesLeft === 0)) endGame();
    }
  }

  function scorePlayer(i) {
    const p = players[i];
    let score = 0;

    for (let r = 0; r < rows; r++) {
      let count = 1;
      for (let c = 1; c < cols; c++) {
        if (p.board[r][c] === p.board[r][c - 1]) count++;
        else {
          if (count >= 2) score += count * p.board[r][c - 1];
          count = 1;
        }
      }
      if (count >= 2) score += count * p.board[r][cols - 1];
    }

    for (let c = 0; c < cols; c++) {
      let count = 1;
      for (let r = 1; r < rows; r++) {
        if (p.board[r][c] === p.board[r - 1][c]) count++;
        else {
          if (count >= 2) score += count * p.board[r - 1][c];
          count = 1;
        }
      }
      if (count >= 2) score += count * p.board[rows - 1][c];
    }

    p.score = score;
    updateScores();
  }

  function highlightAdjacent(board, gameBoardEl, r, c) {
    const value = board[r][c];
    const index = r * cols + c;
    const cell = gameBoardEl.children[index];
    cell.className = 'cell filled';

    let matched = false;
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    for (let [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === value) {
        const neighborIndex = nr * cols + nc;
        const neighborCell = gameBoardEl.children[neighborIndex];
        neighborCell.className = `cell filled colored-${value}`;
        matched = true;
      }
    }

    if (matched) {
      cell.className = `cell filled colored-${value}`;
    }
  }

  function endGame() {
    gameActive = false;
    rollBtn.disabled = true;
    const winner = players.reduce((a, b) => (a.score > b.score ? a : b));
    winnerName.textContent = winner.name;
    winnerScore.textContent = winner.score;
    winnerDisplay.style.display = 'block';
  }

  newGameBtn.addEventListener('click', () => location.reload());
});
