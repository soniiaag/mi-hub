"use strict";
/* =====================================================================
   Finanzas: cuentas y patrimonio, gastos, fijos, objetivos
   ===================================================================== */
const CATS = [["Supermercado", "🛒"], ["Restaurantes", "🍽️"], ["Ropa", "👗"], ["Skincare", "🧴"], ["Gasolina", "⛽"], ["Transporte", "🚆"],
  ["Ocio", "🎟️"], ["Viajes", "✈️"], ["Regalos", "🎁"], ["Salud", "💊"], ["Hogar", "🏠"], ["Suscripciones", "📱"], ["Otros", "📦"]];
const INCOME_CATS = [["Nómina", "💼"], ["Extra", "✨"], ["Otros ingresos", "💶"]];
const ACC_KINDS = [["banco", "Banco"], ["inversion", "Inversión"], ["ahorro", "Ahorro"], ["efectivo", "Efectivo"], ["otro", "Otro"]];
const catIcon = c => ([...CATS, ...INCOME_CATS].find(x => x[0] === c) || [null, "•"])[1];
S.ui.finMonth = monthKey(new Date());

/* ---------- Consultas ---------- */
const accountsSorted = () => S.d.fin_accounts.filter(a => !a.archived).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
function lastBalance(accId) {
  return S.d.fin_balances.filter(b => b.account_id === accId).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))[0] || null;
}
const balanceOf = a => { const b = lastBalance(a.id); return b ? Number(b.amount) : Number(a.initial_balance || 0); };
const netWorth = () => sum(accountsSorted(), balanceOf);
function netWorthSeries() {
  const accs = accountsSorted(), dates = [...new Set(S.d.fin_balances.map(b => b.date))].sort();
  return dates.map(dt => ({
    x: fromKey(dt).getTime(),
    y: sum(accs, a => { const b = S.d.fin_balances.filter(x => x.account_id === a.id && x.date <= dt).sort((p, q) => q.date.localeCompare(p.date) || q.created_at.localeCompare(p.created_at))[0]; return b ? Number(b.amount) : 0; })
  }));
}
const monthTx = mk => S.d.fin_transactions.filter(t => t.date.startsWith(mk));
const fixedActive = () => S.d.fin_recurring.filter(r => r.active).sort((a, b) => (a.day_of_month || 99) - (b.day_of_month || 99));
const fixedTotal = () => sum(fixedActive(), r => r.amount);
function catTotals(mk) {
  const out = {};
  monthTx(mk).filter(t => t.kind === "gasto").forEach(t => out[t.category || "Otros"] = (out[t.category || "Otros"] || 0) + Number(t.amount));
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}
const budgetOf = c => S.d.fin_budgets.find(b => b.category === c);
const monthLabel = mk => cap(fmt(fromKey(mk + "-01"), { month: "long", year: "numeric" }));
const shiftMonth = (mk, n) => { const d = fromKey(mk + "-01"); return monthKey(new Date(d.getFullYear(), d.getMonth() + n, 1)); };
function monthsLeft(dateKey) {
  if (!dateKey) return null;
  const now = new Date(), t = fromKey(dateKey);
  return Math.max(1, (t.getFullYear() - now.getFullYear()) * 12 + t.getMonth() - now.getMonth());
}

/* =====================================================================
   Vistas
   ===================================================================== */
const FIN_TABS = [["resumen", "Resumen"], ["gastos", "Gastos"], ["fijos", "Fijos"], ["cuentas", "Cuentas"], ["objetivos", "Objetivos"]];
MOD.finanzas = {
  render(r) {
    const sub = r.sub || "resumen";
    const body = { resumen: viewFinSummary, gastos: viewExpenses, fijos: viewFixed, cuentas: viewAccounts, objetivos: viewGoals }[sub] || viewFinSummary;
    return modHead("Finanzas") + subnav("finanzas", FIN_TABS, sub) + body();
  },
  fab(r) {
    const sub = r.sub || "resumen";
    if (sub === "fijos") return { label: "Añadir gasto fijo", fn: () => openFixed(null) };
    if (sub === "cuentas") return { label: "Nueva cuenta", fn: () => openAccount(null) };
    if (sub === "objetivos") return { label: "Nuevo objetivo", fn: () => openGoal(null) };
    return { label: "Añadir gasto", fn: () => openTx(null) };
  }
};

function viewFinSummary() {
  const mk = monthKey(new Date()), tx = monthTx(mk);
  const inc = sum(tx.filter(t => t.kind === "ingreso"), t => t.amount), varx = sum(tx.filter(t => t.kind === "gasto"), t => t.amount), fix = fixedTotal();
  const accs = accountsSorted(), nw = netWorth(), top = catTotals(mk).slice(0, 4), goals = S.d.fin_goals;
  let h = `<div class="nw"><span>Patrimonio</span><b>${eur(nw, 0)}</b></div>`;
  if (!accs.length) h += `<div class="empty">Añade tus cuentas para ver tu patrimonio. <button data-act="finQuickSetup">Configurar mis cuentas</button></div>`;
  else h += `<div class="list">${accs.map(a => { const v = balanceOf(a); return `<div class="acc-line"><span>${esc(a.name)}</span>${bar(nw > 0 ? v / nw * 100 : 0, "var(--c-azul)")}<b>${eur(v, 0)}</b></div>`; }).join("")}</div>`;
  const series = netWorthSeries();
  if (series.length >= 2) h += `<div class="block" style="margin-top:20px"><h2>Evolución del patrimonio</h2>${lineChart(series, { fy: v => eur(v, 0) })}</div>`;
  h += `<div class="block" style="margin-top:22px"><h2>${esc(monthLabel(mk))}</h2>
    <div class="money-grid">
      <div><span>Ingresos</span><b class="pos">${eur(inc)}</b></div>
      <div><span>Gastos variables</span><b>${eur(varx)}</b></div>
      <div><span>Gastos fijos</span><b>${eur(fix)}</b></div>
      <div><span>Te queda</span><b class="${inc - varx - fix >= 0 ? "pos" : "neg"}">${inc ? eur(inc - varx - fix) : "–"}</b></div>
    </div>
    ${inc ? "" : `<p class="hint">Apunta tu nómina como ingreso para ver cuánto ahorras cada mes.</p>`}
    ${top.length ? `<div class="cat-list" style="margin-top:14px">${top.map(([c, v]) => catLine(c, v)).join("")}</div>` : ""}
  </div>`;
  if (goals.length) h += `<div class="block"><h2>Objetivos <button data-go="finanzas/objetivos">Ver todos</button></h2>${goals.slice(0, 3).map(goalCard).join("")}</div>`;
  return h;
}
function catLine(c, v) {
  const b = budgetOf(c), pct = b ? v / b.monthly_limit * 100 : null;
  return `<button class="cat-line" data-act="editBudget" data-cat="${esc(c)}">
    <span class="ci">${catIcon(c)}</span>
    <span class="cbody"><span class="ctop"><span>${esc(c)}</span><b>${eur(v)}${b ? ` <small>de ${eur(b.monthly_limit, 0)}</small>` : ""}</b></span>
    ${b ? bar(pct, pct > 100 ? "var(--danger)" : pct > 85 ? "var(--c-ambar)" : "var(--primary)") : ""}</span></button>`;
}

function viewExpenses() {
  const mk = S.ui.finMonth, tx = monthTx(mk).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const gastos = tx.filter(t => t.kind === "gasto"), total = sum(gastos, t => t.amount), inc = sum(tx.filter(t => t.kind === "ingreso"), t => t.amount);
  const cats = catTotals(mk);
  const noSpend = CATS.map(c => c[0]).filter(c => budgetOf(c) && !cats.find(x => x[0] === c));
  let h = `<div class="month-nav"><button class="icon-btn" data-act="finMonth" data-v="-1" aria-label="Mes anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <b>${esc(monthLabel(mk))}</b><button class="icon-btn" data-act="finMonth" data-v="1" aria-label="Mes siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button></div>
    <div class="money-grid two"><div><span>Gastado</span><b>${eur(total)}</b></div><div><span>Ingresos</span><b class="pos">${eur(inc)}</b></div></div>`;
  h += `<div class="block" style="margin-top:20px"><h2>Por categoría</h2>${cats.length || noSpend.length ? `<div class="cat-list">${cats.map(([c, v]) => catLine(c, v)).join("")}${noSpend.map(c => catLine(c, 0)).join("")}</div>
    <p class="hint">Toca una categoría para ponerle un presupuesto mensual.</p>` : `<div class="empty">Aún no hay gastos este mes. <button data-act="newTx">Añadir un gasto</button></div>`}</div>`;
  if (tx.length) {
    let cur = "";
    h += `<div class="block"><h2>Movimientos</h2>`;
    tx.forEach(t => {
      if (t.date !== cur) { if (cur) h += `</div>`; cur = t.date; h += `<div class="group-h">${esc(niceDate(t.date))}</div><div class="list">`; }
      const acc = t.account_id ? byId("fin_accounts", t.account_id) : null;
      h += `<button class="row tx" data-act="editTx" data-id="${t.id}"><span class="ci">${catIcon(t.category)}</span>
        <span class="body"><span class="title">${esc(t.description || t.category || "Movimiento")}</span><span class="meta">${esc([t.description ? t.category : "", acc?.name].filter(Boolean).join(", "))}</span></span>
        <span class="amt ${t.kind === "ingreso" ? "pos" : ""}">${t.kind === "ingreso" ? "+" : "−"}${eur(t.amount)}</span></button>`;
    });
    h += `</div></div>`;
  }
  return h;
}

function viewFixed() {
  const list = [...S.d.fin_recurring].sort((a, b) => (b.active - a.active) || (a.day_of_month || 99) - (b.day_of_month || 99));
  return `<div class="nw small"><span>Gastos fijos al mes</span><b>${eur(fixedTotal())}</b></div>
    <p class="lead">Lo que pagas cada mes sí o sí: alquiler, gimnasio, pilates, móvil, suscripciones… Se suma automáticamente al resumen de cada mes.</p>
    ${list.length ? `<div class="list">${list.map(r => `<button class="row tx ${r.active ? "" : "off"}" data-act="editFixed" data-id="${r.id}"><span class="ci">${catIcon(r.category)}</span>
      <span class="body"><span class="title">${esc(r.name)}</span><span class="meta">${esc([r.category, r.day_of_month ? "día " + r.day_of_month : "", r.active ? "" : "en pausa"].filter(Boolean).join(", "))}</span></span>
      <span class="amt">${eur(r.amount)}</span></button>`).join("")}</div>` : `<div class="empty">Aún no tienes gastos fijos. <button data-act="newFixed">Añadir uno</button></div>`}`;
}

function viewAccounts() {
  const accs = accountsSorted();
  if (!accs.length) return `<div class="empty">Todavía no tienes cuentas. Puedes crear de golpe BBVA, MyInvestor, Trade Republic y Otras inversiones. <button data-act="finQuickSetup">Configurar mis cuentas</button></div>`;
  return `<div class="nw small"><span>Total</span><b>${eur(netWorth())}</b></div>
    <p class="lead">Actualiza el saldo cuando quieras (por ejemplo, a principio de mes). Así verás cómo evoluciona tu patrimonio.</p>
    <div class="list">${accs.map(a => { const lb = lastBalance(a.id); return `<button class="row" data-act="openAccountBalance" data-id="${a.id}">
      <span class="body"><span class="title">${esc(a.name)}</span><span class="meta">${esc((ACC_KINDS.find(k => k[0] === a.kind) || [0, a.kind])[1])}${lb ? ", actualizado " + esc(niceDate(lb.date).toLowerCase()) : ", sin saldo"}</span></span>
      <span class="amt">${eur(balanceOf(a))}</span></button>`; }).join("")}</div>`;
}

function goalCard(g) {
  const pct = g.saved_amount / g.target_amount * 100, left = Math.max(0, g.target_amount - g.saved_amount), ml = monthsLeft(g.target_date);
  return `<button class="goal" data-act="editGoal" data-id="${g.id}">
    <span class="g-top"><b>${esc(g.name)}</b><span>${fmtNum(Math.min(100, pct), 0)} %</span></span>
    ${bar(pct, colorVar(g.color))}
    <span class="g-meta">${eur(g.saved_amount, 0)} de ${eur(g.target_amount, 0)}${left > 0 && ml ? `. Para llegar el ${esc(fmt(fromKey(g.target_date), { month: "short", year: "numeric" }))}: ${eur(left / ml, 0)} al mes` : left <= 0 ? ". ¡Conseguido!" : ""}</span>
  </button>`;
}
function viewGoals() {
  const gs = [...S.d.fin_goals].sort((a, b) => (a.target_date || "9999").localeCompare(b.target_date || "9999"));
  return gs.length ? gs.map(g => goalCard(g) + `<div class="goal-actions"><button class="link-btn" data-act="goalAdd" data-id="${g.id}">Añadir aportación</button></div>`).join("")
    : `<div class="empty">Crea un objetivo de ahorro, como la entrada de la casa o un viaje, y sigue cuánto te falta. <button data-act="newGoal">Crear objetivo</button></div>`;
}

/* =====================================================================
   Acciones y formularios
   ===================================================================== */
ACT.finMonth = (el, d) => { S.ui.finMonth = shiftMonth(S.ui.finMonth, +d.v); render(); };
ACT.newTx = () => openTx(null);
ACT.editTx = (el, d) => openTx(byId("fin_transactions", d.id));
function openTx(t) {
  let kind = t?.kind === "ingreso" ? "ingreso" : "gasto", cat = t?.category || "";
  const accs = accountsSorted();
  const defDate = S.route.sub === "gastos" && S.ui.finMonth !== monthKey(new Date()) ? S.ui.finMonth + "-01" : todayKey();
  const catGrid = () => `${(kind === "gasto" ? CATS : INCOME_CATS).map(([c, i]) => `<button type="button" class="cat-chip" data-cat="${esc(c)}" aria-pressed="${c === cat}"><span>${i}</span>${esc(c)}</button>`).join("")}`;
  formSheet(t ? "Editar movimiento" : "Nuevo movimiento", `
    <div class="field"><div class="segfull two-only" role="group">
      <button type="button" data-k="gasto" aria-pressed="${kind === "gasto"}">Gasto</button><button type="button" data-k="ingreso" aria-pressed="${kind === "ingreso"}">Ingreso</button></div></div>
    <div class="field"><label for="txAmt">Importe (€)</label><input class="input big" id="txAmt" inputmode="decimal" autocomplete="off" value="${esc(t ? fmtIn(t.amount) : "")}" placeholder="0,00"></div>
    <div class="field"><span class="lbl">Categoría</span><div class="cat-grid" id="txCats">${catGrid()}</div>
      <input class="input" id="txCatOther" placeholder="O escribe otra categoría" value="${esc(cat && ![...CATS, ...INCOME_CATS].some(c => c[0] === cat) ? cat : "")}" style="margin-top:8px"></div>
    ${field("Fecha", `<input type="date" class="input" id="txDate" value="${esc(t?.date || defDate)}">`, "txDate")}
    ${field("Descripción", inp("txDesc", t?.description, 'placeholder="Opcional" maxlength="120"'), "txDesc")}
    ${accs.length ? field("Cuenta", sel("txAcc", [["", "Sin indicar"], ...accs.map(a => [a.id, a.name])], t?.account_id || ""), "txAcc") : ""}`, {
    mount: root => {
      const bindCats = () => bindSeg(root, ".cat-chip", b => { cat = b.dataset.cat; $("#txCatOther", root).value = ""; });
      bindCats();
      bindSeg(root, "[data-k]", b => { kind = b.dataset.k; cat = ""; $("#txCats", root).innerHTML = catGrid(); bindCats(); });
      $("#txCatOther", root).addEventListener("input", () => { if ($("#txCatOther", root).value) { cat = ""; $$(".cat-chip", root).forEach(x => x.setAttribute("aria-pressed", "false")); } });
      if (!t) setTimeout(() => $("#txAmt", root).focus(), 280);
    },
    onSubmit: async root => {
      const amount = num(val(root, "txAmt"));
      if (!amount || amount <= 0) return "Escribe un importe mayor que cero.";
      const category = val(root, "txCatOther") || cat || (kind === "gasto" ? "Otros" : "Otros ingresos");
      await save("fin_transactions", { kind, amount: Math.round(amount * 100) / 100, category, date: val(root, "txDate") || todayKey(),
        description: val(root, "txDesc") || null, account_id: accs.length ? (val(root, "txAcc") || null) : (t?.account_id || null) }, t?.id);
      toast(kind === "gasto" ? "Gasto guardado" : "Ingreso guardado");
    },
    onDelete: t ? () => remove("fin_transactions", t.id) : null
  });
}

ACT.editBudget = (el, d) => {
  const b = budgetOf(d.cat);
  formSheet(`Presupuesto: ${d.cat}`, `${field("Límite al mes (€)", numInp("bLim", b ? fmtIn(b.monthly_limit) : "", "Por ejemplo, 150"), "bLim")}
    <p class="hint">Verás una barra con lo que llevas gastado. Se pone ámbar al pasar del 85 % y roja si te pasas.</p>`, {
    submit: "Guardar presupuesto",
    onSubmit: async root => {
      const v = num(val(root, "bLim")); if (v === null || v < 0) return "Escribe un importe válido.";
      await save("fin_budgets", { category: d.cat, monthly_limit: v }, b?.id); toast("Presupuesto guardado");
    },
    onDelete: b ? () => remove("fin_budgets", b.id) : null, deleteLabel: "Quitar presupuesto"
  });
};

ACT.newFixed = () => openFixed(null);
ACT.editFixed = (el, d) => openFixed(byId("fin_recurring", d.id));
function openFixed(r) {
  formSheet(r ? "Editar gasto fijo" : "Nuevo gasto fijo", `
    ${field("Nombre", inp("fxName", r?.name, 'placeholder="Por ejemplo: Gimnasio" maxlength="80"'), "fxName")}
    <div class="two-eq">${field("Importe al mes (€)", numInp("fxAmt", r ? fmtIn(r.amount) : ""), "fxAmt")}${field("Día de cobro", numInp("fxDay", r?.day_of_month ?? "", "1-31"), "fxDay")}</div>
    ${field("Categoría", sel("fxCat", CATS.map(c => [c[0], c[1] + " " + c[0]]), r?.category || "Suscripciones"), "fxCat")}
    <div class="switch"><label for="fxOn">Activo</label><input type="checkbox" id="fxOn" ${r?.active === false ? "" : "checked"}></div>
    <p class="hint">Si lo pagas cada año o cada trimestre, pon aquí lo que sale al mes (por ejemplo, 120 € al año son 10 € al mes).</p>`, {
    onSubmit: async root => {
      const name = val(root, "fxName"), amount = num(val(root, "fxAmt")), day = num(val(root, "fxDay"));
      if (!name) return "Ponle un nombre."; if (amount === null || amount < 0) return "Escribe el importe.";
      if (day !== null && (day < 1 || day > 31)) return "El día tiene que estar entre 1 y 31.";
      await save("fin_recurring", { name, amount, day_of_month: day === null ? null : Math.round(day), category: val(root, "fxCat"), active: $("#fxOn", root).checked }, r?.id);
      toast("Gasto fijo guardado");
    },
    onDelete: r ? () => remove("fin_recurring", r.id) : null
  });
}

ACT.finQuickSetup = () => {
  const rows = [["BBVA", "banco"], ["MyInvestor", "inversion"], ["Trade Republic", "inversion"], ["Otras inversiones", "inversion"]];
  formSheet("Configurar mis cuentas", `<p class="lead">Escribe cuánto tienes ahora en cada una. Puedes cambiar nombres o dejar alguna en blanco y añadir más después.</p>
    ${rows.map(([n, k], i) => `<div class="two-eq">${field(i ? "" : "Cuenta", inp("qsN" + i, n), "qsN" + i)}${field(i ? "" : "Saldo actual (€)", numInp("qsA" + i, "", "0"), "qsA" + i)}</div><input type="hidden" id="qsK${i}" value="${k}">`).join("")}`, {
    submit: "Crear cuentas",
    onSubmit: async root => {
      const items = rows.map((_, i) => ({ name: val(root, "qsN" + i), kind: val(root, "qsK" + i), amount: num(val(root, "qsA" + i)), position: i })).filter(x => x.name);
      if (!items.length) return "Escribe al menos el nombre de una cuenta.";
      const accs = await insertMany("fin_accounts", items.map(({ name, kind, position }) => ({ name, kind, position })));
      const bal = accs.map(a => ({ a, it: items.find(x => x.name === a.name) })).filter(x => x.it?.amount !== null && x.it?.amount !== undefined)
        .map(({ a, it }) => ({ account_id: a.id, amount: it.amount, date: todayKey() }));
      await insertMany("fin_balances", bal); toast("Cuentas creadas");
    }
  });
};
function openAccount(a) {
  formSheet(a ? "Editar cuenta" : "Nueva cuenta", `
    ${field("Nombre", inp("acName", a?.name, 'maxlength="60"'), "acName")}
    ${field("Tipo", sel("acKind", ACC_KINDS, a?.kind || "banco"), "acKind")}
    ${a ? "" : field("Saldo actual (€)", numInp("acBal", "", "0"), "acBal")}`, {
    onSubmit: async root => {
      const name = val(root, "acName"); if (!name) return "Ponle un nombre a la cuenta.";
      const saved = await save("fin_accounts", { name, kind: val(root, "acKind"), position: a?.position ?? S.d.fin_accounts.length }, a?.id);
      if (!a) { const v = num(val(root, "acBal")); if (v !== null) await save("fin_balances", { account_id: saved.id, amount: v, date: todayKey() }); }
      toast("Cuenta guardada");
    },
    onDelete: a ? () => remove("fin_accounts", a.id) : null, deleteLabel: "Eliminar cuenta y su historial"
  });
}
ACT.openAccountBalance = (el, d) => {
  const a = byId("fin_accounts", d.id);
  const hist = S.d.fin_balances.filter(b => b.account_id === a.id).sort((x, y) => y.date.localeCompare(x.date) || y.created_at.localeCompare(x.created_at)).slice(0, 8);
  formSheet(a.name, `
    ${field("Saldo actual (€)", `<input class="input big" id="abAmt" inputmode="decimal" autocomplete="off" value="${esc(fmtIn(balanceOf(a)))}">`, "abAmt")}
    ${field("Fecha", `<input type="date" class="input" id="abDate" value="${todayKey()}">`, "abDate")}
    ${hist.length ? `<div class="mini-hist"><span class="lbl">Últimos saldos</span>${hist.map(b => `<div><span>${esc(niceDate(b.date))}</span><b>${eur(b.amount)}</b></div>`).join("")}</div>` : ""}
    <button type="button" class="link-btn" id="abEdit">Editar nombre o tipo de la cuenta</button>`, {
    submit: "Actualizar saldo",
    mount: root => $("#abEdit", root).addEventListener("click", () => openAccount(a)),
    onSubmit: async root => {
      const v = num(val(root, "abAmt")); if (v === null) return "Escribe el saldo.";
      await save("fin_balances", { account_id: a.id, amount: v, date: val(root, "abDate") || todayKey() }); toast("Saldo actualizado");
    }
  });
};

ACT.newGoal = () => openGoal(null);
ACT.editGoal = (el, d) => openGoal(byId("fin_goals", d.id));
function openGoal(g) {
  let color = g?.color || "verde";
  formSheet(g ? "Editar objetivo" : "Nuevo objetivo", `
    ${field("Nombre", inp("gName", g?.name, 'placeholder="Por ejemplo: Entrada de la casa" maxlength="80"'), "gName")}
    <div class="two-eq">${field("Objetivo (€)", numInp("gTarget", g ? fmtIn(g.target_amount) : ""), "gTarget")}${field("Ahorrado (€)", numInp("gSaved", g ? fmtIn(g.saved_amount) : "0"), "gSaved")}</div>
    ${field("Fecha objetivo (opcional)", `<input type="date" class="input" id="gDate" value="${esc(g?.target_date || "")}">`, "gDate")}
    ${field("Color", colorChips(color))}${field("Notas", area("gNotes", g?.notes), "gNotes")}`, {
    mount: root => bindChips(root, c => color = c),
    onSubmit: async root => {
      const name = val(root, "gName"), target = num(val(root, "gTarget")), saved = num(val(root, "gSaved")) || 0;
      if (!name) return "Ponle un nombre al objetivo."; if (!target || target <= 0) return "Escribe la cantidad objetivo.";
      await save("fin_goals", { name, target_amount: target, saved_amount: saved, target_date: val(root, "gDate") || null, color, notes: val(root, "gNotes") || null }, g?.id);
      toast("Objetivo guardado");
    },
    onDelete: g ? () => remove("fin_goals", g.id) : null
  });
}
ACT.goalAdd = (el, d) => {
  const g = byId("fin_goals", d.id);
  formSheet(`Aportar a ${g.name}`, `${field("Cantidad (€)", `<input class="input big" id="gaAmt" inputmode="decimal" autocomplete="off" placeholder="0,00">`, "gaAmt")}
    <p class="hint">Para restar, escribe la cantidad en negativo.</p>`, {
    submit: "Añadir",
    mount: root => setTimeout(() => $("#gaAmt", root).focus(), 280),
    onSubmit: async root => {
      const v = num(val(root, "gaAmt")); if (!v) return "Escribe una cantidad.";
      await save("fin_goals", { saved_amount: Math.max(0, Number(g.saved_amount) + v) }, g.id); toast("Aportación añadida");
    }
  });
};
