"use strict";
/* =====================================================================
   Calendario y tareas
   ===================================================================== */
S.ui.calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
S.ui.calSel = todayKey();
S.ui.taskFilter = "pendientes";
const PRIO = { 1: "Alta", 2: "Normal", 3: "Baja" };
const RECUR = [["none", "No se repite"], ["daily", "Cada día"], ["weekly", "Cada semana"], ["monthly", "Cada mes"], ["yearly", "Cada año"]];
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

/* ---------- Categorías ---------- */
S.ui.calFilter = [];
const DEFAULT_CATS = [["Trabajo", "azul"], ["Cumpleaños", "ciruela"], ["Festivo", "coral"], ["Viaje", "ambar"]];
const catsSorted = () => [...S.d.event_categories].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
const festivoCat = () => S.d.event_categories.find(c => c.name.toLowerCase() === "festivo");
let seedingCats = false;
document.addEventListener("hub:loaded", async () => {
  if (seedingCats || S.needsMigration || S.d.event_categories.length || localStorage.getItem("mihub-cats-seeded-" + S.user?.id)) return;
  seedingCats = true;
  try { await insertMany("event_categories", DEFAULT_CATS.map(([name, color], i) => ({ name, color, position: i }))); localStorage.setItem("mihub-cats-seeded-" + S.user?.id, "1"); render(); }
  catch (_) {} finally { seedingCats = false; }
});

/* ---------- Festivos (se calculan, no hace falta apuntarlos) ---------- */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const HOL_CACHE = {};
function holidaysOf(y) {
  const region = profile()?.holiday_region || "", key = y + region;
  if (HOL_CACHE[key]) return HOL_CACHE[key];
  const e = easter(y), out = {};
  const add = (d, t) => out[keyOf(d)] = t;
  add(new Date(y, 0, 1), "Año Nuevo"); add(new Date(y, 0, 6), "Reyes"); add(addDays(e, -2), "Viernes Santo");
  add(new Date(y, 4, 1), "Día del Trabajo"); add(new Date(y, 7, 15), "Asunción de la Virgen"); add(new Date(y, 9, 12), "Fiesta Nacional de España");
  add(new Date(y, 10, 1), "Todos los Santos"); add(new Date(y, 11, 6), "Día de la Constitución"); add(new Date(y, 11, 8), "Inmaculada Concepción");
  add(new Date(y, 11, 25), "Navidad");
  if (region === "cataluna") { add(addDays(e, 1), "Lunes de Pascua"); add(new Date(y, 5, 24), "Sant Joan"); add(new Date(y, 8, 11), "Diada de Catalunya"); add(new Date(y, 11, 26), "Sant Esteve"); }
  return HOL_CACHE[key] = out;
}
function holidayOn(k) {
  if (profile()?.show_holidays === false) return null;
  const t = holidaysOf(+k.slice(0, 4))[k]; if (!t) return null;
  const d = fromKey(k);
  return { id: "hol-" + k, holiday: true, title: t, all_day: true, start_at: startOfDay(d).toISOString(), end_at: endOfDay(d).toISOString(), color: festivoCat()?.color || "coral", recur: "none", category_id: festivoCat()?.id || "festivo" };
}

/* ---------- Consultas ---------- */
function occursOn(e, k) {
  const d = fromKey(k), a = startOfDay(d).getTime(), b = endOfDay(d).getTime();
  const s = new Date(e.start_at);
  if (!e.recur || e.recur === "none") return s.getTime() <= b && new Date(e.end_at).getTime() >= a;
  if (startOfDay(s).getTime() > a) return false;
  if (e.recur_until && k > e.recur_until) return false;
  switch (e.recur) {
    case "daily": return true;
    case "weekly": return s.getDay() === d.getDay();
    case "monthly": return s.getDate() === d.getDate();
    case "yearly": return s.getDate() === d.getDate() && s.getMonth() === d.getMonth();
  }
  return false;
}
function eventsOn(k, filtered = false) {
  const hol = holidayOn(k), f = S.ui.calFilter;
  let list = S.d.events.filter(e => occursOn(e, k));
  if (hol) list.push(hol);
  if (filtered && f.length) list = list.filter(e => f.includes(e.category_id || "none") || (e.holiday && f.includes(festivoCat()?.id)));
  return list
    .sort((x, y) => (y.all_day - x.all_day) || timeOf(new Date(x.start_at)).localeCompare(timeOf(new Date(y.start_at))));
}
const isRecur = e => e.recur && e.recur !== "none";
function eventTimeLabel(e, k) {
  if (e.all_day) return "Todo el día";
  const s = new Date(e.start_at), en = new Date(e.end_at);
  if (isRecur(e) || keyOf(s) === k) return timeOf(s);
  if (keyOf(en) === k) return "→ " + timeOf(en);
  return "Todo el día";
}
const pendingTasks = () => S.d.tasks.filter(t => !t.done);
const sortTasks = arr => arr.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999") || a.priority - b.priority || a.created_at.localeCompare(b.created_at));
const tasksForToday = () => sortTasks(pendingTasks().filter(t => t.due_date && t.due_date <= todayKey()));

/* ---------- Filas ---------- */
function eventRow(e, k) {
  const showEnd = !e.all_day && (isRecur(e) || keyOf(new Date(e.start_at)) === k);
  const cat = e.holiday ? (festivoCat()?.name || "Festivo") : e.category_id ? byId("event_categories", e.category_id)?.name : "";
  const meta = [cat, e.location, showEnd ? "hasta " + timeOf(new Date(e.end_at)) : "", isRecur(e) && e.recur !== "yearly" ? RECUR.find(r => r[0] === e.recur)[1].toLowerCase() : ""].filter(Boolean).join(", ");
  return `<button class="row" ${e.holiday ? `data-act="holidayInfo" data-t="${esc(e.title)}"` : `data-act="editEvent" data-id="${e.id}"`}>
    <span class="time">${esc(eventTimeLabel(e, k))}</span>
    <span class="bar" style="background:${colorVar(e.color)}"></span>
    <span class="body"><span class="title">${esc(e.title)}</span>${meta ? `<span class="meta">${esc(meta)}</span>` : ""}</span>
  </button>`;
}
function taskRow(t) {
  const late = !t.done && t.due_date && t.due_date < todayKey();
  const meta = [t.due_date ? niceDate(t.due_date) : "", t.list].filter(Boolean).join(", ");
  return `<div class="task ${t.done ? "done" : ""}">
    <button class="check ${t.priority === 1 ? "p1" : ""}" data-act="toggleTask" data-id="${t.id}" aria-label="${t.done ? "Marcar como pendiente" : "Marcar como hecha"}: ${esc(t.title)}">${ICON_CHECK}</button>
    <button class="open" data-act="editTask" data-id="${t.id}">
      <span class="title">${esc(t.title)}${t.priority === 1 && !t.done ? `<span class="flag">Alta</span>` : ""}</span>
      ${meta ? `<span class="meta ${late ? "late" : ""}">${esc(meta)}</span>` : ""}
    </button>
  </div>`;
}

/* ---------- Calendario ---------- */
MOD.calendario = {
  render() {
    const m = S.ui.calMonth, first = new Date(m.getFullYear(), m.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7)), t0 = todayKey();
    let cells = "";
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i), k = keyOf(d);
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const evs = eventsOn(k, true).slice(0, 3);
      const cls = ["day", d.getMonth() !== m.getMonth() ? "out" : "", k === t0 ? "today" : "", k === S.ui.calSel ? "sel" : ""].join(" ");
      cells += `<button class="${cls}" data-act="calDay" data-day="${k}" aria-label="${esc(fmt(d, { weekday: "long", day: "numeric", month: "long" }))}${evs.length ? `, ${evs.length} eventos` : ""}">
        <span class="n">${d.getDate()}</span><span class="dots">${evs.map(e => `<i style="background:${colorVar(e.color)}"></i>`).join("")}</span></button>`;
    }
    const sel = eventsOn(S.ui.calSel, true), f = S.ui.calFilter;
    const title = cap(fmt(m, { month: "long", year: m.getFullYear() === new Date().getFullYear() ? undefined : "numeric" }));
    return modHead("Calendario", ["inicio"], `<button class="btn-sm" data-act="manageCats">Categorías</button>`) + `
    <div class="cal-top">
      <h2 class="cal-month">${esc(title)}</h2>
      <div class="cal-nav">
        <button class="pill-btn" data-act="calNav" data-v="today">Hoy</button>
        <button class="icon-btn" data-act="calNav" data-v="-1" aria-label="Mes anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button class="icon-btn" data-act="calNav" data-v="1" aria-label="Mes siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>
      </div>
    </div>
    <div class="mfilter cal-filter">
      <button data-act="calFilter" data-v="" aria-pressed="${!f.length}">Todas</button>
      ${catsSorted().map(c => `<button data-act="calFilter" data-v="${c.id}" aria-pressed="${f.includes(c.id)}"><i style="background:${colorVar(c.color)}"></i>${esc(c.name)}</button>`).join("")}
      <button data-act="calFilter" data-v="none" aria-pressed="${f.includes("none")}">Sin categoría</button>
    </div>
    <div class="dow">${["L", "M", "X", "J", "V", "S", "D"].map(x => `<div>${x}</div>`).join("")}</div>
    <div class="grid">${cells}</div>
    <div class="sel-day">
      <h2>${esc(cap(fmt(fromKey(S.ui.calSel), { weekday: "long", day: "numeric", month: "long" })))}</h2>
      ${sel.length ? `<div class="list">${sel.map(e => eventRow(e, S.ui.calSel)).join("")}</div>`
        : `<div class="empty">${f.length ? "Nada de estas categorías este día." : `Día libre. <button data-act="newEvent">Añadir un evento</button>`}</div>`}
    </div>
    ${f.length ? upcomingFiltered() : ""}`;
  },
  fab: () => ({ label: "Añadir evento", fn: () => openEvent(null, S.ui.calSel) })
};
ACT.calDay = (el, d) => {
  S.ui.calSel = d.day; const dd = fromKey(d.day);
  if (dd.getMonth() !== S.ui.calMonth.getMonth()) S.ui.calMonth = new Date(dd.getFullYear(), dd.getMonth(), 1);
  render();
};
ACT.calNav = (el, d) => {
  if (d.v === "today") { const n = new Date(); S.ui.calMonth = new Date(n.getFullYear(), n.getMonth(), 1); S.ui.calSel = todayKey(); }
  else S.ui.calMonth = new Date(S.ui.calMonth.getFullYear(), S.ui.calMonth.getMonth() + Number(d.v), 1);
  render();
};
function upcomingFiltered() {
  const out = []; let d = startOfDay(new Date());
  for (let i = 0; i < 400 && out.length < 15; i++, d = addDays(d, 1)) { const k = keyOf(d); eventsOn(k, true).forEach(e => { if (out.length < 15 && (e.holiday || !isRecur(e) ? (keyOf(new Date(e.start_at)) === k || e.holiday) : true)) out.push([k, e]); }); }
  if (!out.length) return `<div class="block"><h2>Próximos</h2><div class="empty">No hay nada próximo de estas categorías.</div></div>`;
  return `<div class="block" style="margin-top:22px"><h2>Próximos</h2><div class="list">${out.map(([k, e]) => eventRow(e, k).replace(/<span class="time">([^<]*)<\/span>/, (m, l) => `<span class="time up-date"><b>${esc(fmt(fromKey(k), { day: "numeric", month: "short" }))}</b>${l === "Todo el día" ? "" : l}</span>`)).join("")}</div></div>`;
}
ACT.calFilter = (el, d) => {
  if (!d.v) S.ui.calFilter = [];
  else S.ui.calFilter = S.ui.calFilter.includes(d.v) ? S.ui.calFilter.filter(x => x !== d.v) : [...S.ui.calFilter, d.v];
  render();
};
ACT.holidayInfo = (el, d) => toast(`${d.t}: festivo${profile()?.holiday_region === "cataluna" ? "" : " nacional"}`);
ACT.manageCats = () => {
  const p = profile();
  openSheet(`${sheetHead("Categorías")}
    <div class="list">${catsSorted().map(c => `<button class="row" data-cat="${c.id}"><span class="bar" style="background:${colorVar(c.color)}"></span>
      <span class="body"><span class="title">${esc(c.name)}</span><span class="meta">${plural(S.d.events.filter(e => e.category_id === c.id).length, "evento", "eventos")}</span></span></button>`).join("")}</div>
    <button class="btn soft" id="catNew" style="margin-top:12px">Nueva categoría</button>
    <div class="form-sec" style="margin-top:20px">Festivos</div>
    <div class="switch"><label for="holOn">Mostrar los festivos nacionales</label><input type="checkbox" id="holOn" ${p?.show_holidays === false ? "" : "checked"}></div>
    <div class="switch"><label for="holCat">Añadir también los de Cataluña</label><input type="checkbox" id="holCat" ${p?.holiday_region === "cataluna" ? "checked" : ""}></div>
    <p class="hint">Los festivos se añaden solos cada año. Los locales de tu ciudad puedes apuntarlos como evento con la categoría Festivo.</p>`, root => {
    $$("[data-cat]", root).forEach(b => b.addEventListener("click", () => openCategory(byId("event_categories", b.dataset.cat))));
    $("#catNew", root).addEventListener("click", () => openCategory(null));
    const saveHol = async () => { try { await saveProfile({ show_holidays: $("#holOn", root).checked, holiday_region: $("#holCat", root).checked ? "cataluna" : null }); render(); } catch (x) { toast(errMsg(x), true); } };
    $("#holOn", root).addEventListener("change", saveHol); $("#holCat", root).addEventListener("change", saveHol);
  });
};
function openCategory(c) {
  let color = c?.color || COLORS[S.d.event_categories.length % COLORS.length];
  formSheet(c ? "Editar categoría" : "Nueva categoría", `${field("Nombre", inp("ctN", c?.name, 'maxlength="40" placeholder="Por ejemplo: Médico"'), "ctN")}${field("Color", colorChips(color))}`, {
    mount: root => { bindChips(root, x => color = x); if (!c) setTimeout(() => $("#ctN", root).focus(), 280); },
    onSubmit: async root => {
      const name = val(root, "ctN"); if (!name) return "Ponle un nombre.";
      if (S.d.event_categories.some(x => x.id !== c?.id && x.name.toLowerCase() === name.toLowerCase())) return "Ya tienes una categoría con ese nombre.";
      await save("event_categories", { name, color, position: c?.position ?? S.d.event_categories.length }, c?.id); toast("Categoría guardada");
    },
    onDelete: c ? async () => { await remove("event_categories", c.id); S.d.events.forEach(e => { if (e.category_id === c.id) e.category_id = null; }); S.ui.calFilter = S.ui.calFilter.filter(x => x !== c.id); saveCache(); } : null,
    deleteLabel: "Eliminar categoría (los eventos se quedan sin categoría)"
  });
}
ACT.newEvent = () => openEvent(null, S.route.mod === "calendario" ? S.ui.calSel : todayKey());
ACT.editEvent = (el, d) => openEvent(d.id);

function openEvent(id, dayKey) {
  const e = id ? byId("events", id) : null;
  let s, en;
  if (e) { s = new Date(e.start_at); en = new Date(e.end_at); }
  else {
    const base = dayKey ? fromKey(dayKey) : new Date(), now = new Date();
    s = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.min(now.getHours() + 1, 23), 0);
    en = new Date(s.getTime() + 3600e3);
  }
  let color = e?.color || "verde", catId = e?.category_id || (S.ui.calFilter.length === 1 && S.ui.calFilter[0] !== "none" ? S.ui.calFilter[0] : "");
  if (!e && catId) color = byId("event_categories", catId)?.color || color;
  formSheet(e ? "Editar evento" : "Nuevo evento", `
    ${field("Título", inp("evTitle", e?.title, 'maxlength="200"'), "evTitle")}
    <div class="field"><span class="lbl">Categoría</span><div class="cat-pills">
      <button type="button" data-ec="" aria-pressed="${!catId}">Ninguna</button>
      ${catsSorted().map(c => `<button type="button" data-ec="${c.id}" aria-pressed="${c.id === catId}"><i style="background:${colorVar(c.color)}"></i>${esc(c.name)}</button>`).join("")}</div></div>
    <div class="switch"><label for="evAll">Todo el día</label><input type="checkbox" id="evAll" ${e?.all_day ? "checked" : ""}></div>
    <div class="field"><span class="lbl">Empieza</span><div class="two">
      <input class="input" type="date" id="evSD" value="${keyOf(s)}" aria-label="Fecha de inicio">
      <input class="input t" type="time" id="evST" value="${timeOf(s)}" aria-label="Hora de inicio"></div></div>
    <div class="field"><span class="lbl">Termina</span><div class="two">
      <input class="input" type="date" id="evED" value="${keyOf(en)}" aria-label="Fecha de fin">
      <input class="input t" type="time" id="evET" value="${timeOf(en)}" aria-label="Hora de fin"></div></div>
    <div class="field"><span class="lbl">Repetir</span><div class="two">
      ${sel("evRec", RECUR, e?.recur || "none")}
      <input class="input" type="date" id="evUntil" value="${esc(e?.recur_until || "")}" aria-label="Repetir hasta"></div>
      <div class="hint" id="evUntilHint">La segunda fecha es hasta cuándo se repite (opcional).</div></div>
    ${field("Color", colorChips(color))}
    ${field("Ubicación", inp("evLoc", e?.location, 'maxlength="200"'), "evLoc")}
    ${field("Notas", area("evNotes", e?.notes), "evNotes")}`, {
    submit: "Guardar evento",
    mount: root => {
      bindChips(root, c => color = c);
      const all = $("#evAll", root), rec = $("#evRec", root);
      bindSeg(root, "[data-ec]", b => {
        catId = b.dataset.ec; const c = catId ? byId("event_categories", catId) : null;
        if (c) { color = c.color; $$("[data-chips] .chip", root).forEach(x => x.setAttribute("aria-pressed", x.dataset.color === color)); }
        if (!e && c && c.name.toLowerCase() === "cumpleaños") { all.checked = true; rec.value = "yearly"; sync(); }
      });
      const sync = () => {
        $$(".t", root).forEach(x => x.classList.toggle("hidden", all.checked));
        $("#evUntil", root).classList.toggle("hidden", rec.value === "none"); $("#evUntilHint", root).classList.toggle("hidden", rec.value === "none");
      };
      all.addEventListener("change", sync); rec.addEventListener("change", sync); sync();
      $("#evSD", root).addEventListener("change", ev => { if ($("#evED", root).value < ev.target.value) $("#evED", root).value = ev.target.value; });
      if (!e) setTimeout(() => $("#evTitle", root).focus(), 280);
    },
    onSubmit: async root => {
      const title = val(root, "evTitle"), allDay = $("#evAll", root).checked, sd = val(root, "evSD"), ed = val(root, "evED") || sd;
      if (!title) return "Ponle un título al evento.";
      if (!sd) return "Elige la fecha de inicio.";
      let start, end;
      if (allDay) { start = startOfDay(fromKey(sd)); end = endOfDay(fromKey(ed)); }
      else { const st = val(root, "evST") || "09:00", et = val(root, "evET") || st; start = new Date(`${sd}T${st}`); end = new Date(`${ed}T${et}`); }
      if (end < start) return "El final no puede ser anterior al inicio.";
      const recur = val(root, "evRec");
      const saved = await save("events", {
        title, all_day: allDay, start_at: start.toISOString(), end_at: end.toISOString(), color, category_id: catId || null,
        recur, recur_until: recur === "none" ? null : (val(root, "evUntil") || null),
        location: val(root, "evLoc") || null, notes: val(root, "evNotes") || null
      }, e?.id);
      S.ui.calSel = keyOf(new Date(saved.start_at));
      toast("Evento guardado");
    },
    onDelete: e ? () => remove("events", e.id) : null,
    deleteLabel: e && isRecur(e) ? "Eliminar evento (todas las repeticiones)" : "Eliminar evento"
  });
}

/* ---------- Tareas ---------- */
MOD.tareas = {
  render() {
    const isDone = S.ui.taskFilter === "hechas", t0 = todayKey();
    let body;
    if (isDone) {
      const done = S.d.tasks.filter(t => t.done).sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));
      body = done.length ? `<div class="list">${done.map(taskRow).join("")}</div>` : `<div class="empty">Aún no has completado ninguna tarea.</div>`;
    } else {
      const p = sortTasks(pendingTasks());
      const groups = [
        ["Vencidas", p.filter(t => t.due_date && t.due_date < t0), "late"],
        ["Hoy", p.filter(t => t.due_date === t0), ""],
        ["Próximas", p.filter(t => t.due_date && t.due_date > t0), ""],
        ["Sin fecha", p.filter(t => !t.due_date), ""]
      ].filter(g => g[1].length);
      body = groups.length ? groups.map(([h, l, c]) => `<div class="group-h ${c}">${h}</div><div class="list">${l.map(taskRow).join("")}</div>`).join("")
        : `<div class="empty">Todo al día. <button data-act="newTask">Añadir una tarea</button></div>`;
    }
    return modHead("Tareas") + `
    <div class="seg" role="group" aria-label="Filtro">
      <button data-act="taskFilter" data-v="pendientes" aria-pressed="${!isDone}">Pendientes</button>
      <button data-act="taskFilter" data-v="hechas" aria-pressed="${isDone}">Hechas</button>
    </div>${body}`;
  },
  fab: () => ({ label: "Añadir tarea", fn: () => openTask(null, "") })
};
ACT.taskFilter = (el, d) => { S.ui.taskFilter = d.v; render(); };
ACT.newTask = () => openTask(null, S.route.mod === "inicio" ? todayKey() : "");
ACT.editTask = (el, d) => openTask(d.id);
ACT.toggleTask = async (el, d) => {
  const t = byId("tasks", d.id); if (!t) return;
  const prev = { done: t.done, completed_at: t.completed_at };
  t.done = !t.done; t.completed_at = t.done ? new Date().toISOString() : null; render();
  try { await save("tasks", { done: t.done, completed_at: t.completed_at }, t.id); if (t.done) toast("Tarea hecha"); }
  catch (x) { Object.assign(t, prev); render(); toast(errMsg(x), true); }
};

function openTask(id, presetDate) {
  const t = id ? byId("tasks", id) : null;
  const lists = [...new Set(["Personal", "Trabajo", ...S.d.tasks.map(x => x.list)])];
  let prio = t?.priority || 2;
  formSheet(t ? "Editar tarea" : "Nueva tarea", `
    ${field("Tarea", inp("tkTitle", t?.title, 'maxlength="300"'), "tkTitle")}
    <div class="field"><label for="tkDate">Fecha límite</label><input class="input" type="date" id="tkDate" value="${esc(t ? t.due_date || "" : presetDate || "")}">
      <button type="button" class="link-btn" id="tkNoDate">Sin fecha</button></div>
    <div class="field"><span class="lbl">Prioridad</span><div class="segfull" role="group" aria-label="Prioridad">
      ${[1, 2, 3].map(p => `<button type="button" data-prio="${p}" aria-pressed="${p === prio}">${PRIO[p]}</button>`).join("")}</div></div>
    ${field("Lista", `<input class="input" id="tkList" list="tkLists" value="${esc(t?.list || "Personal")}" maxlength="60"><datalist id="tkLists">${lists.map(l => `<option value="${esc(l)}">`).join("")}</datalist>`, "tkList")}
    ${field("Notas", area("tkNotes", t?.notes), "tkNotes")}`, {
    submit: "Guardar tarea",
    mount: root => {
      $("#tkNoDate", root).addEventListener("click", () => $("#tkDate", root).value = "");
      bindSeg(root, "[data-prio]", b => prio = +b.dataset.prio);
      if (!t) setTimeout(() => $("#tkTitle", root).focus(), 280);
    },
    onSubmit: async root => {
      const title = val(root, "tkTitle");
      if (!title) return "Escribe la tarea.";
      await save("tasks", { title, priority: prio, due_date: val(root, "tkDate") || null, list: val(root, "tkList") || "Personal", notes: val(root, "tkNotes") || null }, t?.id);
      toast("Tarea guardada");
    },
    onDelete: t ? () => remove("tasks", t.id) : null, deleteLabel: "Eliminar tarea"
  });
}
