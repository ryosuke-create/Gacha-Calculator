document.addEventListener("DOMContentLoaded", () => {
  // --- テーマ復元 ---
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.add(savedTheme);
  document.getElementById("theme-toggle").textContent = savedTheme === "light" ? "🌙" : "☀️";

  // --- テーマ切り替え ---
  document.getElementById("theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    document.body.classList.toggle("dark");

    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
    document.getElementById("theme-toggle").textContent = currentTheme === "light" ? "🌙" : "☀️";
  });

  // --- 入力復元 ---
  ["banner1", "banner2"].forEach(banner => {
    ["tickets", "free-stones", "paid-stones", "items"].forEach(id => {
      const key = `${id}-${banner}`;
      const input = document.getElementById(key);
      if (localStorage.getItem(key)) {
        input.value = localStorage.getItem(key);
      }
      input.addEventListener("input", () => {
        localStorage.setItem(key, input.value);
      });
    });
  });

  // --- タブ切り替え ---
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
});

// --- 計算処理 ---
function calculate(banner) {
  const tickets = parseInt(document.getElementById(`tickets-${banner}`).value) || 0;
  const freeStones = parseInt(document.getElementById(`free-stones-${banner}`).value) || 0;
  const paidStones = parseInt(document.getElementById(`paid-stones-${banner}`).value) || 0;
  const items = parseInt(document.getElementById(`items-${banner}`).value) || 0;

  const stones = freeStones + paidStones;
  const totalTickets = tickets + Math.floor(stones / 160) + Math.floor(items / 20);

  const pulls = totalTickets;
  const toPity90 = Math.max(0, 90 - pulls) * 160;
  const toPity180 = Math.max(0, 180 - pulls) * 160;

  const result = `
    回せる回数: ${pulls} 回<br>
    仮天井(90回)までに必要な石: ${toPity90} 個<br>
    天井(180回)までに必要な石: ${toPity180} 個
  `;

  document.getElementById(`result-${banner}`).innerHTML = result;
}
