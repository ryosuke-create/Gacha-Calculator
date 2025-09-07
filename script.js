// ===== ゲームごとのプリセット設定 =====
const GAME_CONFIGS = {
  starrail: {
    name: "スターレイル",
    stonesPerTicket: 160,
    changeItem: 20,
    itemToStones: 160,
    softPity: 90,
    hardPity: 180,
    pityRewardItems: 40, // 40アイテム = 石320
    itemsFrom10PullStar4: [8, 20],
    permanentTicketPerItems: { low: 8, high: 20 }
  },

  p5x: {
    name: "P5X",
    stonesPerTicket: 150,
    changeItem: 10,
    itemToStones: 100,
    softPity: 80,
    hardPity: 160,
    pityRewardItems: 30, // 40アイテム = 石?? → 共通で石に変換（ここでは40→石320扱い）
    itemsFrom10PullStar4: [6, 15], // 仕様に応じて
    permanentTicketPerItems: { low: 6, high: 15 }
  }
};

// 現在選択中のゲーム
let currentConfig = GAME_CONFIGS.genshin;

// ===== メイン計算 =====
function calculate() {
  const cfg = currentConfig;

  const tickets = parseInt(document.getElementById("tickets").value) || 0;
  const freeStones = parseInt(document.getElementById("free-stones").value) || 0;
  const paidStones = parseInt(document.getElementById("paid-stones").value) || 0;
  const items = parseInt(document.getElementById("items").value) || 0;
  const permanentTickets = parseInt(document.getElementById("permanent-tickets").value) || 0;

  // 入力保存
  saveInputs({ tickets, freeStones, paidStones, items, permanentTickets });

  // アイテムを石に変換
  const stonesFromItems = Math.floor(items/cfg.changeItem)*cfg.itemToStones;
  // 合計石
  const stones = freeStones + paidStones;

  // 石+チケット→回数
  const basePulls = tickets + Math.floor(stones / cfg.stonesPerTicket);

  //石＋チケット＋交換アイテム→回数
  const withItems = basePulls + Math.floor(stonesFromItems / cfg.stonesPerTicket);


  // 90回以上ならすり抜け加算（pityRewardItemsを石に換算して足す）
  function addPity(pulls) {
    if (pulls >= cfg.softPity && cfg.pityRewardItems > 0) {
      const pityStones = Math.floor(cfg.pityRewardItems / cfg.changeItem) * cfg.itemToStones; // 共通換算
      return pulls + Math.floor(pityStones / cfg.stonesPerTicket);
    }
    return pulls;
  }

  // ① 石＋チケット分
  const result1 = addPity(basePulls);

  // ② 石＋チケット＋交換アイテム分（アイテムは既に石に換算済みなので同じ）
  const result2 = addPity(withItems);


  // ③ 限定ガチャ交換アイテム考慮
  let limited8 = withItems;
  let limited20 = withItems;
  if (cfg.itemsFrom10PullStar4[0] > 0) {
    const stonesFrom8 = Math.floor( (Math.floor(withItems / 10) * cfg.itemsFrom10PullStar4[0]) /cfg.changeItem) * cfg.itemToStones;
    const stonesFrom20 = Math.floor( (Math.floor(withItems / 10) * cfg.itemsFrom10PullStar4[1]) /cfg.changeItem) * cfg.itemToStones; 
    limited8 += Math.floor(stonesFrom8 / cfg.stonesPerTicket);
    limited20 += Math.floor(stonesFrom20 / cfg.stonesPerTicket);
  }
  const result3Min = Math.min(addPity(limited8), addPity(limited20));
  const result3Max = Math.max(addPity(limited8), addPity(limited20));

  // ④ 恒常チケット考慮
  const permRuns = Math.floor(permanentTickets / 10);
  const permItems8 = permRuns * cfg.permanentTicketPerItems.low;
  const permItems20 = permRuns * cfg.permanentTicketPerItems.high;
  const stonesPerm8 = Math.floor(permItems8 / cfg.changeItem) * cfg.itemToStones;
  const stonesPerm20 = Math.floor(permItems20 / cfg.changeItem) * cfg.itemToStones;
  const limitedPerm8_8  = addPity(limited8  + Math.floor(stonesPerm8 / cfg.stonesPerTicket));
  const limitedPerm8_20 = addPity(limited8  + Math.floor(stonesPerm20 / cfg.stonesPerTicket));
  const limitedPerm20_8  = addPity(limited20 + Math.floor(stonesPerm8 / cfg.stonesPerTicket));
  const limitedPerm20_20 = addPity(limited20 + Math.floor(stonesPerm20 / cfg.stonesPerTicket));

  const result4Min = Math.min(limitedPerm8_8, limitedPerm8_20, limitedPerm20_8, limitedPerm20_20);
  const result4Max = Math.max(limitedPerm8_8, limitedPerm8_20, limitedPerm20_8, limitedPerm20_20);

  // ==== 表示 ====
  let results = [];
  results.push(`<div>① 石＋チケット分: ${result1} 回</div>`);
  results.push(`<div>② 石＋チケット＋交換アイテム分: ${result2} 回</div>`);
  results.push(`<div>③ 限定ガチャ交換アイテム考慮: ${result3Min} ～ ${result3Max} 回</div>`);
  results.push(`<div>④ 限定＋恒常チケット考慮: ${result4Min} ～ ${result4Max} 回</div>`);
  results.push(`<button onclick="toggleDetail()">詳細</button>`);
  document.getElementById("result").innerHTML = results.join("");

  // 詳細用
  let details = [];
  details.push(`<b>③ 限定ガチャ交換アイテム考慮 内訳</b><br>
                ・星4=8: ${addPity(limited8)} 回<br>
                ・星4=20: ${addPity(limited20)} 回<br><br>`);
  details.push(`<b>④ 限定＋恒常チケット考慮 内訳</b><br>
                ・限定8＋恒常8: ${limitedPerm8_8} 回<br>
                ・限定8＋恒常20: ${limitedPerm8_20} 回<br>
                ・限定20＋恒常8: ${limitedPerm20_8} 回<br>
                ・限定20＋恒常20: ${limitedPerm20_20} 回<br>`);
  document.getElementById("details").innerHTML = details.join("");
  document.getElementById("details").classList.add("hidden");
}

// ===== 詳細表示トグル =====
function toggleDetail() {
  const el = document.getElementById("details");
  if (!el) return;
  el.classList.toggle("hidden");
}

// ===== 入力保存 =====
function saveInputs(values) {
  localStorage.setItem("gachaInputs", JSON.stringify(values));
}
function loadInputs() {
  const saved = localStorage.getItem("gachaInputs");
  if (!saved) return;
  const values = JSON.parse(saved);
  document.getElementById("tickets").value = values.tickets ?? "";
  document.getElementById("free-stones").value = values.freeStones ?? "";
  document.getElementById("paid-stones").value = values.paidStones ?? "";
  document.getElementById("items").value = values.items ?? "";
  document.getElementById("permanent-tickets").value = values.permanentTickets ?? "";
}

// ===== テーマ切り替え =====
function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  document.getElementById("theme-toggle").textContent = isDark ? "☀" : "🌙";
}

// ===== ゲーム切り替え =====
function changeGame(key) {
  if (!GAME_CONFIGS[key]) return;
  currentConfig = GAME_CONFIGS[key];
  localStorage.setItem("game", key);
  document.getElementById("current-game").textContent = currentConfig.name;
  calculate(); // 即再計算
}

window.addEventListener("DOMContentLoaded", () => {
  loadInputs();

  // テーマ復元
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("theme-toggle").textContent = "☀";
  }

  // ゲーム復元
  const savedGame = localStorage.getItem("game");
  if (savedGame && GAME_CONFIGS[savedGame]) {
    currentConfig = GAME_CONFIGS[savedGame];
  }
  document.getElementById("current-game").textContent = currentConfig.name;

  // ゲーム選択セレクト生成
  const gameSelect = document.getElementById("game-select");
  Object.entries(GAME_CONFIGS).forEach(([key, cfg]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = cfg.name;
    if (cfg === currentConfig) opt.selected = true;
    gameSelect.appendChild(opt);
  });
  gameSelect.addEventListener("change", (e) => changeGame(e.target.value));

  // テーマボタンイベント
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
});
