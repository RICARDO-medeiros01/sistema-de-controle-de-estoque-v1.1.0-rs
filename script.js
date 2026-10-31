// ── DATA ──────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'estoque_morto_v1';
let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let nextId = records.length ? Math.max(...records.map(r => r.id)) + 1 : 1;
let sortCol = 'data';
let sortDir = -1; // -1 = desc
let pendingDelete = null;
let editingId = null;

// ── INIT ──────────────────────────────────────────────────────────────────────
document.getElementById('f-data').value = today();

function today() {
    return new Date().toISOString().split('T')[0];
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ── ADD ───────────────────────────────────────────────────────────────────────
function addRecord() {
    const codigo = document.getElementById('f-codigo').value.trim();
    const quantidade = parseInt(document.getElementById('f-quantidade').value) || 0;
    const alocacao = document.getElementById('f-alocacao').value.trim();
    const data = document.getElementById('f-data').value;
    const tipo = document.getElementById('f-tipo').value;
    const motivo = document.getElementById('f-motivo').value.trim();

    if (!codigo) { toast('Informe o código da peça.', true); return; }
    if (quantidade < 1) { toast('Informe uma quantidade válida.', true); return; }
    if (!alocacao) { toast('Informe a alocação.', true); return; }
    if (!data) { toast('Informe a data de inserção.', true); return; }

    records.push({ id: nextId++, codigo, quantidade, alocacao, data, tipo, motivo });
    save();
    renderTable();
    updateStats();

    // reset
    document.getElementById('f-codigo').value = '';
    document.getElementById('f-quantidade').value = '1';
    document.getElementById('f-alocacao').value = '';
    document.getElementById('f-data').value = today();
    document.getElementById('f-tipo').value = '';
    document.getElementById('f-motivo').value = '';
    document.getElementById('f-codigo').focus();

    toast('Peça registrada com sucesso!');
}

// ── SORT ──────────────────────────────────────────────────────────────────────
function sortBy(col) {
    if (sortCol === col) sortDir *= -1;
    else { sortCol = col; sortDir = 1; }
    renderTable();
}

// ── FILTER ───────────────────────────────────────────────────────────────────
function filteredRecords() {
    const q = document.getElementById('search').value.toLowerCase();
    const tipo = document.getElementById('filter-tipo').value;

    return records
        .filter(r => {
            const match = !q ||
                r.codigo.toLowerCase().includes(q) ||
                r.alocacao.toLowerCase().includes(q) ||
                (r.motivo || '').toLowerCase().includes(q);
            const typeMatch = !tipo || r.tipo === tipo;
            return match && typeMatch;
        })
        .sort((a, b) => {
            let va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
            if (typeof va === 'number') return (va - vb) * sortDir;
            return String(va).localeCompare(String(vb)) * sortDir;
        });
}

// ── RENDER ────────────────────────────────────────────────────────────────────
const TIPO_CLASS = {
    'Quebra / Dano físico': 'badge-red',
    'Peça obsoleta': 'badge-gray',
    'Erro de inventário': 'badge-blue',
    'Desvio / Furto': 'badge-red',
    'Defeito de fabricação': 'badge-yellow',
    'Vencimento / Validade': 'badge-green',
    'Outro': 'badge-gray',
};

function fmtDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function renderTable() {
    const data = filteredRecords();
    const tbody = document.getElementById('table-body');
    const empty = document.getElementById('empty-state');

    // sort arrows
    ['id', 'codigo', 'quantidade', 'alocacao', 'data', 'tipo'].forEach(c => {
        const th = document.getElementById('th-' + c);
        if (!th) return;
        th.classList.toggle('sorted', sortCol === c);
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = sortCol === c ? (sortDir === 1 ? '↑' : '↓') : '↕';
    });

    if (!data.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        document.getElementById('rec-count').textContent = '0 registros';
        return;
    }

    empty.style.display = 'none';
    document.getElementById('rec-count').textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = data.map(r => `
    <tr>
      <td class="mono" style="color:var(--text-muted);font-size:11px;">${String(r.id).padStart(4, '0')}</td>
      <td class="mono">${escHtml(r.codigo)}</td>
      <td style="font-family:var(--mono);font-size:13px;text-align:center;font-weight:500;">${r.quantidade ?? 1}</td>
      <td>${escHtml(r.alocacao)}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text-muted)">${fmtDate(r.data)}</td>
      <td>${r.tipo ? `<span class="badge ${TIPO_CLASS[r.tipo] || 'badge-gray'}">${escHtml(r.tipo)}</span>` : '<span style="color:var(--text-dim);font-size:12px;">—</span>'}</td>
      <td><div class="motivo-text" title="${escHtml(r.motivo || '')}">${escHtml(r.motivo || '—')}</div></td>
      <td><div class="action-cell">
        <button class="btn btn-edit" onclick="openEditModal(${r.id})" title="Editar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-danger" onclick="askDelete(${r.id})" title="Remover">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div></td>
    </tr>
  `).join('');
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear());
    const monthRecords = records.filter(r => r.data && r.data.startsWith(`${yy}-${mm}`));
    const alocacoes = new Set(records.map(r => r.alocacao)).size;

    document.getElementById('stat-total').textContent = records.length;
    document.getElementById('stat-month').textContent = monthRecords.length;
    document.getElementById('stat-alocacoes').textContent = alocacoes;
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function askDelete(id) {
    pendingDelete = id;
    const r = records.find(x => x.id === id);
    document.getElementById('modal-code').textContent = r?.codigo || id;
    document.getElementById('modal').classList.add('open');
}

function closeModal() {
    pendingDelete = null;
    document.getElementById('modal').classList.remove('open');
}

function confirmDelete() {
    records = records.filter(r => r.id !== pendingDelete);
    save();
    renderTable();
    updateStats();
    closeModal();
    toast('Registro removido.');
}

document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});

// ── EDIT ──────────────────────────────────────────────────────────────────────
function openEditModal(id) {
    const r = records.find(x => x.id === id);
    if (!r) return;
    editingId = id;

    document.getElementById('edit-badge-code').textContent = r.codigo;
    document.getElementById('e-codigo').value = r.codigo;
    document.getElementById('e-quantidade').value = r.quantidade ?? 1;
    document.getElementById('e-alocacao').value = r.alocacao;
    document.getElementById('e-data').value = r.data;
    document.getElementById('e-tipo').value = r.tipo || '';
    document.getElementById('e-motivo').value = r.motivo || '';

    document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
    editingId = null;
    document.getElementById('edit-modal').classList.remove('open');
}

function saveEdit() {
    if (editingId === null) return;

    const codigo = document.getElementById('e-codigo').value.trim();
    const quantidade = parseInt(document.getElementById('e-quantidade').value) || 0;
    const alocacao = document.getElementById('e-alocacao').value.trim();
    const data = document.getElementById('e-data').value;
    const tipo = document.getElementById('e-tipo').value;
    const motivo = document.getElementById('e-motivo').value.trim();

    if (!codigo) { toast('Informe o código da peça.', true); return; }
    if (quantidade < 1) { toast('Informe uma quantidade válida.', true); return; }
    if (!alocacao) { toast('Informe a alocação.', true); return; }
    if (!data) { toast('Informe a data de inserção.', true); return; }

    const r = records.find(x => x.id === editingId);
    if (!r) return;

    r.codigo = codigo;
    r.quantidade = quantidade;
    r.alocacao = alocacao;
    r.data = data;
    r.tipo = tipo;
    r.motivo = motivo;

    save();
    renderTable();
    updateStats();
    closeEditModal();
    toast('Registro atualizado com sucesso!');
}

document.getElementById('edit-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEditModal();
});

// ── EXPORT XLS ───────────────────────────────────────────────────────────────
function exportXLS() {
    if (!records.length) { toast('Nenhum dado para exportar.', true); return; }

    const ws_data = [
        ['#', 'Código da Peça', 'Quantidade', 'Alocação', 'Data de Inserção', 'Tipo de Furo', 'Motivo'],
        ...filteredRecords().map(r => [
            r.id,
            r.codigo,
            r.quantidade ?? 1,
            r.alocacao,
            fmtDate(r.data),
            r.tipo || '',
            r.motivo || '',
        ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // column widths
    ws['!cols'] = [
        { wch: 6 }, { wch: 18 }, { wch: 10 }, { wch: 24 }, { wch: 16 }, { wch: 24 }, { wch: 40 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Estoque Morto');

    const filename = `estoque_morto_${today()}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast('Arquivo XLS exportado!');
}

// ── EXPORT PDF ────────────────────────────────────────────────────────────────
function exportPDF() {
    if (!records.length) { toast('Nenhum dado para exportar.', true); return; }

    const data = filteredRecords();
    const now = new Date().toLocaleDateString('pt-BR');

    const rows = data.map(r => `
    <tr>
      <td>${String(r.id).padStart(4, '0')}</td>
      <td><strong>${escHtml(r.codigo)}</strong></td>
      <td style="text-align:center;">${r.quantidade ?? 1}</td>
      <td>${escHtml(r.alocacao)}</td>
      <td>${fmtDate(r.data)}</td>
      <td>${escHtml(r.tipo || '—')}</td>
      <td>${escHtml(r.motivo || '—')}</td>
    </tr>
  `).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Estoque Morto — ${now}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; padding: 32px; }
  .header { margin-bottom: 24px; border-bottom: 2px solid #e8b84b; padding-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 20px; font-weight: 700; color: #0e0f11; letter-spacing: -0.02em; }
  .header p { font-size: 11px; color: #666; margin-top: 3px; }
  .header-meta { text-align: right; font-size: 11px; color: #888; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; border-bottom: 1px solid #ddd; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:hover td { background: #fafafa; }
  td:first-child { font-family: monospace; color: #888; }
  td:nth-child(2) strong { color: #c49b2e; }
  .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>&#9643; Estoque Morto</h1>
    <p>Relatório de Peças com Furo</p>
  </div>
  <div class="header-meta">
    Gerado em: ${now}<br>
    Total de registros: ${data.length}
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Código</th><th>Qtd</th><th>Alocação</th><th>Data</th><th>Tipo de Furo</th><th>Motivo</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Sistema de Controle de Estoque Morto — ${now}</div>
</body>
</html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
    toast('PDF gerado — use Ctrl+P para salvar!');
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, isError = false) {
    const el = document.getElementById('toast');
    el.textContent = isError ? '⚠ ' + msg : '✓ ' + msg;
    el.className = 'show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.className = '', 2800);
}

// ── KEYBOARD ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
        closeEditModal();
    }
});

// ── TEMA DIA / NOITE ──────────────────────────────────────────────────────────
function updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const label = document.getElementById('theme-label');
    if (label) {
        label.textContent = theme === 'light' ? 'Modo Noite' : 'Modo Dia';
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.setAttribute('title', theme === 'light' ? 'Ativar Modo Noite' : 'Ativar Modo Dia');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    updateThemeUI(next);
    toast(next === 'light' ? 'Modo Dia ativado!' : 'Modo Noite ativado!');
}

const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

const initialTheme = localStorage.getItem('theme') || 'dark';
updateThemeUI(initialTheme);

// ── BOOTSTRAP ─────────────────────────────────────────────────────────────────
renderTable();
updateStats();