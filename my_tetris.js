let score = 0;
let droppedLines = 0;
let level = 1;
let linesToNextLevel = 10; // Fixed goal for level progression
let lockDelay = 500; // Half-second lock delay
let lastDropTime = 0;

// Update the score based on the number of lines cleared
function updateScore(droppedRows) {
  switch (droppedRows) {
    case 1:
      score += 1;
      break;
    case 2:
      score += 3;
      break;
    case 3:
      score += 5;
      break;
    case 4:
      score += 8;
      break;
    default:
      score = 0;
  }

  // Update score display
  const displayScore = document.getElementById("score");
  displayScore.innerHTML = score;

  // Update lines dropped display
  droppedLines += droppedRows;
  document.getElementById("lines-dropped").innerHTML = droppedLines;

  // Check for level progression
  if (droppedLines >= linesToNextLevel) {
    level++;
    linesToNextLevel += 5 * level; // Variable goal for level progression
    document.getElementById("level").innerHTML = level;
  }
}

// Place the tetromino on the playField
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        // Game over if piece has any part offscreen
        if (tetromino.row + row < 0) {
          return displayGameOver();
        }

        playField[tetromino.row + row][tetromino.col + col] = tetromino.piece;
      }
    }
  }

  // Check line clears starting from the bottom and working our way up
  let droppedRows = 0;
  for (let row = playField.length - 1; row >= 0; ) {
    if (playField[row].every((cell) => !!cell)) {
      droppedRows++;

      // Drop rows above this line
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playField[r].length; c++) {
          playField[r][c] = playField[r - 1][c];
        }
      }
    } else {
      row--;
    }
  }

  tetromino = obtNextTetromino();
  if (droppedRows > 0) {
    updateScore(droppedRows);
  }
}

// Game draw function
function draw() {
  if (paused || gameOver) return; // Skip drawing if the game is paused or over
  reqAF = requestAnimationFrame(draw);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the playField
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playField[row][col]) {
        const piece = playField[row][col];
        context.fillStyle = tetColors[piece];

        // Looping 1 px smaller than the grid creates a grid effect
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }

  // Draw the active tetromino
  if (tetromino) {
    const now = Date.now();
    if (now - lastDropTime > lockDelay) {
      tetromino.row++;
      lastDropTime = now;

      // Place piece if it runs into anything
      if (!isCorrectMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = tetColors[tetromino.piece];

    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          // Looping 1 px smaller than the grid creates a grid effect
          context.fillRect(
            (tetromino.col + col) * grid,
            (tetromino.row + row) * grid,
            grid - 1,
            grid - 1
          );
        }
      }
    }
  }
}

// get a random integer between the range of [min,max]
function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate a new tetromino menu
function makeMenu() {
  const menu = ["I", "J", "L", "O", "S", "T", "Z"];

  while (menu.length) {
    const rand = getRandomNumber(0, menu.length - 1);
    const piece = menu.splice(rand, 1)[0];
    tetrominoMenu.push(piece);
  }
}

// get next tetromino in the menu
function obtNextTetromino() {
  if (tetrominoMenu.length === 0) {
    makeMenu();
  }

  const piece = tetrominoMenu.pop();
  const matrix = tetrominos[piece];

  // I and O start centered, all others start in left-middle
  const col = playField[0].length / 2 - Math.ceil(matrix[0].length / 2);

  // I starts on row 21 (-1), all others start on row 22 (-2)
  const row = piece === "I" ? -1 : -2;

  // Draw the next piece
  drawNextPiece();

  return {
    piece: piece,
    matrix: matrix,
    row: row,
    col: col,
  };
}

// Rotate an KxK matrix 90deg
function playRotate(matrix) {
  const K = matrix.length - 1;
  const res = matrix.map((row, i) => row.map((val, j) => matrix[K - j][i]));

  return res;
}

// check that new matrix/row/col is valid
function isCorrectMove(matrix, mtxRow, mtxCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // outside the game bounds
        (mtxCol + col < 0 ||
          mtxCol + col >= playField[0].length ||
          mtxRow + row >= playField.length ||
          // collides with another piece
          playField[mtxRow + row][mtxCol + col])
      ) {
        return false;
      }
    }
  }

  return true;
}

//Creating line/row cleared function
function rowDropped() {
  for (let row = playField.length - 1; row >= 0; ) {
    if (playField[row].every((cell) => !!cell)) {
      // drop every row above this one
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playField[r].length; c++) {
          playField[r][c] = playField[r - 1][c];
        }
      }
    } else {
      row--;
    }
  }
}

function updateDroppedLines(lines) {
  droppedLines += lines;
  document.getElementById("lines-dropped").innerHTML = droppedLines;
}

let paused = false;
let countdownInterval;

// function to display the countdown
function countdown(callback) {
  let countdownValue = 3;
  context.fillStyle = "black";
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "36px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";

  countdownInterval = setInterval(() => {
    context.clearRect(0, canvas.height / 2 - 30, canvas.width, 60);
    context.fillStyle = "black";
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    context.globalAlpha = 1;
    context.fillStyle = "white";
    context.fillText(countdownValue, canvas.width / 2, canvas.height / 2);
    countdownValue--;

    if (countdownValue < 0) {
      clearInterval(countdownInterval);
      callback();
    }
  }, 1000);
}

//Pause game
function pausePlay() {
  if (!paused) {
    // pause the game
    paused = true;
  } else {
    // resume the game with a countdown
    countdown(() => {
      paused = false;
      draw(); // Resume drawing
    });
  }
}

// show the game over screen
function displayGameOver() {
  cancelAnimationFrame(reqAF);
  gameOver = true;

  context.fillStyle = "pink";
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "36px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
}

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const grid = 32;
const tetrominoMenu = [];

// Create a new canvas element in your HTML
const nextCanvas = document.getElementById("nextPieceCanvas");
const nextContext = nextCanvas.getContext("2d");

// Function to draw the next piece on the new canvas
function drawNextPiece() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const nextPiece = tetrominoMenu[tetrominoMenu.length - 1];
  const matrix = tetrominos[nextPiece];
  const color = tetColors[nextPiece];

  nextContext.fillStyle = color;
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        nextContext.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }
}

// Tetris playField is 10x20, with a few rows offscreen
const playField = [];

// populate empty state
for (let row = -2; row < 20; row++) {
  playField[row] = [];

  for (let col = 0; col < 10; col++) {
    playField[row][col] = 0;
  }
}

// draw tetrominos
const tetrominos = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// tetromino color
const tetColors = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  Z: "red",
  J: "blue",
  L: "orange",
};

let count = 0;
let tetromino = obtNextTetromino();
let reqAF = null; // keep track of the animation frame so we can cancel it
let gameOver = false;

// listen to keyboard events to move the active tetromino
document.addEventListener("keydown", function (e) {
  if (gameOver) return;

  if (e.key === "p" || e.key === "P") {
    paused = !paused; // Toggle paused state
    if (!paused) {
      draw(); //Resume drawing if uppaused
    }
  }

  if (e.key === "Escape") {
    endGame();
  }

  if (
    e.keyCode === 37 ||
    e.keyCode === 39 ||
    e.keyCode === 100 ||
    e.keyCode === 102
  ) {
    const col = e.keyCode === 37 ? tetromino.col - 1 : tetromino.col + 1;

    if (isCorrectMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }

  // up arrow key (playRotate)
  if (e.keyCode === 38 || e.keyCode === 65 || e.keyCode === 66) {
    // 38: up arrow key, 65: A, 66:B
    const matrix = playRotate(tetromino.matrix);
    if (isCorrectMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }

  // down arrow key (drop)
  if (e.keyCode === 40 || e.keyCode === 98) {
    const row = tetromino.row + 1;

    if (!isCorrectMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;

      placeTetromino();
      return;
    }

    tetromino.row = row;
  }

  // spacebar key (Hard drop)
  if (e.keyCode === 32 || e.keyCode === 104) {
    while (isCorrectMove) {
      const row = tetromino.row + 1;
      if (!isCorrectMove(tetromino.matrix, row, tetromino.col)) {
        tetromino.row = row - 1;

        placeTetromino();
        return;
      }

      tetromino.row = row;
    }
  }
});

window.addEventListener("DOMContentLoaded", function (e) {
  const canvas = document.getElementById("gameCanvas");
  context = canvas.getContext("2d");

  const audio = document.querySelector("audio");
  audio.volume = 0.2;
  audio.play();

  // Start the game with a countdown
  countdown(() => {
    reqAF = requestAnimationFrame(draw);
    muscStop();
  });
});

function muscStop() {
  let audio = new Audio("Spook.mp3");
  if (audio.paused) {
    // audio.currentTime = 0;
    audio.play();
  } else {
    audio.pause();
  }
}

// start the game
reqAF = requestAnimationFrame(draw);
muscStop();

function next() {
  if (!paused) {
    gameStarted();
  }
}

//stop the game
function endGame() {
  let gameOver = true;
  cancelAnimationFrame(reqAF); // Stop the animation frame
  displayGameOver();
  muscStop();
}

//button used to stop the game.
let btnStop = document.getElementById("btnStop");
btnStop.addEventListener("click", (event) => {
  endGame();
});
