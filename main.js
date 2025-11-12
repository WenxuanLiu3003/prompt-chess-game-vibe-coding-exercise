(function () {
  const LB = document.getElementById('leaderboard').querySelector('tbody');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  let allRows = [];
  let charts = { win: null, mu: null, wdl: null };

  function rowFlags(r) {
    const rank = Number(r.Rank);
    const wr = (r.Win_Rate > 1 ? r.Win_Rate / 100 : r.Win_Rate); // normalize if 0..100
    const isTop3 = Number.isFinite(rank) && rank >= 1 && rank <= 3;
    const isHighWR = Number.isFinite(wr) && wr >= 0.80;
    return { isTop3, isHighWR };
  }

  function renderTable(rows) {
    LB.innerHTML = '';
    const frag = document.createDocumentFragment();
    rows.forEach(r => {
      const { isTop3, isHighWR } = rowFlags(r);

      const classes = [
        isTop3 ? 'row-hl-top' : '',
        isHighWR ? 'row-hl-win' : ''
      ].filter(Boolean).join(' ');

      const badges = [];
      if (isTop3)  badges.push('<span class="badge top3" title="Top 3">Top 3</span>');
      if (isHighWR) badges.push('<span class="badge highwr" title="Win Rate ≥ 80%">80%+</span>');

      const tr = document.createElement('tr');
      tr.className = classes;
      tr.innerHTML = `
        <td>${r.Rank}</td>
        <td>
          <a class="btn link" href="#" data-player="${r.Player}">${r.Player}</a>
          ${badges.length ? `<span class="badges">${badges.join('')}</span>` : ''}
        </td>
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

    LB.querySelectorAll('a[data-player]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPlayer(a.dataset.player);
      });
    });
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

    if (q) rows = rows.filter(r => String(r.Player).toLowerCase().includes(q));

    rows.sort(byKey(sortKey));
    renderTable(rows);
    updateCharts(rows);
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
      LB.innerHTML = `<tr><td colspan="9">Failed to load data.</td></tr>`;
    }
  });
})();
