/**
 * ==========================================================================
 * Controle de Devoluções - Lógica e Comportamento
 * ==========================================================================
 */

(function () {
  'use strict';

  var PRAZO = 7;
  var KEY = 'devolucoes:v1';
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function dn(iso) {
    var p = iso.split('-').map(Number);
    return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5);
  }

  function addDays(iso, n) {
    var t = new Date((dn(iso) + n) * 864e5);
    return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  }

  function fmt(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
  }

  var today = isoToday();
  var items = [];
  var backend = null;
  var ready = false;
  var filter = 'todas';
  var query = '';
  var order = 'urgente';
  var confirmDel = null;
  var editId = null;
  var alertShown = false;
  var exited = false;
  var lastFocus = null;
  var toastTimer = null;

  /* ==========================================================================
     Cálculo de Prazo e Enriquecimento
     ========================================================================== */

  function enrich(i) {
    var criado = i.criado || today;
    var left = PRAZO - (dn(today) - dn(criado));
    var st = left < 0 ? 'vencida' : left === 0 ? 'hoje' : left <= 2 ? 'atencao' : 'ok';
    return {
      id: i.id,
      codigo: String(i.codigo || ''),
      qtd: Number(i.qtd) || 0,
      nf: String(i.nf || ''),
      disp: String(i.disp || ''),
      criado: criado,
      exemplo: !!i.exemplo,
      left: left,
      st: st,
      venc: addDays(criado, PRAZO)
    };
  }

  function label(r) {
    if (r.left < 0) {
      var n = -r.left;
      return 'Vencida há ' + n + (n === 1 ? ' dia' : ' dias');
    }
    if (r.left === 0) return 'Vence hoje';
    return r.left === 1 ? 'Falta 1 dia' : 'Faltam ' + r.left + ' dias';
  }

  function allRows() {
    return items.map(enrich);
  }

  function overdueRows() {
    return allRows()
      .filter(function (r) { return r.st === 'vencida'; })
      .sort(function (a, b) { return a.left - b.left || a.codigo.localeCompare(b.codigo); });
  }

  /* ==========================================================================
     Notificações e Diálogos (Modais)
     ========================================================================== */

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('on');
    }, 3200);
  }

  function openOv(el, focusEl) {
    lastFocus = document.activeElement;
    el.hidden = false;
    if (focusEl) {
      setTimeout(function () {
        focusEl.focus();
      }, 0);
    }
  }

  function closeOv(el) {
    el.hidden = true;
    if (lastFocus && lastFocus.focus) {
      try {
        lastFocus.focus();
      } catch (e) {}
    }
  }

  /* ==========================================================================
     Renderização
     ========================================================================== */

  function render() {
    var all = allRows();
    $('today-d').textContent = fmt(today);
    $('today-w').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    $('f-data').value = fmt(today);

    var venc = all.filter(function (r) { return r.st === 'vencida'; }).length;
    var prox = all.filter(function (r) { return r.st === 'hoje' || r.st === 'atencao'; }).length;
    var semd = all.filter(function (r) { return !r.disp; }).length;

    $('s-venc').textContent = venc;
    $('s-prox').textContent = prox;
    $('s-disp').textContent = semd;
    $('s-total').textContent = all.length;

    $('st-venc').dataset.tone = venc ? 'bad' : '';
    $('st-prox').dataset.tone = prox ? 'warn' : '';
    $('st-disp').dataset.tone = semd ? 'warn' : '';

    $('c-todas').textContent = '(' + all.length + ')';
    $('c-vencidas').textContent = '(' + venc + ')';
    $('c-semdisp').textContent = '(' + semd + ')';

    var band = $('band');
    band.hidden = venc === 0;
    if (venc) {
      $('band-msg').textContent = venc + (venc === 1 ? ' peça passou' : ' peças passaram') + ' do prazo de ' + PRAZO + ' dias corridos para devolução.';
    }

    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
    });

    $('rm-examples').hidden = !items.some(function (i) { return i.exemplo; });
    $('f-add').disabled = !ready;
    $('storage-note').hidden = !(backend && backend.kind === 'local');

    var list = all.filter(function (r) {
      if (filter === 'vencidas' && r.st !== 'vencida') return false;
      if (filter === 'semdisp' && r.disp) return false;
      if (query) {
        var h = (r.codigo + ' ' + r.nf + ' ' + r.disp).toLowerCase();
        if (h.indexOf(query) < 0) return false;
      }
      return true;
    });

    list.sort(function (a, b) {
      var d = order === 'urgente' ? a.left - b.left : b.left - a.left;
      return d || a.codigo.localeCompare(b.codigo);
    });

    $('list-count').textContent = ready
      ? (list.length === all.length ? all.length + (all.length === 1 ? ' peça' : ' peças') : list.length + ' de ' + all.length + ' peças')
      : '';

    $('rows').innerHTML = list.map(rowHtml).join('');

    var empty = $('empty');
    if (!ready) {
      empty.hidden = false;
      empty.innerHTML = '<p>Carregando lançamentos…</p>';
    } else if (!all.length) {
      empty.hidden = false;
      empty.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;display:block;color:var(--text-dim);"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg><p>Nenhuma peça lançada ainda. Preencha o formulário ao lado para registrar a primeira devolução. A data é automática e o prazo de 7 dias começa a contar a partir dela.</p><button type="button" class="btn btn-ghost" id="seed" style="margin-top:8px;">Preencher com peças de exemplo</button>';
    } else if (!list.length) {
      empty.hidden = false;
      empty.innerHTML = '<p>Nenhuma peça encontrada com esse filtro.</p>';
    } else {
      empty.hidden = true;
    }
  }

  function rowHtml(r) {
    var asking = confirmDel === r.id;
    var acts = asking
      ? '<span class="ask">Excluir esta peça?</span><button type="button" class="btn btn-danger sm" data-act="delyes">Sim, excluir</button><button type="button" class="btn btn-ghost sm" data-act="delno">Cancelar</button>'
      : '<button type="button" class="btn btn-ghost sm" data-act="edit">Editar</button><button type="button" class="btn btn-ghost sm" data-act="del">Excluir</button>';

    return '<tr data-id="' + esc(r.id) + '" data-s="' + r.st + '">' +
      '<td data-l="Prazo" class="full"><span class="pill ' + r.st + '">' + label(r) + '</span></td>' +
      '<td data-l="Código" class="mono">' + esc(r.codigo) + (r.exemplo ? '<span class="tag">exemplo</span>' : '') + '</td>' +
      '<td data-l="Qtd" class="num">' + r.qtd + '</td>' +
      '<td data-l="NF" class="mono">' + esc(r.nf) + '</td>' +
      '<td data-l="DISP">' + (r.disp ? '<span class="mono">' + esc(r.disp) + '</span>' : '<button type="button" class="link" data-act="disp">Informar DISP</button>') + '</td>' +
      '<td data-l="Entrada">' + fmt(r.criado) + '</td>' +
      '<td data-l="Vencimento">' + fmt(r.venc) + '</td>' +
      '<td class="acts full">' + acts + '</td></tr>';
  }

  /* ==========================================================================
     Armazenamento e Backend
     ========================================================================== */

  function loadLocal() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function onData() {
    ready = true;
    render();
    if (!alertShown && !exited && overdueRows().length) {
      alertShown = true;
      openAlert();
    }
  }

  async function init() {
    var db = null;
    try {
      db = window.claude && window.claude.use ? await window.claude.use('db') : null;
    } catch (e) {
      db = null;
    }

    if (db) {
      var col = db.collection('devolucoes');
      backend = {
        kind: 'db',
        add: function (o) { return col.add(o); },
        update: function (id, o) { return col.doc(id).update(o); },
        remove: function (id) { return col.doc(id).delete(); }
      };
      col.onSnapshot(function (snap) {
        items = snap.docs.map(function (d) {
          var o = d.data() || {};
          o.id = d.id;
          return o;
        });
        onData();
      }, function () {
        toast('Não foi possível ler os lançamentos salvos.');
        ready = true;
        render();
      });
    } else {
      items = loadLocal();
      backend = {
        kind: 'local',
        add: async function (o) {
          items.push(Object.assign({ id: uid() }, o));
          saveLocal();
          onData();
        },
        update: async function (id, o) {
          items = items.map(function (i) {
            return i.id === id ? Object.assign({}, i, o) : i;
          });
          saveLocal();
          onData();
        },
        remove: async function (id) {
          items = items.filter(function (i) { return i.id !== id; });
          saveLocal();
          onData();
        }
      };
      onData();
    }
  }

  async function run(fn, okMsg) {
    try {
      await fn();
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) {
      toast('Não foi possível salvar as alterações.');
      return false;
    }
  }

  /* ==========================================================================
     Validação e Formulário de Lançamento
     ========================================================================== */

  function validate(codigo, qtd, nf) {
    if (!codigo.trim()) return { f: 'codigo', m: 'Informe o código da peça.' };
    var q = Number(qtd);
    if (!qtd || !Number.isInteger(q) || q < 1) return { f: 'qtd', m: 'Informe a quantidade como um número inteiro maior que zero.' };
    if (!nf.trim()) return { f: 'nf', m: 'Informe o número da NF.' };
    return null;
  }

  function clearInvalid(p) {
    ['codigo', 'qtd', 'nf'].forEach(function (f) {
      var el = $(p + '-' + f);
      if (el) el.removeAttribute('aria-invalid');
    });
  }

  $('add-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!ready) return;
    clearInvalid('f');
    var codigo = $('f-codigo').value;
    var qtd = $('f-qtd').value;
    var nf = $('f-nf').value;
    var disp = $('f-disp').value;
    var bad = validate(codigo, qtd, nf);

    if (bad) {
      $('f-err').textContent = bad.m;
      $('f-' + bad.f).setAttribute('aria-invalid', 'true');
      $('f-' + bad.f).focus();
      return;
    }

    $('f-err').textContent = '';
    var ok = await run(function () {
      return backend.add({
        codigo: codigo.trim().toUpperCase(),
        qtd: Number(qtd),
        nf: nf.trim(),
        disp: disp.trim(),
        criado: today
      });
    }, 'Peça lançada.');

    if (ok) {
      $('f-codigo').value = '';
      $('f-qtd').value = '';
      $('f-nf').value = '';
      $('f-disp').value = '';
      $('f-codigo').focus();
    }
  });

  /* ==========================================================================
     Lista: Filtros, Pesquisa e Ordenação
     ========================================================================== */

  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.filter;
      render();
    });
  });

  $('q').addEventListener('input', function (e) {
    query = e.target.value.trim().toLowerCase();
    render();
  });

  $('order').addEventListener('change', function (e) {
    order = e.target.value;
    render();
  });

  /* ==========================================================================
     Ações da Tabela e Modal de Edição
     ========================================================================== */

  function openEdit(id, focusDisp) {
    var r = allRows().find(function (x) { return x.id === id; });
    if (!r) return;
    editId = id;
    clearInvalid('e');
    $('e-err').textContent = '';
    $('e-codigo').value = r.codigo;
    $('e-qtd').value = r.qtd;
    $('e-nf').value = r.nf;
    $('e-disp').value = r.disp;
    $('e-data').value = fmt(r.criado);
    openOv($('ov-edit'), focusDisp ? $('e-disp') : $('e-codigo'));
  }

  $('rows').addEventListener('click', async function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var tr = b.closest('tr');
    var id = tr && tr.dataset.id;
    var act = b.dataset.act;

    if (act === 'edit') openEdit(id, false);
    else if (act === 'disp') openEdit(id, true);
    else if (act === 'del') { confirmDel = id; render(); }
    else if (act === 'delno') { confirmDel = null; render(); }
    else if (act === 'delyes') {
      confirmDel = null;
      await run(function () { return backend.remove(id); }, 'Peça excluída.');
      render();
    }
  });

  $('edit-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearInvalid('e');
    var codigo = $('e-codigo').value;
    var qtd = $('e-qtd').value;
    var nf = $('e-nf').value;
    var disp = $('e-disp').value;
    var bad = validate(codigo, qtd, nf);

    if (bad) {
      $('e-err').textContent = bad.m;
      $('e-' + bad.f).setAttribute('aria-invalid', 'true');
      $('e-' + bad.f).focus();
      return;
    }

    var id = editId;
    var ok = await run(function () {
      return backend.update(id, {
        codigo: codigo.trim().toUpperCase(),
        qtd: Number(qtd),
        nf: nf.trim(),
        disp: disp.trim()
      });
    }, 'Alterações salvas.');

    if (ok) closeOv($('ov-edit'));
  });

  $('e-cancel').addEventListener('click', function () {
    closeOv($('ov-edit'));
  });

  /* ==========================================================================
     Dados de Exemplo
     ========================================================================== */

  document.addEventListener('click', async function (e) {
    if (e.target && e.target.id === 'seed') {
      if (!ready) return;
      var defs = [
        ['20718450', 4, '004871', '', 12],
        ['20693127', 1, '004866', '1048213', 9],
        ['21034588', 12, '004902', '', 6],
        ['20885041', 2, '004915', '', 3],
        ['21120967', 6, '004931', '', 0]
      ];
      var ok = true;
      for (var i = 0; i < defs.length && ok; i++) {
        var d = defs[i];
        ok = await run(function () {
          return backend.add({
            codigo: d[0],
            qtd: d[1],
            nf: d[2],
            disp: d[3],
            criado: addDays(today, -d[4]),
            exemplo: true
          });
        });
      }
      if (ok) toast('Peças de exemplo carregadas. Remova-as quando quiser, no rodapé.');
    }
  });

  $('rm-examples').addEventListener('click', async function () {
    var ids = items.filter(function (i) { return i.exemplo; }).map(function (i) { return i.id; });
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (!(await run(function () { return backend.remove(id); }))) return;
    }
    toast('Peças de exemplo removidas.');
  });

  /* ==========================================================================
     Aviso de Vencidas e Exportação (PDF / Excel)
     ========================================================================== */

  function openAlert() {
    var rows = overdueRows();
    var n = rows.length;
    $('al-title').textContent = n + (n === 1 ? ' peça passou do prazo' : ' peças passaram do prazo');
    $('al-text').textContent = 'O prazo de devolução é de ' + PRAZO + ' dias corridos. Baixe a lista abaixo e confira o DISP dessas peças.';
    $('al-list').innerHTML = rows.slice(0, 20).map(function (r) {
      return '<li><span class="mono">' + esc(r.codigo) + ' · NF ' + esc(r.nf) + '</span><b>' + label(r) + '</b></li>';
    }).join('') + (n > 20 ? '<li><span>e mais ' + (n - 20) + ' na lista completa</span></li>' : '');
    openOv($('ov-alert'), $('al-close'));
  }

  $('al-close').addEventListener('click', function () {
    closeOv($('ov-alert'));
  });

  $('band-see').addEventListener('click', function () {
    filter = 'vencidas';
    render();
    $('t-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function buildPdfDoc(rows) {
    var J = window.jspdf.jsPDF;
    var doc = new J({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    var totalQtd = rows.reduce(function (s, r) { return s + r.qtd; }, 0);

    doc.setFontSize(17);
    doc.setTextColor(18, 32, 43);
    doc.text('Peças com prazo de devolução vencido', 40, 46);

    doc.setFontSize(10);
    doc.setTextColor(88, 105, 122);
    doc.text('Emitido em ' + fmt(today) + '  |  Prazo de ' + PRAZO + ' dias corridos  |  ' + rows.length + ' peça(s), ' + totalQtd + ' unidade(s)', 40, 64);

    doc.autoTable({
      startY: 80,
      head: [['Código', 'Qtd', 'NF', 'DISP', 'Entrada', 'Vencimento', 'Atraso (dias)']],
      body: rows.map(function (r) {
        return [r.codigo, String(r.qtd), r.nf, r.disp || 'sem DISP', fmt(r.criado), fmt(r.venc), String(-r.left)];
      }),
      styles: { fontSize: 10, cellPadding: 6, textColor: [18, 32, 43] },
      headStyles: { fillColor: [11, 92, 115], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 246, 248] },
      columnStyles: { 1: { halign: 'right' }, 6: { halign: 'right' } },
      margin: { left: 40, right: 40 }
    });

    return doc;
  }

  function buildXlsxWb(rows) {
    var aoa = [['Código', 'Qtd', 'NF', 'DISP', 'Entrada', 'Vencimento', 'Atraso (dias)']].concat(
      rows.map(function (r) {
        return [r.codigo, r.qtd, r.nf, r.disp || 'sem DISP', fmt(r.criado), fmt(r.venc), -r.left];
      })
    );
    var ws = window.XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    var wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Vencidas');
    return wb;
  }

  async function exportOverdue(kind) {
    var rows = overdueRows();
    if (!rows.length) {
      toast('Não há peças vencidas.');
      return;
    }

    var dl = null;
    try {
      dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    } catch (e) {
      dl = null;
    }

    try {
      var name = kind === 'pdf' ? 'pecas-vencidas-' + today + '.pdf' : 'pecas-vencidas-' + today + '.xlsx';

      if (dl) {
        var data;
        if (kind === 'pdf') {
          if (!window.jspdf) throw new Error('lib');
          data = buildPdfDoc(rows).output('arraybuffer');
        } else {
          if (!window.XLSX) throw new Error('lib');
          var wb = buildXlsxWb(rows);
          data = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        }
        await dl.save({ filename: name, data: data });
      } else {
        // Fallback padrão para navegadores comuns
        if (kind === 'pdf') {
          if (!window.jspdf) throw new Error('lib');
          var doc = buildPdfDoc(rows);
          doc.save(name);
        } else {
          if (!window.XLSX) throw new Error('lib');
          var wbOut = buildXlsxWb(rows);
          window.XLSX.writeFile(wbOut, name);
        }
      }
      toast('Arquivo salvo com sucesso.');
    } catch (e) {
      if (e && e.code === 'declined') return;
      toast('Não foi possível gerar o arquivo. Tente novamente.');
    }
  }

  document.querySelectorAll('[data-export]').forEach(function (b) {
    b.addEventListener('click', function () {
      exportOverdue(b.dataset.export);
    });
  });

  /* ==========================================================================
     Saída com Verificação em Duas Etapas
     ========================================================================== */

  function showStep(n) {
    $('x-step1').hidden = n !== 1;
    $('x-step2').hidden = n !== 2;
    if (n === 2) {
      var all = allRows();
      var sem = all.filter(function (r) { return !r.disp; }).length;
      var ven = all.filter(function (r) { return r.st === 'vencida'; }).length;
      var t = sem
        ? sem + (sem === 1 ? ' peça ainda está' : ' peças ainda estão') + ' sem número de DISP.'
        : 'Todas as peças têm o número de DISP informado.';
      if (ven) t += ' ' + ven + (ven === 1 ? ' peça está vencida.' : ' peças estão vencidas.');
      $('x-sum').textContent = t + ' Deseja sair mesmo assim?';
    }
  }

  $('btn-exit').addEventListener('click', function () {
    showStep(1);
    openOv($('ov-exit'), $('x-no'));
  });

  $('x-no').addEventListener('click', function () {
    closeOv($('ov-exit'));
    if (items.some(function (i) { return !i.disp; })) {
      filter = 'semdisp';
      render();
      toast('Mostrando as peças sem DISP. Abra o DISP e informe o número.');
    }
  });

  $('x-yes').addEventListener('click', function () {
    showStep(2);
    setTimeout(function () {
      $('x-confirm').focus();
    }, 0);
  });

  $('x-back').addEventListener('click', function () {
    closeOv($('ov-exit'));
  });

  $('x-confirm').addEventListener('click', function () {
    exited = true;
    $('ov-exit').hidden = true;
    $('app').hidden = true;
    $('closed').hidden = false;
  });

  $('btn-reopen').addEventListener('click', function () {
    exited = false;
    $('closed').hidden = true;
    $('app').hidden = false;
    render();
  });

  window.addEventListener('beforeunload', function (e) {
    if (exited) return;
    if (items.some(function (i) { return !i.disp; }) || overdueRows().length) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    ['ov-exit', 'ov-edit', 'ov-alert'].some(function (id) {
      var el = $(id);
      if (!el.hidden) {
        closeOv(el);
        return true;
      }
      return false;
    });
  });

  /* Virada de dia com a página aberta */
  setInterval(function () {
    var t = isoToday();
    if (t !== today) {
      today = t;
      render();
      if (!alertShown && overdueRows().length) {
        alertShown = true;
        openAlert();
      }
    }
  }, 60000);

  /* ==========================================================================
     Alternador de Modo Dia / Noite
     ========================================================================== */

  function updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var label = $('theme-label');
    if (label) {
      label.textContent = theme === 'light' ? 'Modo Noite' : 'Modo Dia';
    }
    var btn = $('theme-toggle');
    if (btn) {
      btn.setAttribute('title', theme === 'light' ? 'Ativar Modo Noite' : 'Ativar Modo Dia');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    updateThemeUI(next);
    toast(next === 'light' ? 'Modo Dia ativado.' : 'Modo Noite ativado.');
  }

  var initialTheme = localStorage.getItem('theme') || 'dark';
  updateThemeUI(initialTheme);

  var themeToggleBtn = $('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Inicialização
  render();
  init();
})();
