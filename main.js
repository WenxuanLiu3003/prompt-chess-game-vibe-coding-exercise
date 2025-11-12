(function () {
  const LB = document.getElementById('leaderboard').querySelector('tbody');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  const PIN_KEY = 'pinnedPlayers_v1';
  function loadPins() {
    try { return JSON.parse(localStorage.getItem(PIN_KEY)) || []; }
    catch { return []; }
  }
  function savePins(arr) {
    localStorage.setItem(PIN_KEY, JSON.stringify(arr));
  }
  let pinOrder = loadPins();
  let pinnedSet = new Set(pinOrder);

  let allRows = [];
  let charts = { win: null, mu: null, wdl: null };

  function rowFlags(r) {
    const rank = Number(r.Rank);
    const wr = (r.Win_Rate > 1 ? r.Win_Rate / 100 : r.Win_Rate);
    const isTop3 = Number.isFinite(rank) && rank >= 1 && rank <= 3;
    const isHighWR = Number.isFinite(wr) && wr >= 0.80;
    return { isTop3, isHighWR };
  }

  function renderTable(rows) {
    LB.innerHTML = '';
    const frag = document.createDocumentFragment();
    rows.forEach(r => {
      const { isTop3, isHighWR } = rowFlags(r);
      const isPinned = pinnedSet.has(String(r.Player));

      const classes = [
        isTop3 ? 'row-hl-top' : '',
        isHighWR ? 'row-hl-win' : '',
        isPinned ? 'row-pinned' : ''
      ].filter(Boolean).join(' ');

      const badges = [];
      if (isTop3)  badges.push('<span class="badge top3" title="Top 3">Top 3</span>');
      if (isHighWR) badges.push('<span class="badge highwr" title="Win Rate ≥ 80%">80%+</span>');

      const modelText = esc(r.Model ?? '');
      const promptFull = esc(r.Prompt ?? '');
      const promptShown = esc(truncateText(r.Prompt ?? '', 120));

      const tr = document.createElement('tr');
      tr.className = classes;
      tr.innerHTML = `
        <td style="text-align:center;">
          <button class="pin-btn ${isPinned ? 'active' : ''}" data-pin="${esc(r.Player)}" aria-pressed="${isPinned ? 'true' : 'false'}" title="${isPinned ? 'Unpin' : 'Pin'}">📌</button>
        </td>
        <td>${r.Rank}</td>
        <td>
          <a class="btn link" href="#" data-player="${esc(r.Player)}">${esc(r.Player)}</a>
          ${badges.length ? `<span class="badges">${badges.join('')}</span>` : ''}
        </td>
        <td>${modelText || '—'}</td>
        <td class="truncate" title="${promptFull}">${promptShown || '—'}</td>
        <td>${r.Rating_Mu}</td>
        <td>${r.Rating_Sigma}</td>
        <td>${r.Wins}</td>
        <td>${r.Draws}</td>
        <td>${r.Losses}</td>
        <td>${r.Games}</td>
        <td>${formatPercent(r.Win_Rate)}</td>
      `;
      frag.appendChild(tr);
    });
    LB.appendChild(frag);
    wireRowEvents();
  }

  function updateCharts(rows) {
    charts.win?.destroy(); charts.mu?.destroy(); charts.wdl?.destroy();
    charts.win = buildWinRateBar(document.getElementById('winRateChart'), rows);
    charts.mu  = buildRatingDist (document.getElementById('ratingDistChart'), rows);
    charts.wdl = buildWDLStacked (document.getElementById('wldChart'), rows);
  }

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const sortKey = sortSelect.value;
    let rows = allRows.slice();

    // 🔎 search by Player + Model + Prompt
    if (q) {
      rows = rows.filter(r => {
        const player = String(r.Player || '').toLowerCase();
        const model  = String(r.Model  || '').toLowerCase();
        const prompt = String(r.Prompt || '').toLowerCase();
        return player.includes(q) || model.includes(q) || prompt.includes(q);
      });
    }

    // primary sort
    rows.sort(byKey(sortKey));

    // pinned to the top in the order pinned
    if (pinOrder.length) {
      const pinIndex = new Map(pinOrder.map((name, i) => [name, i]));
      rows.sort((a, b) => {
        const aPinned = pinnedSet.has(String(a.Player));
        const bPinned = pinnedSet.has(String(b.Player));
        if (aPinned && bPinned) {
          return (pinIndex.get(String(a.Player)) ?? 0) - (pinIndex.get(String(b.Player)) ?? 0);
        }
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
    }

    renderTable(rows);
    updateCharts(rows);
  }

  function togglePin(name) {
    const s = String(name);
    if (pinnedSet.has(s)) {
      pinnedSet.delete(s);
      pinOrder = pinOrder.filter(x => x !== s);
    } else {
      pinnedSet.add(s);
      pinOrder.push(s);
    }
    savePins(pinOrder);
  }

  function wireRowEvents() {
    LB.onclick = (e) => {
      const pinBtn = e.target.closest('button.pin-btn');
      if (pinBtn && pinBtn.dataset.pin) {
        togglePin(pinBtn.dataset.pin);
        applyFilters();
        return;
      }
      const a = e.target.closest('a[data-player]');
      if (a) {
        e.preventDefault();
        navigateToPlayer(a.dataset.player);
      }
    };
  }

  // events
  searchInput.addEventListener('input', debounce(applyFilters, 100));
  sortSelect.addEventListener('change', applyFilters);

  // load CSV
  Papa.parse('data/final_standings.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    complete: (res) => {
      allRows = (res.data || []).filter(
        r => r && r.Player && !Number.isNaN(Number(r.Rank))
      );

      // Normalize Win_Rate if it's given in (0..100)
      allRows.forEach(r => {
        if (r.Win_Rate > 1) r.Win_Rate = r.Win_Rate / 100;
      });

      applyFilters();
    },
    error: (err) => {
      console.error('Failed to load CSV:', err);
      LB.innerHTML = `<tr><td colspan="12">Failed to load data.</td></tr>`;
    }
  });
})();
