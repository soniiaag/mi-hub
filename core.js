"use strict";
/* =====================================================================
   Mi Hub · núcleo (utilidades, datos, navegación, formularios)
   ===================================================================== */
const APP_VERSION = "Fase 4";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const timeOf = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const todayKey = () => keyOf(new Date());
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const wd1 = d => (d.getDay() + 6) % 7 + 1;                       // 1 lunes … 7 domingo
const weekStart = d => startOfDay(addDays(d, -(wd1(d) - 1)));
const fmt = (d, o) => new Intl.DateTimeFormat("es-ES", o).format(d);
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const num = v => {
  if (v === null || v === undefined || v === "") return null;
  let t = String(v).replace(/[\s€]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  const n = parseFloat(t); return Number.isFinite(n) ? n : null;
};
const fmtIn = n => n === null || n === undefined || n === "" ? "" : String(Math.round(Number(n) * 100) / 100).replace(".", ",");
const fmtNum = (n, d = 1) => n === null || n === undefined ? "" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: d, useGrouping: "always" }).format(n);
const plural = (n, one, many) => `${fmtNum(n, 0)} ${n === 1 ? one : many}`;
const eur = (n, dec) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: dec ?? (Math.abs(n) % 1 ? 2 : 0), maximumFractionDigits: dec ?? 2, useGrouping: "always" }).format(n || 0);
const COLORS = ["verde", "azul", "ambar", "ciruela", "coral"];
const colorVar = c => `var(--c-${COLORS.includes(c) ? c : "verde"})`;
const sum = (a, f = x => x) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);

function niceDate(k) {
  if (k === todayKey()) return "Hoy";
  if (k === keyOf(addDays(new Date(), 1))) return "Mañana";
  if (k === keyOf(addDays(new Date(), -1))) return "Ayer";
  const d = fromKey(k);
  return fmt(d, d.getFullYear() === new Date().getFullYear() ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

let toastTimer;
function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg; t.classList.toggle("bad", bad); t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), bad ? 4500 : 2200);
}
function errMsg(e) {
  if (!navigator.onLine) return "No hay conexión. No se ha guardado; inténtalo cuando vuelvas a tener internet.";
  const m = (e && (e.message || e.error_description)) || "";
  if (/JWT|token/i.test(m)) return "La sesión ha caducado. Vuelve a entrar.";
  if (/fetch|network/i.test(m)) return "No se ha podido conectar con la base de datos. Revisa la conexión y vuelve a intentarlo.";
  if (/does not exist|Could not find the table|schema cache/i.test(m)) return "Falta actualizar la base de datos: ejecuta el último script schema-fase en Supabase.";
  return "No se ha guardado: " + (m || "error desconocido");
}

/* =====================================================================
   Supabase y estado
   ===================================================================== */
const CFG = window.HUB_CONFIG || {};
const configured = CFG.SUPABASE_URL && /^https:\/\//.test(CFG.SUPABASE_URL) && CFG.SUPABASE_ANON_KEY && !/PEGA_AQUI/.test(CFG.SUPABASE_ANON_KEY);
const db = configured ? supabase.createClient(CFG.SUPABASE_URL.replace(/\/(rest\/v1\/?)?$/, ""), CFG.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "mihub-auth" }
}) : null;

const TABLES = ["events", "tasks",
  "fit_exercises", "fit_routines", "fit_routine_exercises", "fit_schedule", "fit_sessions", "fit_sets",
  "fin_accounts", "fin_balances", "fin_transactions", "fin_recurring", "fin_budgets", "fin_goals",
  "user_profile", "body_measurements", "foods", "meal_entries", "diet_template", "personal_items", "event_categories",
  "diet_days", "supplements", "supplement_logs"];

const S = { user: null, d: {}, loaded: false, needsMigration: false, route: { mod: "inicio" }, ui: {} };
TABLES.forEach(t => S.d[t] = []);

const CACHE_KEY = "mihub-cache-v4";
function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ uid: S.user?.id, d: S.d, at: Date.now() })); } catch (_) {}
}
function readCache() {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return c && c.uid === S.user?.id ? c : null; } catch (_) { return null; }
}

async function fetchAll(t) {
  let out = [], from = 0;
  for (;;) {
    const { data, error } = await db.from(t).select("*").order("created_at").range(from, from + 999);
    if (error) throw error;
    out = out.concat(data);
    if (data.length < 1000) return out;
    from += 1000;
  }
}

let loading = null;
async function loadAll() {
  if (loading) return loading;
  loading = (async () => {
    const c = readCache();
    if (c && !S.loaded) { TABLES.forEach(t => S.d[t] = c.d?.[t] || []); render(); }
    let missing = false, failed = null;
    const results = await Promise.all(TABLES.map(t => fetchAll(t).then(r => [t, r]).catch(e => {
      if (/does not exist|Could not find the table|schema cache/i.test(e.message || "")) missing = true; else failed = e;
      return [t, null];
    })));
    if (failed) { setOffline(true); if (!c) toast(errMsg(failed), true); return; }
    results.forEach(([t, r]) => { if (r) S.d[t] = r; });
    S.needsMigration = missing; S.loaded = true;
    saveCache(); setOffline(false); render();
    document.dispatchEvent(new Event("hub:loaded"));
  })();
  try { await loading; } finally { loading = null; }
}
function setOffline(on) { $("#offline").classList.toggle("hidden", !on); }

/* ---------- CRUD ---------- */
function upsertLocal(t, row) {
  const a = S.d[t], i = a.findIndex(x => x.id === row.id);
  if (i >= 0) a[i] = row; else a.push(row);
}
async function save(t, row, id) {
  const q = id ? db.from(t).update(row).eq("id", id) : db.from(t).insert(row);
  const { data, error } = await q.select().single();
  if (error) throw error;
  upsertLocal(t, data); saveCache(); return data;
}
async function insertMany(t, rows) {
  if (!rows.length) return [];
  const { data, error } = await db.from(t).insert(rows).select();
  if (error) throw error;
  data.forEach(r => upsertLocal(t, r)); saveCache(); return data;
}
const CASCADE = {
  fit_sessions: [["fit_sets", "session_id"]],
  fit_routines: [["fit_routine_exercises", "routine_id"]],
  fit_exercises: [["fit_routine_exercises", "exercise_id"]],
  fin_accounts: [["fin_balances", "account_id"]],
  foods: [["meal_entries", "food_id"], ["diet_template", "food_id"]]
};
async function remove(t, id) {
  const { error } = await db.from(t).delete().eq("id", id);
  if (error) throw error;
  S.d[t] = S.d[t].filter(x => x.id !== id);
  (CASCADE[t] || []).forEach(([ct, col]) => S.d[ct] = S.d[ct].filter(x => x[col] !== id));
  saveCache();
}
async function removeIds(t, ids) {
  if (!ids.length) return;
  const { error } = await db.from(t).delete().in("id", ids);
  if (error) throw error;
  S.d[t] = S.d[t].filter(x => !ids.includes(x.id)); saveCache();
}
const byId = (t, id) => S.d[t].find(x => x.id === id);

/* =====================================================================
   Navegación
   ===================================================================== */
const MOD = {};   // cada módulo registra { render(route), fab(route) }
const ACT = {};   // acciones de botones: data-act="nombre"
const CH = {};    // cambios en campos: data-ch="nombre"

function go(mod, sub, id, push = true) {
  S.route = { mod, sub: sub || null, id: id || null };
  if (push) try { history.pushState(S.route, ""); } catch (_) {}
  closeSheet(); render(); window.scrollTo(0, 0);
}
window.addEventListener("popstate", e => { S.route = e.state || { mod: "inicio" }; closeSheet(); render(); });

function render() {
  if (!S.user) return;
  const m = MOD[S.route.mod] || MOD.inicio;
  $("#view").innerHTML = (S.needsMigration ? `<div class="banner warn">Falta actualizar la base de datos. Ejecuta en Supabase los scripts de actualización que te faltan (<b>schema-fase2.sql</b> y/o <b>schema-fase3.sql</b>) y vuelve a abrir la app.</div>` : "") + m.render(S.route);
  const tabs = m.tabs ? (typeof m.tabs === "function" ? m.tabs(S.route) : m.tabs) : null, tb = $("#tabbar");
  if (tabs) {
    const cur = m.tabOf ? m.tabOf(S.route) : (S.route.sub || tabs[0][0]);
    tb.innerHTML = `<nav style="grid-template-columns:repeat(${tabs.length},1fr)">${tabs.map(([k, l, ic]) =>
      `<button data-go="${S.route.mod}/${k}" aria-current="${k === cur ? "page" : "false"}">${TAB_ICONS[ic] || TAB_ICONS.dot}<span>${esc(l)}</span></button>`).join("")}</nav>`;
  }
  tb.classList.toggle("hidden", !tabs); document.body.classList.toggle("has-tabs", !!tabs);
  const f = m.fab ? m.fab(S.route) : null;
  const fab = $("#fab");
  fab.classList.toggle("hidden", !f);
  S.ui.fab = f;
  if (f) fab.setAttribute("aria-label", f.label);
  m.after && m.after(S.route);
}

/* Iconos de la barra inferior de cada módulo */
const _i = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TAB_ICONS = {
  dot: _i('<circle cx="12" cy="12" r="3"/>'),
  hoy: _i('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  semana: _i('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2"/>'),
  mes: _i('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  agenda: _i('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
  lista: _i('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>'),
  hecho: _i('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
  rutinas: _i('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  cuerpo: _i('<circle cx="12" cy="4.5" r="2"/><path d="M6 8.5l6 1 6-1M12 9.5V15M12 15l-3 6M12 15l3 6M7.5 9l-1 5M16.5 9l1 5"/>'),
  progreso: _i('<path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/>'),
  historial: _i('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  resumen: _i('<path d="M12 3v9l7 4"/><circle cx="12" cy="12" r="9"/>'),
  gastos: _i('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  fijos: _i('<path d="M4 12a8 8 0 0114-5.3L20 9M20 12a8 8 0 01-14 5.3L4 15"/><path d="M20 4v5h-5M4 20v-5h5"/>'),
  cuentas: _i('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 15h2"/>'),
  objetivos: _i('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  plan: _i('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>'),
  compra: _i('<path d="M3 4h2l2.4 11.2a2 2 0 002 1.8h7.7a2 2 0 002-1.6L21 8H6"/><circle cx="10" cy="20.5" r="1"/><circle cx="17" cy="20.5" r="1"/>'),
  mas: _i('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  medidas: _i('<path d="M4 20L20 4M7 17l2 2M10 14l2 2M13 11l2 2M16 8l2 2"/>')
};

/* Cabecera de módulo con botón para volver */
function modHead(title, back = ["inicio"], right = "") {
  const label = back[0] === "inicio" && !back[1] ? "Inicio" : (back[2] || "Atrás");
  return `<header class="mod-head">
    <button class="back" data-go="${esc(back.slice(0, 2).filter(Boolean).join("/"))}" aria-label="Volver a ${esc(label)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>${esc(label)}</button>
    ${right ? `<div class="mh-right">${right}</div>` : ""}
  </header><h1 class="view-title">${esc(title)}</h1>`;
}
function subnav(mod, items, current) {
  return `<div class="subnav" role="tablist">${items.map(([k, l]) =>
    `<button role="tab" data-go="${mod}/${k}" aria-selected="${k === current}">${esc(l)}</button>`).join("")}</div>`;
}

/* =====================================================================
   Hoja inferior (formularios)
   ===================================================================== */
let sheetOpen = false;
function openSheet(html, mount) {
  $("#sheetInner").innerHTML = html;
  $("#scrim").classList.remove("hidden"); $("#sheet").classList.remove("hidden");
  requestAnimationFrame(() => requestAnimationFrame(() => { $("#scrim").classList.add("on"); $("#sheet").classList.add("on"); }));
  sheetOpen = true; $("#sheet").scrollTop = 0;
  mount && mount($("#sheetInner"));
}
function closeSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  $("#scrim").classList.remove("on"); $("#sheet").classList.remove("on");
  setTimeout(() => { if (!sheetOpen) { $("#scrim").classList.add("hidden"); $("#sheet").classList.add("hidden"); $("#sheetInner").innerHTML = ""; } }, 260);
}
function sheetHead(title) {
  return `<div class="sheet-head"><h3>${esc(title)}</h3><button type="button" data-close>Cancelar</button></div>`;
}
/* Formulario genérico en hoja: onSubmit(root) devuelve mensaje de error o nada */
function formSheet(title, fields, { submit = "Guardar", onSubmit, onDelete, deleteLabel = "Eliminar", mount } = {}) {
  openSheet(`<form novalidate>${sheetHead(title)}${fields}
    <div class="err" role="alert"></div>
    <button class="btn primary" type="submit">${esc(submit)}</button>
    ${onDelete ? `<button class="btn ghost" type="button" data-del>${esc(deleteLabel)}</button>` : ""}</form>`, root => {
    const form = $("form", root), err = $(".err", root), btn = $("button[type=submit]", root);
    mount && mount(root);
    form.addEventListener("submit", async e => {
      e.preventDefault(); err.textContent = ""; btn.disabled = true; const old = btn.textContent; btn.textContent = "Guardando…";
      try { const m = await onSubmit(root); if (m) { err.textContent = m; btn.disabled = false; btn.textContent = old; return; } closeSheet(); render(); }
      catch (x) { err.textContent = errMsg(x); btn.disabled = false; btn.textContent = old; }
    });
    onDelete && $("[data-del]", root).addEventListener("click", async () => {
      if (!confirm("¿Seguro que quieres eliminarlo?")) return;
      try { await onDelete(); closeSheet(); render(); toast("Eliminado"); } catch (x) { err.textContent = errMsg(x); }
    });
  });
}
const field = (label, input, id) => `<div class="field">${label ? `<label${id ? ` for="${id}"` : ""}>${esc(label)}</label>` : ""}${input}</div>`;
const inp = (id, val = "", attrs = "") => `<input class="input" id="${id}" value="${esc(val ?? "")}" ${attrs}>`;
const numInp = (id, val, ph = "") => `<input class="input" id="${id}" inputmode="decimal" autocomplete="off" value="${esc(val ?? "")}" placeholder="${esc(ph)}">`;
const area = (id, val = "") => `<textarea class="input" id="${id}">${esc(val ?? "")}</textarea>`;
const sel = (id, opts, val) => `<select class="input" id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const val = (root, id) => $("#" + id, root).value.trim();
function colorChips(current) {
  return `<div class="chips" data-chips>${COLORS.map(c => `<button type="button" class="chip" data-color="${c}" aria-label="${c}" aria-pressed="${c === current}" style="background:${colorVar(c)}"></button>`).join("")}</div>`;
}
function bindChips(root, cb) {
  $$("[data-chips] .chip", root).forEach(b => b.addEventListener("click", () => { $$("[data-chips] .chip", root).forEach(x => x.setAttribute("aria-pressed", x === b)); cb(b.dataset.color); }));
}
function bindSeg(root, sel, cb) {
  $$(sel, root).forEach(b => b.addEventListener("click", () => { $$(sel, root).forEach(x => x.setAttribute("aria-pressed", x === b)); cb(b); }));
}

/* =====================================================================
   Gráfico de línea (SVG)
   ===================================================================== */
function lineChart(points, { fy = v => fmtNum(v), h = 150 } = {}) {
  if (points.length < 2) return `<div class="chart-empty">Necesitas al menos dos registros para ver la evolución.</div>`;
  const W = 340, H = h, L = 8, R = 8, T = 18, B = 22;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  let minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const padY = (maxY - minY) * .12; minY -= padY; maxY += padY;
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = x => L + (x - x0) / ((x1 - x0) || 1) * (W - L - R), Y = y => T + (1 - (y - minY) / (maxY - minY)) * (H - T - B);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  const last = points[points.length - 1], first = points[0];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolución">
    <path d="${d}" fill="none" stroke="var(--primary)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3" fill="var(--primary)"/>`).join("")}
    <text x="${X(last.x)}" y="${Y(last.y) - 8}" text-anchor="end" class="ct">${esc(fy(last.y))}</text>
    <text x="${L}" y="${H - 5}" class="cx">${esc(fmt(new Date(first.x), { day: "numeric", month: "short" }))}</text>
    <text x="${W - R}" y="${H - 5}" text-anchor="end" class="cx">${esc(fmt(new Date(last.x), { day: "numeric", month: "short" }))}</text>
  </svg>`;
}
const bar = (pct, color = "var(--primary)") => `<div class="pbar"><i style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%;background:${color}"></i></div>`;

/* =====================================================================
   Eventos globales de la interfaz
   ===================================================================== */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-go],[data-act],[data-close]"); if (!el) return;
  const d = el.dataset;
  if ("close" in d) return closeSheet();
  if (d.go !== undefined) { const [m, s, i] = d.go.split("/"); return go(m || "inicio", s, i); }
  if (d.act && ACT[d.act]) { e.preventDefault(); ACT[d.act](el, d); }
});
document.addEventListener("change", e => { const el = e.target.closest("[data-ch]"); if (el && CH[el.dataset.ch]) CH[el.dataset.ch](el, el.dataset); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

/* Sin zoom: bloquea el pellizco y el doble toque en iOS */
["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
let lastTouch = 0;
document.addEventListener("touchend", e => { const n = Date.now(); if (n - lastTouch < 300 && !e.target.closest("input,textarea,select")) e.preventDefault(); lastTouch = n; }, { passive: false });

/* =====================================================================
   Sesión y arranque
   ===================================================================== */
function showScreen(id) { ["setup", "login", "main"].forEach(s => $("#" + s).classList.toggle("hidden", s !== id)); }

function onSession(session) {
  const prevId = S.user?.id;
  S.user = session?.user || null;
  if (!S.user) {
    TABLES.forEach(t => S.d[t] = []); S.loaded = false;
    try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
    showScreen("login"); return;
  }
  showScreen("main");
  if (prevId !== S.user.id) { S.loaded = false; render(); loadAll(); }
}

function boot() {
  $("#scrim").addEventListener("click", closeSheet);
  $("#fab").addEventListener("click", () => S.ui.fab && S.ui.fab.fn());
  $("#aiBtn").addEventListener("click", () => window.openAssistant && openAssistant());
  try { history.replaceState(S.route, ""); } catch (_) {}
  if (!configured) return showScreen("setup");

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("#lBtn"), err = $("#lErr"), email = $("#lEmail").value.trim(), password = $("#lPass").value;
    if (!email || !password) { err.textContent = "Escribe tu email y tu contraseña."; return; }
    err.textContent = ""; btn.disabled = true; btn.textContent = "Entrando…";
    const { error } = await db.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.textContent = "Entrar";
    if (error) err.textContent = !navigator.onLine ? "No hay conexión. Conéctate a internet para iniciar sesión."
      : /Invalid login/i.test(error.message) ? "Email o contraseña incorrectos."
      : "No se ha podido iniciar sesión: " + error.message;
  });

  db.auth.getSession().then(({ data }) => onSession(data.session));
  db.auth.onAuthStateChange((_ev, session) => setTimeout(() => onSession(session), 0));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.user) { render(); loadAll(); } });
  window.addEventListener("online", () => S.user && loadAll());
  window.addEventListener("offline", () => setOffline(true));
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
