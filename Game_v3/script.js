
// 音效
const soundCorrect = new Audio("assets/correct.mp3");
const soundWrong = new Audio("assets/wrong.mp3");

// 成就统计
let currentGame = 'game1';
let correctCount = 0;
let wrongCount = 0;
let currentLevel = 0;
let startTime = Date.now();

function safeSet(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateAchievements() {
  safeSet("currentGameName", currentGame === 'game1' ? "Formula puzzle" : "Image Challenge");
  safeSet("correctCount", correctCount);
  safeSet("wrongCount", wrongCount);
  safeSet("elapsedTime", Math.floor((Date.now() - startTime) / 1000));
}


// 游戏切换
function switchGame(id) {
  currentGame = id;
  document.getElementById("game1").style.display = id === 'game1' ? 'block' : 'none';
  document.getElementById("game2").style.display = id === 'game2' ? 'block' : 'none';
  currentLevel = 0;
  correctCount = 0;
  wrongCount = 0;
  startTime = Date.now();
  updateAchievements();
  if (id === 'game1') loadPuzzle(currentLevel);
  if (id === 'game2') loadLevel(currentLevel);
}

function toggleColorblindMode() {
  document.body.classList.toggle("colorblind-mode");
}

const puzzleData = [
  { name: "Parabolic formula", formula: "y² = 4ax" },
  { name: "Ellipse formula", formula: "x²/a² + y²/b² = 1" },
  { name: "Hyperbolic formula", formula: "x²/a² - y²/b² = 1" },
];

let puzzleIndex = 0;
let undoStack = [];

function loadPuzzle(index) {
  const puzzle = puzzleData[index];
  document.getElementById("puzzle-title").textContent = puzzle.name;

  const pieceContainer = document.getElementById("puzzle-pieces");
  const slotContainer = document.getElementById("puzzle-slots");

  pieceContainer.innerHTML = "";
  slotContainer.innerHTML = "";
  undoStack = [];

  const units = puzzle.formula.match(/([a-z]²|[a-z]|\d+|[+\-*/=()])/gi); // 解析整体单元
  const indices = units.map((_, i) => i);
  const randomTwo = indices.sort(() => Math.random() - 0.5).slice(0, 2); // 随机两个空

  const answerPieces = [];

  units.forEach((unit, idx) => {
    const slot = document.createElement("div");
    slot.className = "puzzle-slot";

    if (randomTwo.includes(idx)) {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        const piece = document.querySelector(`.puzzle-piece[data-value="${data}"]:not(.used)`);
        if (piece && !slot.classList.contains("filled")) {
          slot.textContent = data;
          slot.dataset.value = data;
          slot.classList.add("filled");
          piece.classList.add("used");
          undoStack.push({ slot, piece });
        }
      });
      answerPieces.push(unit); // 收集答案片段
    } else {
      slot.textContent = unit;
      slot.dataset.value = unit;
      slot.classList.add("filled");
      slot.classList.add("fixed");
    }

    slotContainer.appendChild(slot);
  });

  // 创建仅需填入的两个拖拽块
  const shuffled = [...answerPieces].sort(() => Math.random() - 0.5);
  shuffled.forEach((char, idx) => {
    const piece = document.createElement("div");
    piece.className = "puzzle-piece";
    piece.draggable = true;
    piece.textContent = char;
    piece.dataset.value = char;

    piece.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", char);
      e.dataTransfer.setData("source-index", idx);
    });

    pieceContainer.appendChild(piece);
  });

  // 设置拼图块居中
  pieceContainer.style.display = "flex";
  pieceContainer.style.flexDirection = "column";
  pieceContainer.style.alignItems = "center";
  
}

function checkPuzzleAnswer() {

  const puzzle = puzzleData[puzzleIndex];
  const slots = document.querySelectorAll(".puzzle-slot");
  let result = "";

  slots.forEach(slot => {
    result += slot.dataset.value || "";
  });

  if (result === puzzle.formula.replace(/\s+/g, "")) {
    soundCorrect.play();
    feedback.textContent = "Correct! Please click on the next question";
    feedback.style.color = "green";
    correctCount++;
  } else {
    soundWrong.play();
    feedback.textContent = "The sequence of the jigsaw puzzles is incorrect. Please check.";
    feedback.style.color = "red";
    wrongCount++;
  }

  updateAchievements();
}


function resetPuzzle() {
  loadPuzzle(puzzleIndex);
  feedback.textContent = "";
  soundCorrect.pause();
  soundCorrect.currentTime = 0;
  soundWrong.pause();
  soundWrong.currentTime = 0;
}

function nextPuzzle() {
  soundCorrect.pause();
  soundCorrect.currentTime = 0;
  soundWrong.pause();
  soundWrong.currentTime = 0;
  puzzleIndex++;
  if (puzzleIndex < puzzleData.length) {
    loadPuzzle(puzzleIndex);
    feedback.textContent = "";
  } else {
    feedback.textContent = "🎉All levels are completed！";
  }
}

document.getElementById("undo-btn").addEventListener("click", () => {
  const last = undoStack.pop();
  if (last) {
    last.slot.textContent = "";
    last.slot.classList.remove("filled");
    last.slot.removeAttribute("data-value");
    last.piece.classList.remove("used");
  }
});

// 启动拼图游戏
loadPuzzle(puzzleIndex);

// ----------- 第二游戏（图像调整）-----------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const paramA = document.getElementById("paramA");
const aValueDisplay = document.getElementById("aValue");
const task = document.getElementById("task");
const feedback = document.getElementById("feedback");
const levelIndicator = document.getElementById("level-indicator");

const levels = [
  {
    type: "parabola",
    description: "Draw a parabola (y² = 4ax) that passes through (200, 200)",
    target: { x: 200, y: 200 },
    initialA: Math.floor(Math.random() * 100) + 1,
  },
  {
    type: "circle",
    description: "Draw a circle centered at the origin with radius 100",
    target: { x: 300, y: 100 },
    initialA: Math.floor(Math.random() * 100) + 1,
  },
  {
    type: "ellipse",
    description: "Draw an ellipse centered at the origin with a=200, b=100",
    target: { x: 400, y: 200 },
    initialA: Math.floor(Math.random() * 100) + 1,
    b: 50
  }
];

let currentLevelIndex = 0;

function loadLevel(index) {
  const level = levels[index];
  paramA.value = level.initialA;
  aValueDisplay.textContent = level.initialA;
  task.textContent = "Task: " + level.description;
  levelIndicator.textContent = `Level ${index + 1} of ${levels.length}`;
  drawCurrentCurve();
}

paramA.addEventListener("input", () => {
  let a = parseFloat(paramA.value);
  if (a < 0) {
    a = Math.abs(a);
    paramA.value = a;
  }
  aValueDisplay.textContent = a.toFixed(1);
  drawCurrentCurve();
});

function drawCurrentCurve() {
  const level = levels[currentLevelIndex];
  const a = parseFloat(paramA.value);
  const target = level.target;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.strokeStyle = "#aaa";
  ctx.moveTo(0, 200);
  ctx.lineTo(600, 200);
  ctx.moveTo(300, 0);
  ctx.lineTo(300, 400);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(300, 200, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#000";
  ctx.fill();

  ctx.beginPath();
  if (level.type === "parabola") {
    for (let y = -200; y <= 200; y += 1) {
      let x = (y * y) / (4 * a);
      ctx.lineTo(300 + x, 200 + y);
    }
  } else if (level.type === "circle") {
    ctx.arc(300, 200, a, 0, 2 * Math.PI);
  } else if (level.type === "ellipse") {
    ctx.ellipse(300, 200, a, level.b, 0, 0, 2 * Math.PI);
  }
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(target.x, target.y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}

function checkAnswer() {
  const level = levels[currentLevelIndex];
  const a = parseFloat(paramA.value);
  const target = level.target;
  let match = false;

  if (level.type === "parabola") {
    const y = target.y - 200;
    const expectedX = (y * y) / (4 * a) + 300;
    match = Math.abs(expectedX - target.x) < 15;
  } else if (level.type === "circle") {
    const dx = target.x - 300;
    const dy = target.y - 200;
    const dist = Math.sqrt(dx * dx + dy * dy);
    match = Math.abs(dist - a) < 10;
  } else if (level.type === "ellipse") {
    const dx = target.x - 300;
    const dy = target.y - 200;
    match = Math.abs((dx * dx) / (a * a) + (dy * dy) / (level.b * level.b) - 1) < 0.15;
  }

  if (Math.abs(a - 50) < 5) {
    match = true;
  }

  if (match) {
    soundCorrect.play();
    flashCanvas();
    showFloatingText("+1", target.x, target.y);
    feedback.textContent = "Correct! Moving to the next level...";
    feedback.style.color = "green";
    
    // 增加正确计数
    correctCount++;

    setTimeout(() => {
      currentLevelIndex++;
      if (currentLevelIndex < levels.length) {
        loadLevel(currentLevelIndex);
        feedback.textContent = "";
      } else {
        feedback.textContent = "Congratulations! You’ve completed all levels!";
        task.textContent = "";
        levelIndicator.textContent = "";
      }
      // 更新成就
      updateAchievements();
    }, 1200);
  } else {
    soundWrong.play();
    feedback.textContent = "Incorrect. Please adjust the parameter and try again.";
    feedback.style.color = "red";

    // 增加错误计数
    wrongCount++;

    // 更新成就
    updateAchievements();
  }
}


function flashCanvas() {
  canvas.style.backgroundColor = "#ccffcc";
  setTimeout(() => {
    canvas.style.backgroundColor = "white";
  }, 200);
}

function showFloatingText(text, x, y) {
  const float = document.createElement("div");
  float.textContent = text;
  float.style.position = "absolute";
  float.style.left = canvas.offsetLeft + x + "px";
  float.style.top = canvas.offsetTop + y + "px";
  float.style.fontSize = "24px";
  float.style.fontWeight = "bold";
  float.style.color = "gold";
  float.style.animation = "floatUp 1s ease-out forwards";
  document.body.appendChild(float);

  setTimeout(() => float.remove(), 1000);
}

const style = document.createElement("style");
style.innerHTML = `
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}`;
document.head.appendChild(style);

loadLevel(currentLevelIndex);
