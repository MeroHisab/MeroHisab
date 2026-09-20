/* =========================================================
   txpage.js – one reusable "list page".
   Transactions, Sales and Expenses pages all use this file;
   each page only passes a small config object (see the bottom of
   transactions.html / sales.html / expenses.html).

   It builds: summary cards, filters, table, add/edit modal,
   delete confirmation, pagination and CSV export.
   ========================================================= */

const TxPage = (() => {
  const PAGE_SIZE = 10;
  const { npr, esc, fmtDate, toast } = UI;

  const TYPE_LABEL = { sale: 'Sale', expense: 'Expense', credit: 'Credit', payment: 'Payment' };
  const RANGES = [['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['month', 'This month'], ['all', 'All time']];

  // Helper the pages use inside their summary() function
  const sum = (rows, test = () => true) => rows.reduce((s, t) => s + (test(t) ? t.amount : 0), 0);

  function rangeStart(range) {
    const d = Store.startOfDay();
    if (range === 'today') return d;
    if (range === '7d')  { d.setDate(d.getDate() - 6);  return d; }
    if (range === '30d') { d.setDate(d.getDate() - 29); return d; }
    if (range === 'month') { d.setDate(1); return d; }
    return null; // all time
  }

  function init(cfg) {
    const root = document.getElementById('pageContent');
    const state = {
      q: '', primary: 'all', status: 'all',
      range: cfg.defaultRange || '30d',
      sort: { key: 'date', dir: -1 },
      page: 1, editId: null, deleteId: null
    };

    const statusLabels = cfg.statusLabels || { Completed: 'Completed', Pending: 'Pending' };
    const typeLabels   = cfg.typeLabels   || TYPE_LABEL;

    /* ---------- table columns ---------- */
    const COLS = {
      date:     { label: 'Date', sort: 'date',      cell: t => `<td class="muted">${fmtDate(t.date)}</td>` },
      desc:     { label: cfg.descColumn || 'Description', cell: t => `<td class="desc">${esc(t.desc)}</td>` },
      type:     { label: cfg.typeColumnLabel || 'Type',   cell: t => `<td><span class="pill pill-${t.type}">${typeLabels[t.type] || t.type}</span></td>` },
      customer: { label: 'Customer',                       cell: t => `<td class="muted">${esc(t.customer || '—')}</td>` },
      category: { label: 'Category',                       cell: t => `<td><span class="tag">${esc(t.category || 'Other')}</span></td>` },
      amount:   { label: 'Amount', sort: 'amount',    cell: t => `<td>${amountHtml(t)}</td>` },
      status:   { label: 'Status',                         cell: t => `<td><span class="status"><i class="dot ${t.status === 'Pending' ? 'pending' : 'done'}"></i>${statusLabels[t.status] || t.status}</span></td>` },
      actions:  { label: '<span class="visually-hidden">Actions</span>', cell: t => `
        <td class="text-end">
          <div class="row-actions">
            <button class="icon-btn sm" data-edit="${t.id}" type="button" aria-label="Edit ${esc(t.desc)}"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn sm danger" data-delete="${t.id}" type="button" aria-label="Delete ${esc(t.desc)}"><i class="bi bi-trash3"></i></button>
          </div>
        </td>` }
    };

    function amountHtml(t) {
      if (t.type === 'sale' || t.type === 'payment') return `<span class="pos">+ ${npr(t.amount)}</span>`;
      if (t.type === 'expense') return `<span class="neg">− ${npr(t.amount)}</span>`;
      return `<span class="neu">${npr(t.amount)}</span>`;
    }

    /* ---------- page skeleton ---------- */
    const opt = (v, l, sel) => `<option value="${v}"${sel ? ' selected' : ''}>${l}</option>`;
    const pf = cfg.primaryFilter;

    root.innerHTML = `
      <section class="page-head">
        <div>
          <h1 class="greeting">${cfg.title}</h1>
          <p class="text-muted-2 mb-0">${cfg.subtitle}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn-ghost" id="exportBtn" type="button"><i class="bi bi-download"></i>Export CSV</button>
          <button class="btn-accent" id="addBtn" type="button"><i class="bi bi-plus-lg"></i>${cfg.addLabel}</button>
        </div>
      </section>

      <section class="row g-3 mb-3" id="summary"></section>
      ${cfg.breakdown ? '<section class="mh-card mb-3" id="breakdown"></section>' : ''}

      <section class="mh-card">
        <div class="filters">
          <label class="search">
            <i class="bi bi-search"></i>
            <input id="fQ" type="search" class="form-control" placeholder="${cfg.searchPlaceholder}" aria-label="Search">
          </label>
          <select id="fPrimary" class="form-select" aria-label="${pf.allLabel}">
            ${opt('all', pf.allLabel)}${pf.options.map(([v, l]) => opt(v, l)).join('')}
          </select>
          <select id="fStatus" class="form-select" aria-label="Status">
            ${opt('all', 'All statuses')}
            ${opt('Completed', statusLabels.Completed)}
            ${opt('Pending', statusLabels.Pending)}
          </select>
          <select id="fRange" class="form-select" aria-label="Date range">
            ${RANGES.map(([v, l]) => opt(v, l, v === state.range)).join('')}
          </select>
        </div>

        <div class="table-responsive">
          <table class="table mh-table align-middle">
            <thead><tr id="thead"></tr></thead>
            <tbody id="tbody"></tbody>
          </table>
        </div>

        <div class="empty" id="empty" hidden>
          <i class="bi bi-inbox"></i>
          <strong id="emptyTitle"></strong>
          <span id="emptyText"></span>
          <button class="btn-ghost" id="clearBtn" type="button">Clear filters</button>
        </div>

        <footer class="pager">
          <span class="text-muted-2" id="pagerInfo"></span>
          <nav id="pager" aria-label="Pagination"></nav>
        </footer>
      </section>

      <!-- Add / edit modal -->
      <div class="modal fade" id="txModal" tabindex="-1" aria-labelledby="txModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <form class="modal-content" id="txForm" novalidate>
            <div class="modal-header">
              <h2 class="modal-title fs-5" id="txModalTitle"></h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12" id="typeWrap">
                  <label class="form-label" for="fmType">Type</label>
                  <select class="form-select" id="fmType">${cfg.form.types.map(([v, l]) => opt(v, l)).join('')}</select>
                </div>
                <div class="col-12">
                  <label class="form-label" for="fmDesc" id="descLabel">Items</label>
                  <input class="form-control" id="fmDesc" maxlength="80" autocomplete="off">
                  <div class="invalid-feedback">This field can’t be empty.</div>
                </div>
                <div class="col-12" id="customerWrap">
                  <label class="form-label" for="fmCustomer" id="customerLabel">Customer</label>
                  <input class="form-control" id="fmCustomer" list="customerList" maxlength="40" autocomplete="off" placeholder="Walk-in">
                  <datalist id="customerList"></datalist>
                  <div class="invalid-feedback">Enter the customer’s name for credit and payments.</div>
                </div>
                <div class="col-12" id="categoryWrap">
                  <label class="form-label" for="fmCategory">Category</label>
                  <select class="form-select" id="fmCategory">${Store.CATEGORIES.map(c => opt(c, c)).join('')}</select>
                </div>
                <div class="col-sm-6">
                  <label class="form-label" for="fmAmount">Amount (NPR)</label>
                  <input class="form-control" id="fmAmount" type="number" min="1" step="1" inputmode="numeric">
                  <div class="invalid-feedback">Enter an amount greater than 0.</div>
                </div>
                <div class="col-sm-6">
                  <label class="form-label" for="fmDate">Date &amp; time</label>
                  <input class="form-control" id="fmDate" type="datetime-local">
                  <div class="invalid-feedback">Pick a date and time.</div>
                </div>
                <div class="col-12">
                  <label class="form-label" for="fmStatus">Status</label>
                  <select class="form-select" id="fmStatus">
                    ${opt('Completed', statusLabels.Completed)}${opt('Pending', statusLabels.Pending)}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-ghost" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn-accent" id="saveBtn">Save</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete confirmation -->
      <div class="modal fade" id="delModal" tabindex="-1" aria-labelledby="delTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <div class="modal-body text-center p-4">
              <span class="del-icon"><i class="bi bi-trash3"></i></span>
              <h2 class="fs-5 mb-2" id="delTitle">Delete this ${cfg.noun.toLowerCase()}?</h2>
              <p class="text-muted-2 mb-4" id="delText"></p>
              <div class="d-flex gap-2 justify-content-center">
                <button type="button" class="btn-ghost" data-bs-dismiss="modal">Keep it</button>
                <button type="button" class="btn-danger-mh" id="delConfirm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const $ = id => document.getElementById(id);
    const txModal  = new bootstrap.Modal($('txModal'));
    const delModal = new bootstrap.Modal($('delModal'));

    /* ---------- filtering + sorting ---------- */
    function baseRows() {
      return Store.all().filter(t => cfg.types.includes(t.type));
    }

    function applyFilters(rows, { skipPrimary = false } = {}) {
      const from = rangeStart(state.range);
      const q = state.q.trim().toLowerCase();
      return rows.filter(t => {
        if (from && new Date(t.date) < from) return false;
        if (state.status !== 'all' && t.status !== state.status) return false;
        if (!skipPrimary && state.primary !== 'all' && t[pf.field] !== state.primary) return false;
        if (q && !`${t.desc} ${t.customer} ${t.category}`.toLowerCase().includes(q)) return false;
        return true;
      });
    }

    function sorted(rows) {
      const { key, dir } = state.sort;
      return rows.slice().sort((a, b) =>
        key === 'amount' ? (a.amount - b.amount) * dir : (new Date(a.date) - new Date(b.date)) * dir);
    }

    function daysInRange(rows) {
      if (state.range === 'today') return 1;
      if (state.range === '7d') return 7;
      if (state.range === '30d') return 30;
      if (state.range === 'month') return new Date().getDate();
      if (!rows.length) return 1;
      const first = Math.min(...rows.map(t => +Store.startOfDay(new Date(t.date))));
      return Math.max(1, Math.round((+Store.startOfDay() - first) / 86400000) + 1);
    }

    /* ---------- rendering ---------- */
    function render() {
      const filtered = applyFilters(baseRows());
      const rows = sorted(filtered);

      renderSummary(filtered);
      if (cfg.breakdown) renderBreakdown(applyFilters(baseRows(), { skipPrimary: true }));
      renderHead();
      renderRows(rows);
    }

    function renderSummary(rows) {
      const cards = cfg.summary(rows, { days: daysInRange(rows) });
      $('summary').innerHTML = cards.map(c => `
        <div class="col-12 col-sm-6 col-xl-3">
          <article class="mh-card stat-card">
            <div class="stat-top"><span>${c.label}</span><span class="stat-icon"><i class="bi ${c.icon}"></i></span></div>
            <div class="stat-value${c.small ? ' sm' : ''}">${c.value}</div>
            <div class="stat-meta"><i class="bi ${c.metaIcon || 'bi-clock'}"></i>${c.meta}</div>
          </article>
        </div>`).join('');
    }

    function renderBreakdown(rows) {
      const totals = {};
      rows.forEach(t => { const c = t.category || 'Other'; totals[c] = (totals[c] || 0) + t.amount; });
      const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const total = entries.reduce((s, [, v]) => s + v, 0);

      $('breakdown').innerHTML = `
        <header class="card-head">
          <div>
            <h3 class="card-title">${cfg.breakdown.title}</h3>
            <p class="card-sub">${cfg.breakdown.subtitle}</p>
          </div>
        </header>
        <div class="card-body-pad">
          ${entries.length ? `<div class="bars">${entries.map(([name, v]) => {
            const pct = total ? Math.round((v / total) * 100) : 0;
            return `
              <button type="button" class="bar-row${state.primary === name ? ' on' : ''}" data-cat="${esc(name)}"
                      aria-label="Filter by ${esc(name)}">
                <span class="bar-name">${esc(name)}</span>
                <span class="bar-track"><span class="bar-fill" style="width:${Math.max(pct, 2)}%"></span></span>
                <span class="bar-val">${npr(v)}</span>
                <span class="bar-pct">${pct}%</span>
              </button>`;
          }).join('')}</div>` : '<p class="text-muted-2 mb-0">Nothing to show for these filters.</p>'}
        </div>`;
    }

    function renderHead() {
      $('thead').innerHTML = cfg.columns.map(k => {
        const c = COLS[k];
        if (!c.sort) return `<th${k === 'actions' ? ' class="text-end"' : ''}>${c.label}</th>`;
        const on = state.sort.key === c.sort;
        const icon = on ? (state.sort.dir === -1 ? 'bi-caret-down-fill' : 'bi-caret-up-fill') : 'bi-chevron-expand';
        return `<th aria-sort="${on ? (state.sort.dir === -1 ? 'descending' : 'ascending') : 'none'}">
                  <button type="button" class="th-sort${on ? ' on' : ''}" data-sort="${c.sort}">${c.label}<i class="bi ${icon}"></i></button>
                </th>`;
      }).join('');
    }

    function renderRows(rows) {
      const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      state.page = Math.min(state.page, totalPages);
      const start = (state.page - 1) * PAGE_SIZE;
      const pageRows = rows.slice(start, start + PAGE_SIZE);

      $('tbody').innerHTML = pageRows.map(t => `<tr>${cfg.columns.map(k => COLS[k].cell(t)).join('')}</tr>`).join('');

      const isEmpty = rows.length === 0;
      $('empty').hidden = !isEmpty;
      $('tbody').closest('.table-responsive').hidden = isEmpty;
      if (isEmpty) {
        const filtersOn = state.q || state.primary !== 'all' || state.status !== 'all' || state.range !== 'all';
        const hasAny = baseRows().length > 0;
        $('emptyTitle').textContent = hasAny && filtersOn ? `No ${cfg.entityPlural} match these filters` : `No ${cfg.entityPlural} yet`;
        $('emptyText').textContent  = hasAny && filtersOn ? 'Try a wider date range or clear the search.' : `Use “${cfg.addLabel}” to add your first one.`;
        $('clearBtn').hidden = !(hasAny && filtersOn);
      }

      $('pagerInfo').textContent = isEmpty ? '' :
        `Showing ${start + 1}–${start + pageRows.length} of ${rows.length}`;
      renderPager(totalPages);
    }

    function renderPager(totalPages) {
      if (totalPages <= 1) { $('pager').innerHTML = ''; return; }
      const cur = state.page;
      const pages = [];
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - cur) <= 1) pages.push(p);
        else if (pages[pages.length - 1] !== '…') pages.push('…');
      }
      $('pager').innerHTML =
        `<button class="pg-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''} aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>` +
        pages.map(p => p === '…'
          ? '<span class="pg-gap">…</span>'
          : `<button class="pg-btn${p === cur ? ' on' : ''}" data-page="${p}" ${p === cur ? 'aria-current="page"' : ''}>${p}</button>`).join('') +
        `<button class="pg-btn" data-page="${cur + 1}" ${cur === totalPages ? 'disabled' : ''} aria-label="Next page"><i class="bi bi-chevron-right"></i></button>`;
    }

    /* ---------- filter events ---------- */
    let timer;
    $('fQ').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value; state.page = 1; render(); }, 150);
    });
    $('fPrimary').addEventListener('change', e => { state.primary = e.target.value; state.page = 1; render(); });
    $('fStatus').addEventListener('change',  e => { state.status  = e.target.value; state.page = 1; render(); });
    $('fRange').addEventListener('change',   e => { state.range   = e.target.value; state.page = 1; render(); });

    $('clearBtn').addEventListener('click', () => {
      state.q = ''; state.primary = 'all'; state.status = 'all'; state.range = 'all'; state.page = 1;
      $('fQ').value = ''; $('fPrimary').value = 'all'; $('fStatus').value = 'all'; $('fRange').value = 'all';
      render();
    });

    $('thead').addEventListener('click', e => {
      const b = e.target.closest('[data-sort]');
      if (!b) return;
      const key = b.dataset.sort;
      state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : -1 };
      render();
    });

    $('pager').addEventListener('click', e => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      state.page = Number(b.dataset.page);
      render();
      root.querySelector('.filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (cfg.breakdown) {
      $('breakdown').addEventListener('click', e => {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        const name = b.dataset.cat;
        state.primary = state.primary === name ? 'all' : name;   // click again to remove the filter
        $('fPrimary').value = state.primary;
        state.page = 1;
        render();
      });
    }

    /* ---------- add / edit form ---------- */
    const form = $('txForm');
    const f = {
      type: $('fmType'), desc: $('fmDesc'), customer: $('fmCustomer'), category: $('fmCategory'),
      amount: $('fmAmount'), date: $('fmDate'), status: $('fmStatus')
    };

    // Show / hide fields depending on the chosen type
    function syncForm() {
      const type = f.type.value;
      $('typeWrap').hidden = cfg.form.types.length < 2;
      $('customerWrap').hidden = type === 'expense';
      $('categoryWrap').hidden = type !== 'expense';

      const needs = type === 'credit' || type === 'payment';
      $('customerLabel').textContent = needs ? 'Customer' : 'Customer (optional)';
      $('descLabel').textContent =
        type === 'expense' ? 'What was it for?' : type === 'payment' ? 'Note (optional)' : 'Items sold';
      f.desc.placeholder =
        type === 'expense' ? 'e.g. Shop electricity bill' : type === 'payment' ? 'Payment received' : 'e.g. Rice × 5';
    }
    f.type.addEventListener('change', syncForm);
    form.addEventListener('input', e => e.target.classList.remove('is-invalid'));

    function openForm(t) {
      state.editId = t ? t.id : null;
      form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

      $('txModalTitle').textContent = t ? `Edit ${cfg.noun.toLowerCase()}` : cfg.addLabel;
      $('saveBtn').textContent = t ? 'Save changes' : `Add ${cfg.noun.toLowerCase()}`;
      $('customerList').innerHTML = Store.customers().map(n => `<option value="${esc(n)}">`).join('');

      f.type.value     = t ? t.type : cfg.form.defaultType;
      f.desc.value     = t ? t.desc : '';
      f.customer.value = t && !/^walk-?in$/i.test(t.customer) && t.customer !== '—' ? t.customer : '';
      f.category.value = t && t.category ? t.category : Store.CATEGORIES[0];
      f.amount.value   = t ? t.amount : '';
      f.date.value     = t ? t.date : Store.toLocal(new Date());
      f.status.value   = t ? t.status : 'Completed';

      syncForm();
      txModal.show();
    }

    $('txModal').addEventListener('shown.bs.modal', () => f.desc.focus());
    $('addBtn').addEventListener('click', () => openForm(null));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const type = f.type.value;
      let desc = f.desc.value.trim();
      let customer = f.customer.value.trim();
      const amount = Number(f.amount.value);
      const needsCustomer = type === 'credit' || type === 'payment';

      let ok = true;
      const flag = (el, bad) => { el.classList.toggle('is-invalid', bad); if (bad) ok = false; };
      flag(f.desc, !desc && type !== 'payment');
      flag(f.customer, needsCustomer && (!customer || /^walk-?in$/i.test(customer)));
      flag(f.amount, !(amount > 0));
      flag(f.date, !f.date.value);
      if (!ok) { form.querySelector('.is-invalid').focus(); return; }

      if (type === 'payment' && !desc) desc = 'Payment received';
      customer = type === 'expense' ? '—' : (customer || 'Walk-in');

      const record = {
        type, desc, customer,
        amount: Math.round(amount),
        date: f.date.value,
        status: f.status.value,
        category: type === 'expense' ? f.category.value : ''
      };

      if (state.editId) { Store.update(state.editId, record); toast(`${cfg.noun} updated`); }
      else { Store.add(record); state.page = 1; toast(`${cfg.noun} added`); }

      txModal.hide();
      render();
    });

    /* ---------- edit / delete buttons in the table ---------- */
    $('tbody').addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del  = e.target.closest('[data-delete]');
      if (edit) openForm(Store.get(edit.dataset.edit));
      if (del) {
        const t = Store.get(del.dataset.delete);
        state.deleteId = t.id;
        $('delText').textContent = `“${t.desc}” for ${npr(t.amount)} will be removed.`;
        delModal.show();
      }
    });

    $('delConfirm').addEventListener('click', () => {
      if (state.deleteId) Store.remove(state.deleteId);
      state.deleteId = null;
      delModal.hide();
      toast(`${cfg.noun} deleted`);
      render();
    });

    /* ---------- export ---------- */
    $('exportBtn').addEventListener('click', () => {
      const rows = sorted(applyFilters(baseRows()));
      if (!rows.length) { toast('Nothing to export for these filters', 'error'); return; }
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [['Date', 'Type', 'Description', 'Customer', 'Category', 'Amount (NPR)', 'Status'].join(',')]
        .concat(rows.map(t => [q(t.date.replace('T', ' ')), q(TYPE_LABEL[t.type]), q(t.desc), q(t.customer), q(t.category), t.amount, q(t.status)].join(',')));
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `merohisab-${cfg.entityPlural}-${Store.toLocal(new Date()).slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
      toast(`Exported ${rows.length} ${rows.length === 1 ? cfg.entity : cfg.entityPlural}`);
    });

    render();
  }

  return { init, sum };
})();