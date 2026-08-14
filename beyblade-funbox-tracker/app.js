const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  stores: [],
  draws: [],
  storeRegion: "all",
  storeCity: "all",
  storeSearch: "",
  favoriteOnly: false,
  drawRegion: "all",
  drawSearch: "",
  trackedOnly: false,
};

const KEYS = {
  favorites: "beyblade_funbox_favorite_stores",
  visitedStores: "beyblade_funbox_visited_stores",
  visitedDraws: "beyblade_funbox_visited_draws",
  watchlist: "beyblade_funbox_watchlist",
};

function loadSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
function saveSet(key, value) {
  localStorage.setItem(key, JSON.stringify([...value]));
}

let favorites = loadSet(KEYS.favorites);
let visitedStores = loadSet(KEYS.visitedStores);
let visitedDraws = loadSet(KEYS.visitedDraws);
let watchlist = loadSet(KEYS.watchlist);

function normalize(text = "") {
  return text.toString().trim().toLowerCase();
}
function esc(text = "") {
  return text.toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function boot() {
  try {
    const [storesRes, drawsRes] = await Promise.all([
      fetch("./data/stores.json"),
      fetch("./data/draws.json"),
    ]);
    const storeData = await storesRes.json();
    state.stores = storeData.stores || [];
    state.draws = drawsRes.ok ? await drawsRes.json() : [];

    buildCityOptions();
    bindEvents();
    renderWatchlist();
    renderStores();
    renderDraws();
  } catch (error) {
    console.error(error);
    document.querySelector("main").innerHTML = `
      <div class="empty">
        <div class="empty__icon">⚠️</div>
        <h3>資料載入失敗</h3>
        <p>請用 HTTP Server 或 GitHub Pages 開啟，不要直接雙擊 index.html。</p>
      </div>`;
  }
}

function bindEvents() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab").forEach((x) => x.classList.remove("is-active"));
      button.classList.add("is-active");
      const isDraws = button.dataset.tab === "draws";
      $("#drawsPage").hidden = !isDraws;
      $("#storesPage").hidden = isDraws;
    });
  });

  $$(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".segment").forEach((x) => x.classList.remove("is-active"));
      button.classList.add("is-active");
      state.storeRegion = button.dataset.region;
      state.storeCity = "all";
      $("#cityFilter").value = "all";
      buildCityOptions();
      renderStores();
    });
  });

  $("#cityFilter").addEventListener("change", (e) => {
    state.storeCity = e.target.value;
    renderStores();
  });
  $("#storeSearch").addEventListener("input", (e) => {
    state.storeSearch = e.target.value;
    renderStores();
  });
  $("#favoriteOnly").addEventListener("change", (e) => {
    state.favoriteOnly = e.target.checked;
    renderStores();
  });

  $("#drawRegion").addEventListener("change", (e) => {
    state.drawRegion = e.target.value;
    renderDraws();
  });
  $("#drawSearch").addEventListener("input", (e) => {
    state.drawSearch = e.target.value;
    renderDraws();
  });
  $("#trackedOnly").addEventListener("change", (e) => {
    state.trackedOnly = e.target.checked;
    renderDraws();
  });

  $("#watchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#watchInput");
    const value = input.value.trim().toUpperCase();
    if (!value) return;
    watchlist.add(value);
    saveSet(KEYS.watchlist, watchlist);
    input.value = "";
    renderWatchlist();
    renderDraws();
  });

  document.addEventListener("click", (e) => {
    const favoriteButton = e.target.closest("[data-favorite]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      saveSet(KEYS.favorites, favorites);
      renderStores();
      return;
    }

    const removeWatch = e.target.closest("[data-remove-watch]");
    if (removeWatch) {
      watchlist.delete(removeWatch.dataset.removeWatch);
      saveSet(KEYS.watchlist, watchlist);
      renderWatchlist();
      renderDraws();
      return;
    }

    const storeLink = e.target.closest("[data-store-line]");
    if (storeLink) {
      visitedStores.add(storeLink.dataset.storeLine);
      saveSet(KEYS.visitedStores, visitedStores);
      storeLink.classList.add("is-visited");
      storeLink.textContent = "✓ 已開啟";
      return;
    }

    const drawLink = e.target.closest("[data-draw-link]");
    if (drawLink) {
      visitedDraws.add(drawLink.dataset.drawLink);
      saveSet(KEYS.visitedDraws, visitedDraws);
      drawLink.classList.add("is-visited");
      drawLink.textContent = "✓ 已開啟";
    }
  });
}

function buildCityOptions() {
  const selected = state.stores.filter((s) =>
    state.storeRegion === "all" ? true : s.region === state.storeRegion
  );
  const cities = [...new Set(selected.map((s) => s.city))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant-TW")
  );
  $("#cityFilter").innerHTML =
    `<option value="all">全部縣市</option>` +
    cities.map((city) => `<option value="${esc(city)}">${esc(city)}</option>`).join("");
}

function renderWatchlist() {
  const items = [...watchlist].sort();
  $("#watchCount").textContent = items.length;
  $("#watchList").innerHTML = items.length
    ? items
        .map(
          (item) => `
          <span class="chip">
            ${esc(item)}
            <button type="button" title="移除" data-remove-watch="${esc(item)}">×</button>
          </span>`
        )
        .join("")
    : `<span class="result-meta">尚未加入追蹤商品。</span>`;
}

function getFilteredStores() {
  const q = normalize(state.storeSearch);
  return state.stores.filter((store) => {
    const regionOK = state.storeRegion === "all" || store.region === state.storeRegion;
    const cityOK = state.storeCity === "all" || store.city === state.storeCity;
    const favoriteOK = !state.favoriteOnly || favorites.has(store.line_id);
    const haystack = normalize(`${store.name} ${store.city} ${store.region} ${store.line_id}`);
    return regionOK && cityOK && favoriteOK && (!q || haystack.includes(q));
  });
}

function renderStores() {
  const list = getFilteredStores();
  const north = state.stores.filter((s) => s.region === "北部").length;
  const central = state.stores.filter((s) => s.region === "中部").length;
  const cities = new Set(state.stores.map((s) => s.city)).size;

  $("#storeStats").innerHTML = [
    ["門市總數", state.stores.length],
    ["北部", north],
    ["中部", central],
    ["涵蓋縣市", cities],
  ]
    .map(
      ([label, value]) => `
      <div class="stat">
        <div class="stat__label">${label}</div>
        <div class="stat__value">${value}</div>
      </div>`
    )
    .join("");

  $("#storeResultMeta").textContent = `顯示 ${list.length} / ${state.stores.length} 間門市`;

  $("#storeGrid").innerHTML = list.length
    ? list
        .map((store) => {
          const fav = favorites.has(store.line_id);
          const visited = visitedStores.has(store.line_id);
          return `
          <article class="store-card">
            <div class="store-card__top">
              <div>
                <div class="location">${esc(store.region)} · ${esc(store.city)}</div>
                <h3>${esc(store.name)}</h3>
                <span class="line-id">${esc(store.line_id)}</span>
              </div>
              <button class="favorite ${fav ? "is-active" : ""}"
                      type="button"
                      aria-label="${fav ? "取消收藏" : "收藏"}"
                      data-favorite="${esc(store.line_id)}">${fav ? "★" : "☆"}</button>
            </div>
            <div class="card-actions">
              <a class="action action--line ${visited ? "is-visited" : ""}"
                 href="${esc(store.line_url)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 data-store-line="${esc(store.line_id)}">${visited ? "✓ 已開啟" : "＋ 開啟 LINE"}</a>
              <a class="action action--fb"
                 href="${esc(store.facebook_url)}"
                 target="_blank"
                 rel="noopener noreferrer">Facebook</a>
            </div>
          </article>`;
        })
        .join("")
    : emptyState("找不到符合條件的門市", "請調整區域、縣市、搜尋字詞或收藏篩選。", "🔎");
}

function renderDraws() {
  const q = normalize(state.drawSearch);
  const watched = new Set([...watchlist].map(normalize));

  const storeByName = new Map(state.stores.map((s) => [s.name, s]));

  const list = state.draws.filter((draw) => {
    const store = storeByName.get(draw.store);
    const region = draw.region || store?.region || "";
    const regionOK = state.drawRegion === "all" || region === state.drawRegion;
    const items = draw.items || [];
    const trackedOK =
      !state.trackedOnly ||
      items.some((item) => watched.has(normalize(item.code)));
    const haystack = normalize(
      `${draw.store} ${draw.city || store?.city || ""} ${items
        .map((x) => `${x.code} ${x.name || ""}`)
        .join(" ")}`
    );
    return regionOK && trackedOK && (!q || haystack.includes(q));
  });

  const itemCount = list.reduce((sum, d) => sum + (d.items?.length || 0), 0);
  $("#drawSummary").textContent = state.draws.length
    ? `符合條件：${list.length} 間門市、${itemCount} 個抽選項目`
    : "目前尚未匯入抽選活動資料；門市目錄已可使用。";

  $("#drawList").innerHTML = list.length
    ? list
        .map((draw, drawIndex) => {
          const store = storeByName.get(draw.store);
          const city = draw.city || store?.city || "";
          const region = draw.region || store?.region || "";
          const items = (draw.items || []).map((item, itemIndex) => {
            const key = item.id || `${draw.store}|${item.code}|${draw.start || ""}|${itemIndex}`;
            const visited = visitedDraws.has(key);
            return `
              <div class="draw-item">
                <div>
                  <div class="product-code">${esc(item.code)}</div>
                  ${item.name ? `<div class="product-name">${esc(item.name)}</div>` : ""}
                </div>
                <a class="draw-link ${visited ? "is-visited" : ""}"
                   href="${esc(item.url)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   data-draw-link="${esc(key)}">${visited ? "✓ 已開啟" : "前往抽選"}</a>
              </div>`;
          }).join("");

          return `
            <article class="draw-card">
              <div class="draw-card__head">
                <div>
                  <div class="location">${esc(region)}${city ? ` · ${esc(city)}` : ""}</div>
                  <h3>${esc(draw.store)}</h3>
                </div>
                <div class="draw-date">${esc(formatDate(draw.start))}</div>
              </div>
              <div class="draw-items">${items}</div>
            </article>`;
        })
        .join("")
    : emptyState(
        state.draws.length ? "沒有符合條件的抽選" : "抽選資料尚未匯入",
        state.draws.length
          ? "調整搜尋條件，或取消「只看追蹤商品」。"
          : "V1 先完成官方門市資料與追蹤介面。之後只要更新 data/draws.json，就能直接顯示每間門市的抽選活動。",
        "🎯"
      );
}

function formatDate(value) {
  if (!value) return "時間待補";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function emptyState(title, body, icon) {
  return `
    <div class="empty">
      <div class="empty__icon">${icon}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>
    </div>`;
}

boot();
