const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const paramA = document.getElementById("paramA");
const aValueDisplay = document.getElementById("aValue");
const feedback = document.getElementById("feedback");
const task = document.getElementById("task");
const levelIndicator = document.getElementById("level-indicator");

const soundCorrect = new Audio("assets/correct.mp3");
const soundWrong = new Audio("assets/wrong.mp3");

const levels = [
  {
    type: "parabola",
    description: "绘制形如 y² = 4ax 的抛物线，让它穿过 (200, 200)",
    target: { x: 200, y: 200 },
    initialA: 50
  },
  {
    type: "circle",
    description: "绘制一个以原点为圆心，半径为 100 的圆",
    target: { x: 300, y: 100 },
    initialA: 100
  },
  {
    type: "ellipse",
    description: "绘制一个中心在原点、长轴200、短轴100的椭圆",
    target: { x: 400, y: 200 },
    initialA: 100,
    b: 50
  }
];

let currentLevelIndex = 0;

function loadLevel(index) {
  const level = levels[index];
  paramA.value = level.initialA;
  aValueDisplay.textContent = level.initialA;
  task.textContent = "任务：" + level.description;
  levelIndicator.textContent = `第 ${index + 1} 关 / 共 ${levels.length} 关`;
  drawCurrentCurve();
}

paramA.addEventListener("input", () => {
  const a = parseFloat(paramA.value);
  aValueDisplay.textContent = a;
  drawCurrentCurve();
});

function drawCurrentCurve() {
  const level = levels[currentLevelIndex];
  const a = parseFloat(paramA.value);
  const target = level.target;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 坐标轴
  ctx.beginPath();
  ctx.strokeStyle = "#aaa";
  ctx.moveTo(0, 200);
  ctx.lineTo(600, 200);
  ctx.moveTo(300, 0);
  ctx.lineTo(300, 400);
  ctx.stroke();

  // 原点
  ctx.beginPath();
  ctx.arc(300, 200, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#000";
  ctx.fill();

  // 曲线
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

  // 目标点
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

  if (match) {
    soundCorrect.play();
    flashCanvas();
    showFloatingText("+1", target.x, target.y);
    feedback.textContent = "✅ 正确！进入下一关...";
    feedback.style.color = "green";
    setTimeout(() => {
      currentLevelIndex++;
      if (currentLevelIndex < levels.length) {
        loadLevel(currentLevelIndex);
        feedback.textContent = "";
      } else {
        feedback.textContent = "🎉 恭喜你完成所有关卡！";
        task.textContent = "";
        levelIndicator.textContent = "";
      }
    }, 1200);
  } else {
    soundWrong.play();
    feedback.textContent = "❌ 错误，请调整参数再试试。";
    feedback.style.color = "red";
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

// 动画样式插入
const style = document.createElement("style");
style.innerHTML = `
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}`;
document.head.appendChild(style);

// 启动游戏
loadLevel(currentLevelIndex);
