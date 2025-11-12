function buildWinRateBar(chartEl, rows) {
  const labels = rows.map(r => r.Player);
  const data = rows.map(r => r.Win_Rate > 1 ? r.Win_Rate / 100 : r.Win_Rate);

  return new Chart(chartEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Win Rate', data: data.map(x => x * 100) }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.raw.toFixed(1)}%` } },
        title: { display: false }
      },
      scales: {
        y: { ticks: { callback: v => v + '%' }, beginAtZero: true, max: 100 }
      }
    }
  });
}

function buildRatingDist(chartEl, rows) {
  // Simple histogram of Rating_Mu
  const values = rows.map(r => Number(r.Rating_Mu)).filter(v => Number.isFinite(v));
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = 10;
  const step = (max - min) / bins || 1;
  const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * step);

  const counts = Array(bins).fill(0);
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
    counts[idx]++;
  });

  const labels = counts.map((_, i) => `${(edges[i]).toFixed(1)}–${(edges[i+1]).toFixed(1)}`);

  return new Chart(chartEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Count', data: counts }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: { y: { beginAtZero: true, precision: 0 } }
    }
  });
}

function buildWDLStacked(chartEl, rows) {
  const labels = rows.map(r => r.Player);
  const wins  = rows.map(r => r.Wins);
  const draws = rows.map(r => r.Draws);
  const losses= rows.map(r => r.Losses);

  return new Chart(chartEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Wins', data: wins, stack: 'wdl' },
        { label: 'Draws', data: draws, stack: 'wdl' },
        { label: 'Losses', data: losses, stack: 'wdl' },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}
