const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const panel = document.getElementById("panel");

const W = canvas.width;
const H = canvas.height;
const GROUND = H - 120;

const keys = {};
addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

const player = {
  x: 120,
  y: GROUND - 60,
  w: 48,
  h: 60,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jump: 14,
  onGround: false,
  hp: 5,
  inv: 0,
};

let cameraX = 0;
let score = 0;
let gameOver = false;
let clear = false;

const enemies = [
  { x: 600, y: GROUND - 40, w: 36, h: 40, alive: true },
  { x: 950, y: GROUND - 40, w: 36, h: 40, alive: true },
  { x: 1300, y: GROUND - 40, w: 36, h: 40, alive: true },
];

const coins = Array.from({ length: 20 }, (_, i) => ({
  x: 260 + i * 80,
  y: GROUND - 170 - (i % 3) * 26,
  r: 10,
  got: false,
}));

const goalX = 1800;

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (gameOver || clear) return;

  // move
  let dir = 0;
  if (keys["arrowleft"] || keys["a"]) dir -= 1;
  if (keys["arrowright"] || keys["d"]) dir += 1;
  player.vx = dir * player.speed;

  if ((keys[" "] || keys["w"] || keys["arrowup"]) && player.onGround) {
    player.vy = -player.jump;
    player.onGround = false;
  }

  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;

  if (player.y + player.h >= GROUND) {
    player.y = GROUND - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // pitfalls
  if (player.y > H + 200) {
    player.hp = 0;
  }

  // collect
  for (const c of coins) {
    if (c.got) continue;
    const cx = c.x - cameraX;
    const cy = c.y;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy < (c.r + 20) * (c.r + 20)) {
      c.got = true;
      score += 100;
    }
  }

  // enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    if (rectHit(player, e)) {
      // stomp
      if (player.vy > 1 && player.y + player.h - 8 < e.y) {
        e.alive = false;
        player.vy = -9;
        score += 300;
      } else if (player.inv <= 0) {
        player.hp -= 1;
        player.inv = 60;
      }
    }
  }

  if (player.inv > 0) player.inv--;

  // camera
  cameraX = Math.max(0, player.x - 260);

  // clear
  if (player.x >= goalX) {
    clear = true;
  }

  if (player.hp <= 0) {
    gameOver = true;
  }

  renderPanel();
}

function draw() {
  // sky
  ctx.fillStyle = "#7fd6ff";
  ctx.fillRect(0, 0, W, H);

  // far bg
  ctx.fillStyle = "#b7e9ff";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect((i * 380 - (cameraX * 0.3) % 380), 180 + (i % 3) * 20, 240, 80);
  }

  // ground
  ctx.fillStyle = "#4f7a3a";
  ctx.fillRect(0, GROUND, W, H - GROUND);

  // coins
  for (const c of coins) {
    if (c.got) continue;
    const x = c.x - cameraX;
    if (x < -40 || x > W + 40) continue;
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.arc(x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const x = e.x - cameraX;
    ctx.fillStyle = "#d94a4a";
    ctx.fillRect(x, e.y, e.w, e.h);
  }

  // goal
  ctx.fillStyle = "#2a2f45";
  ctx.fillRect(goalX - cameraX, GROUND - 140, 70, 140);
  ctx.fillStyle = "#8ef";
  ctx.fillRect(goalX - cameraX + 22, GROUND - 90, 26, 50);

  // player
  if (player.inv > 0 && Math.floor(player.inv / 4) % 2 === 0) {
    // blink
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x + 30, player.y + 16, 8, 8);
  }

  // HUD
  ctx.fillStyle = "#102030";
  ctx.fillRect(12, 12, 260, 70);
  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.fillText(`HP: ${"❤".repeat(Math.max(0, player.hp))}`, 20, 40);
  ctx.fillText(`SCORE: ${score}`, 20, 66);

  if (gameOver) overlay("GAME OVER");
  if (clear) overlay("STAGE CLEAR!");
}

function overlay(text) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText(text, W / 2 - 220, H / 2);
}

function renderPanel() {
  const tweetText = encodeURIComponent(`ジェネコ：ノイズランナー Score ${score}`);
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;
  if (gameOver) {
    panel.innerHTML = `ゲームオーバー…<br><a href="${tweetUrl}" target="_blank" rel="noopener">Xにスコア投稿</a>`;
  } else if (clear) {
    panel.innerHTML = `クリアおめでとう！<br><a href="${tweetUrl}" target="_blank" rel="noopener">Xにスコア投稿</a>`;
  } else {
    panel.textContent = "ゴールまで進もう！ コイン取得 +100 / 敵撃破 +300";
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

renderPanel();
loop();
