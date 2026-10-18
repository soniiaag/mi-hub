"use strict";
/* =====================================================================
   Inicio: resumen del día + módulos. Ajustes.
   ===================================================================== */
const MOD_ICONS = {
  calendario: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  tareas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/></svg>`,
  entreno: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>`,
  finanzas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 15h2"/></svg>`,
  dieta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4.4 0-7-3.4-7-7.5C5 9 8 7 10 7c1 0 1.5.4 2 .4S13 7 14 7c2 0 5 2 5 6.5 0 4.1-2.6 7.5-7 7.5z"/><path d="M12 7c0-2 1-3.5 3-4"/></svg>`,
  salud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 5.6a5 5 0 00-7.1 0L12 6.9l-1.3-1.3a5 5 0 00-7.1 7.1L12 21l8.4-8.3a5 5 0 000-7.1z"/></svg>`,
  datos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.8-1.8 2-2.6 3.5-2.6s2.7.8 3.5 2.6M15 10h3M15 14h3"/></svg>`,
  ajustes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>`
};

MOD.inicio = {
  render() {
    const now = new Date(), k = todayKey();
    const evs = eventsOn(k), nowHM = timeOf(now);
    const nextEv = evs.find(e => !e.all_day && eventTimeLabel(e, k) >= nowHM) || evs.find(e => e.all_day);
    const tToday = tasksForToday(), allPending = pendingTasks().length, late = tToday.filter(t => t.due_date < k).length;
    const fit = fitToday(), gym = fit.filter(p => p.kind === "gym"), pil = fit.filter(p => p.kind === "pilates");
    const gymTxt = gym.length ? gym.map(g => g.name).join(" + ") : "Descanso";
    const gymMus = gym.flatMap(g => g.routine ? musclesOfRoutine(g.routine.id) : []);
    const pilTxt = pil.length ? (pil[0].time ? hhmm(pil[0].time) : "Sí") : "Hoy no";

    return `
    <div class="home-top"><button class="icon-btn" data-go="ajustes" aria-label="Ajustes">${MOD_ICONS.ajustes}</button></div>
    <div class="today-head">
      <div class="weekday">${esc(cap(fmt(now, { weekday: "long" })))}</div>
      <div class="line"><span class="daynum">${now.getDate()}</span><span class="month">${esc(fmt(now, { month: "long" }))}</span></div>
    </div>

    <div class="tiles">
      <button class="tile" data-go="tareas">
        <span class="t-lbl">Tareas para hoy</span>
        <span class="t-val">${tToday.length}</span>
        <span class="t-sub ${late ? "late" : ""}">${late ? `${late} ${late === 1 ? "vencida" : "vencidas"}, ` : ""}${allPending} pendientes en total</span>
      </button>
      <button class="tile" data-go="calendario">
        <span class="t-lbl">Eventos hoy</span>
        <span class="t-val">${evs.length}</span>
        <span class="t-sub">${nextEv ? "Próximo: " + esc((nextEv.all_day ? "" : eventTimeLabel(nextEv, k) + " ") + nextEv.title) : evs.length ? "No queda nada más por hoy" : "Agenda libre"}</span>
      </button>
      <button class="tile wide-txt" data-go="entreno" style="--accent:${gym[0]?.routine ? colorVar(gym[0].routine.color) : "var(--line)"}">
        <span class="t-lbl">Gimnasio</span>
        <span class="t-val txt">${esc(gymTxt)}</span>
        <span class="t-sub">${gym.length && gym.every(g => g.done) ? "Hecho" : esc([...new Set(gymMus)].join(", ")) || (gym.length ? "Sin rutina asignada" : "Hoy toca recuperar")}</span>
      </button>
      <button class="tile wide-txt" data-go="entreno" style="--accent:${pil.length ? "var(--c-ciruela)" : "var(--line)"}">
        <span class="t-lbl">Pilates</span>
        <span class="t-val txt">${esc(pilTxt)}</span>
        <span class="t-sub">${pil.length ? (pil.every(p => p.done) ? "Hecho" : "Toca hoy") : "Sin clase"}</span>
      </button>
    </div>

    ${evs.length ? `<div class="block"><h2>Agenda de hoy <button data-act="newEvent">Añadir</button></h2><div class="list">${evs.map(e => eventRow(e, k)).join("")}</div></div>` : ""}
    ${tToday.length ? `<div class="block"><h2>Tareas para hoy <button data-act="newTask">Añadir</button></h2><div class="list">${tToday.map(taskRow).join("")}</div></div>` : ""}

    <div class="block"><h2>Módulos</h2>
      <div class="mods">
        ${modTile("calendario", "Calendario")}${modTile("tareas", "Tareas")}${modTile("entreno", "Entreno")}${modTile("finanzas", "Finanzas")}
        ${modTile("dieta", "Dieta", true)}${modTile("salud", "Salud", true)}${modTile("datos", "Datos personales", true)}${modTile("ajustes", "Ajustes")}
      </div>
    </div>`;
  },
  fab: () => null
};
function modTile(id, name, soon) {
  return soon ? `<div class="mod soon" aria-disabled="true">${MOD_ICONS[id]}<span>${esc(name)}</span><small>Próximamente</small></div>`
    : `<button class="mod" data-go="${id}">${MOD_ICONS[id]}<span>${esc(name)}</span></button>`;
}

/* ---------- Ajustes ---------- */
MOD.ajustes = {
  render() {
    const c = readCache();
    const syncTxt = c?.at ? "Última sincronización: " + fmt(new Date(c.at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    return modHead("Ajustes") + `
    <div class="block"><h2>Tus datos</h2><div class="settings">
      <button class="item" data-act="export">Exportar copia de seguridad <small>JSON</small></button>
      <button class="item" data-act="sync">Sincronizar ahora</button>
    </div></div>
    <div class="block"><h2>Cuenta</h2><div class="settings">
      <div class="item">Sesión iniciada <small>${esc(S.user?.email || "")}</small></div>
      <button class="item danger" data-act="logout">Cerrar sesión</button>
    </div></div>
    <p class="foot">${esc(syncTxt)}<br>Mi Hub, ${APP_VERSION}. Tus datos se guardan en tu base de datos de Supabase y solo tú puedes verlos con tu cuenta.</p>`;
  },
  fab: () => null
};
ACT.sync = () => loadAll().then(() => { if (S.loaded) toast("Sincronizado"); });
ACT.logout = () => { if (confirm("¿Cerrar sesión en este dispositivo?")) db.auth.signOut(); };
ACT.export = async () => {
  toast("Preparando copia…");
  const out = { app: "Mi Hub", version: APP_VERSION, exported_at: new Date().toISOString(), tables: {} };
  try { for (const t of TABLES) out.tables[t] = await fetchAll(t); }
  catch (x) { toast(errMsg(x), true); return; }
  const name = `mihub-copia-${todayKey()}.json`;
  const file = new File([JSON.stringify(out, null, 2)], name, { type: "application/json" });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } }
  catch (x) { if (x.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
