/* =========================================================
   MHChart – a small smooth-line chart built with plain SVG.
   No Chart.js needed, so we stay 100% vanilla JS.

   Usage:  MHChart.render(document.getElementById('chart'), data)
   data =  { labels: [], sales: [], expenses: [], profit: [] }
   ========================================================= */

const MHChart = (() => {
  const COLORS = { sales: '#2BC48A', expenses: '#F2A93B', profit: '#3BA0E0' };
  const NAMES  = { sales: 'Sales', expenses: 'Expenses', profit: 'Profit' };
  const PAD    = { top: 14, right: 18, bottom: 30, left: 46 };
  const TICKS  = 4;                                  // 0k, 4k, 8k, 12k, 16k → 4 gaps
  const fmtNPR = n => 'NPR ' + n.toLocaleString('en-IN');
  const fmtAxis = v => (v / 1000) + 'k';

  // Pick a "nice" step (1, 2, 2.5, 5 × 10ⁿ) so axis labels look clean
  function niceStep(maxVal) {
    const raw = maxVal / TICKS;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const options = [1, 2, 2.5, 5, 10].map(m => m * pow);
    return options.find(s => s >= raw) || options[options.length - 1];
  }

  // Turn points into a smooth curve (Catmull-Rom → cubic Bézier)
  function smoothPath(pts, yMin, yMax) {
    const clampY = y => Math.min(Math.max(y, yMin), yMax);
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function render(container, data) {
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (!W || !H) return;

    const n     = data.labels.length;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const yBase = PAD.top + plotH;

    const maxVal = Math.max(...data.sales, ...data.expenses, ...data.profit);
    const step   = niceStep(maxVal);
    const yMax   = step * TICKS;

    const xAt = i => PAD.left + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
    const yAt = v => PAD.top + plotH - (v / yMax) * plotH;

    const toPts = arr => arr.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
    const series = ['sales', 'expenses', 'profit'].map(key => ({ key, pts: toPts(data[key]) }));

    /* ----- grid + y labels ----- */
    let grid = '';
    for (let t = 0; t <= TICKS; t++) {
      const val = t * step;
      const y = yAt(val);
      grid += `<line x1="${PAD.left}" x2="${W - PAD.right}" y1="${y}" y2="${y}" stroke="#212B36" stroke-width="1"/>`;
      grid += `<text x="${PAD.left - 12}" y="${y + 4}" text-anchor="end">${fmtAxis(val)}</text>`;
    }

    /* ----- x labels (skip some when there are many points) ----- */
    const every = Math.ceil(n / Math.max(1, Math.floor(plotW / 64)));
    let xLabels = '';
    data.labels.forEach((label, i) => {
      if (i % every === 0) {
        xLabels += `<text x="${xAt(i)}" y="${H - 6}" text-anchor="middle">${label}</text>`;
      }
    });

    /* ----- lines + area ----- */
    const salesPts = series[0].pts;
    const salesLine = smoothPath(salesPts, PAD.top, yBase);
    const area = `${salesLine} L${salesPts[n - 1].x},${yBase} L${salesPts[0].x},${yBase} Z`;

    const paths = series.map(s =>
      `<path d="${smoothPath(s.pts, PAD.top, yBase)}" fill="none" stroke="${COLORS[s.key]}" stroke-width="2.2" stroke-linecap="round"/>`
    ).join('');

    const dots = series.map(s =>
      `<circle class="dot" data-key="${s.key}" r="4.5" fill="${COLORS[s.key]}" stroke="#131A22" stroke-width="2" style="display:none"/>`
    ).join('');

    container.innerHTML = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Sales, expenses and profit chart">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="${COLORS.sales}" stop-opacity=".22"/>
            <stop offset="100%" stop-color="${COLORS.sales}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#salesFill)"/>
        ${paths}
        <line class="guide" y1="${PAD.top}" y2="${yBase}" stroke="#3a4653" stroke-dasharray="4 4" style="display:none"/>
        ${dots}
        ${xLabels}
        <rect class="hit" x="${PAD.left}" y="${PAD.top}" width="${plotW}" height="${plotH}" fill="transparent"/>
      </svg>
      <div class="chart-tip" role="status"></div>
    `;

    /* ----- hover / touch tooltip ----- */
    const svg   = container.querySelector('svg');
    const tip   = container.querySelector('.chart-tip');
    const guide = svg.querySelector('.guide');
    const dotEls = svg.querySelectorAll('.dot');
    const hit   = svg.querySelector('.hit');
    const gap   = n === 1 ? plotW : plotW / (n - 1);

    function show(evt) {
      const rect = svg.getBoundingClientRect();
      let i = Math.round((evt.clientX - rect.left - PAD.left) / gap);
      i = Math.max(0, Math.min(n - 1, i));
      const x = xAt(i);

      guide.setAttribute('x1', x);
      guide.setAttribute('x2', x);
      guide.style.display = '';

      dotEls.forEach(dot => {
        const key = dot.dataset.key;
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', yAt(data[key][i]));
        dot.style.display = '';
      });

      tip.innerHTML =
        `<strong>${data.labels[i]}</strong>` +
        ['sales', 'expenses', 'profit'].map(k =>
          `<div><i style="background:${COLORS[k]}"></i>${NAMES[k]}<b>${fmtNPR(data[k][i])}</b></div>`
        ).join('');

      const tipW = tip.offsetWidth;
      tip.style.left = (x + 14 + tipW > W ? x - tipW - 14 : x + 14) + 'px';
      tip.classList.add('show');
    }

    function hide() {
      guide.style.display = 'none';
      dotEls.forEach(d => (d.style.display = 'none'));
      tip.classList.remove('show');
    }

    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
  }

  return { render };
})();