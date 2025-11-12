// Theme toggle & small helpers
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme') || 'dark';
  if (saved === 'light') root.classList.add('light');

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      root.classList.toggle('light');
      localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    });
  }
})();

function formatPercent(x) {
  if (x == null || Number.isNaN(x)) return '–';
  // Win_Rate is expected as fraction (0..1). If it looks like 0..100, normalize.
  const v = x > 1.0 ? x / 100 : x;
  return (v * 100).toFixed(1) + '%';
}

function byKey(key, desc = false) {
  const k = key.startsWith('-') ? key.slice(1) : key;
  const d = desc || key.startsWith('-');
  return (a, b) => {
    const av = a[k], bv = b[k];
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (d ? -1 : 1);
  };
}

function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function navigateToPlayer(name) {
  const u = new URL('player.html', window.location.href);
  u.searchParams.set('name', name);
  window.location.href = u.toString();
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateText(s, n = 100) {
  if (s == null) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}
