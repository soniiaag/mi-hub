"use strict";
/* =====================================================================
   Entreno: plan semanal, rutinas, sesiones, progreso
   ===================================================================== */
const MUSCLES = ["Glúteo", "Cuádriceps", "Isquios", "Aductores", "Gemelos", "Pecho", "Espalda", "Hombro", "Bíceps", "Tríceps", "Core", "Cardio", "Otro"];
const KIND_LABEL = { gym: "Gimnasio", pilates: "Pilates", otro: "Otra actividad" };
/* Biblioteca: [nombre, grupo, músculos principales, músculos secundarios] */
const EX_LIB = [
  ["Hip thrust", "Glúteo", ["Glúteo mayor"], ["Isquiotibiales", "Glúteo medio"]],
  ["Hip thrust en máquina", "Glúteo", ["Glúteo mayor"], ["Isquiotibiales"]],
  ["Puente de glúteo", "Glúteo", ["Glúteo mayor"], ["Isquiotibiales"]],
  ["Patada de glúteo en polea", "Glúteo", ["Glúteo mayor"], ["Glúteo medio"]],
  ["Abducción en máquina", "Glúteo", ["Glúteo medio", "Abductores"], ["Glúteo mayor"]],
  ["Abducción en polea", "Glúteo", ["Glúteo medio"], ["Abductores"]],
  ["Paseo lateral con banda", "Glúteo", ["Glúteo medio"], ["Abductores"]],
  ["Sentadilla búlgara", "Glúteo", ["Cuádriceps", "Glúteo mayor"], ["Aductores", "Glúteo medio"]],
  ["Step-up", "Glúteo", ["Cuádriceps", "Glúteo mayor"], ["Glúteo medio"]],
  ["Hiperextensiones", "Glúteo", ["Erectores espinales", "Glúteo mayor"], ["Isquiotibiales"]],
  ["Sentadilla con barra", "Cuádriceps", ["Cuádriceps", "Glúteo mayor"], ["Aductores", "Erectores espinales"]],
  ["Sentadilla goblet", "Cuádriceps", ["Cuádriceps"], ["Glúteo mayor", "Aductores", "Recto abdominal"]],
  ["Sentadilla sumo", "Cuádriceps", ["Aductores", "Glúteo mayor"], ["Cuádriceps"]],
  ["Prensa de piernas", "Cuádriceps", ["Cuádriceps"], ["Glúteo mayor", "Aductores"]],
  ["Extensión de cuádriceps", "Cuádriceps", ["Cuádriceps"], []],
  ["Zancadas", "Cuádriceps", ["Cuádriceps", "Glúteo mayor"], ["Aductores", "Glúteo medio"]],
  ["Hack squat", "Cuádriceps", ["Cuádriceps"], ["Glúteo mayor"]],
  ["Peso muerto rumano", "Isquios", ["Isquiotibiales", "Glúteo mayor"], ["Erectores espinales", "Antebrazo"]],
  ["Curl femoral tumbado", "Isquios", ["Isquiotibiales"], ["Gemelos"]],
  ["Curl femoral sentado", "Isquios", ["Isquiotibiales"], []],
  ["Buenos días", "Isquios", ["Isquiotibiales", "Erectores espinales"], ["Glúteo mayor"]],
  ["Aducción en máquina", "Aductores", ["Aductores"], []],
  ["Elevación de talones de pie", "Gemelos", ["Gemelos"], ["Sóleo"]],
  ["Elevación de talones sentada", "Gemelos", ["Sóleo"], ["Gemelos"]],
  ["Press banca", "Pecho", ["Pectoral mayor"], ["Deltoides anterior", "Tríceps"]],
  ["Press inclinado con mancuernas", "Pecho", ["Pectoral superior"], ["Deltoides anterior", "Tríceps"]],
  ["Aperturas con mancuernas", "Pecho", ["Pectoral mayor"], ["Deltoides anterior"]],
  ["Cruce de poleas", "Pecho", ["Pectoral mayor"], ["Deltoides anterior"]],
  ["Flexiones", "Pecho", ["Pectoral mayor"], ["Tríceps", "Deltoides anterior", "Recto abdominal"]],
  ["Jalón al pecho", "Espalda", ["Dorsal ancho"], ["Bíceps", "Trapecio medio y romboides", "Deltoides posterior"]],
  ["Remo con barra", "Espalda", ["Dorsal ancho", "Trapecio medio y romboides"], ["Deltoides posterior", "Bíceps", "Erectores espinales"]],
  ["Remo con mancuerna", "Espalda", ["Dorsal ancho"], ["Trapecio medio y romboides", "Bíceps", "Deltoides posterior"]],
  ["Remo en polea baja", "Espalda", ["Trapecio medio y romboides", "Dorsal ancho"], ["Bíceps", "Deltoides posterior"]],
  ["Dominadas", "Espalda", ["Dorsal ancho"], ["Bíceps", "Braquial", "Trapecio medio y romboides"]],
  ["Dominadas asistidas", "Espalda", ["Dorsal ancho"], ["Bíceps", "Braquial", "Trapecio medio y romboides"]],
  ["Pullover en polea", "Espalda", ["Dorsal ancho"], ["Tríceps", "Pectoral mayor"]],
  ["Peso muerto", "Espalda", ["Isquiotibiales", "Glúteo mayor", "Erectores espinales"], ["Cuádriceps", "Trapecio superior", "Antebrazo"]],
  ["Encogimientos", "Espalda", ["Trapecio superior"], ["Antebrazo"]],
  ["Press militar", "Hombro", ["Deltoides anterior"], ["Deltoides lateral", "Tríceps", "Trapecio superior"]],
  ["Press de hombro con mancuernas", "Hombro", ["Deltoides anterior", "Deltoides lateral"], ["Tríceps"]],
  ["Elevaciones laterales", "Hombro", ["Deltoides lateral"], ["Trapecio superior"]],
  ["Elevaciones frontales", "Hombro", ["Deltoides anterior"], ["Pectoral superior"]],
  ["Pájaros", "Hombro", ["Deltoides posterior"], ["Trapecio medio y romboides"]],
  ["Face pull", "Hombro", ["Deltoides posterior", "Manguito rotador"], ["Trapecio medio y romboides"]],
  ["Curl con barra", "Bíceps", ["Bíceps"], ["Braquial", "Antebrazo"]],
  ["Curl con mancuernas", "Bíceps", ["Bíceps"], ["Braquial"]],
  ["Curl martillo", "Bíceps", ["Braquial", "Braquiorradial"], ["Bíceps"]],
  ["Curl en polea", "Bíceps", ["Bíceps"], ["Braquial"]],
  ["Curl predicador", "Bíceps", ["Bíceps"], ["Braquial"]],
  ["Extensión en polea con cuerda", "Tríceps", ["Tríceps"], []],
  ["Press francés", "Tríceps", ["Tríceps"], []],
  ["Extensión por encima de la cabeza", "Tríceps", ["Tríceps"], []],
  ["Fondos en banco", "Tríceps", ["Tríceps"], ["Pectoral mayor", "Deltoides anterior"]],
  ["Patada de tríceps", "Tríceps", ["Tríceps"], []],
  ["Plancha", "Core", ["Recto abdominal", "Transverso abdominal"], ["Oblicuos", "Erectores espinales"]],
  ["Crunch", "Core", ["Recto abdominal"], ["Oblicuos"]],
  ["Elevación de piernas", "Core", ["Recto abdominal"], ["Oblicuos"]],
  ["Rueda abdominal", "Core", ["Recto abdominal"], ["Dorsal ancho", "Oblicuos"]],
  ["Pallof press", "Core", ["Oblicuos", "Transverso abdominal"], []],
  ["Cinta", "Cardio", [], []], ["Bicicleta", "Cardio", [], []], ["Elíptica", "Cardio", [], []], ["Remo (máquina)", "Cardio", [], []], ["Escaladora", "Cardio", [], []]
];
/* Músculos concretos: grupo al que pertenecen y zona en el mapa del cuerpo */
const MUSCLE_DETAIL = {
  "Glúteo mayor": "Glúteos", "Glúteo medio": "Glúteos", "Abductores": "Glúteos", "Cuádriceps": "Cuádriceps", "Isquiotibiales": "Isquiotibiales",
  "Aductores": "Aductores", "Gemelos": "Gemelos", "Sóleo": "Gemelos", "Pectoral mayor": "Pecho", "Pectoral superior": "Pecho",
  "Dorsal ancho": "Espalda", "Trapecio medio y romboides": "Espalda", "Trapecio superior": "Espalda", "Erectores espinales": "Zona lumbar",
  "Deltoides anterior": "Hombros", "Deltoides lateral": "Hombros", "Deltoides posterior": "Hombros", "Manguito rotador": "Hombros",
  "Bíceps": "Bíceps", "Braquial": "Bíceps", "Braquiorradial": "Antebrazo", "Antebrazo": "Antebrazo", "Tríceps": "Tríceps",
  "Recto abdominal": "Core", "Oblicuos": "Core", "Transverso abdominal": "Core"
};
const DETAIL_MUSCLES = Object.keys(MUSCLE_DETAIL);

/* ---------- Siembra de la biblioteca la primera vez ---------- */
let seeding = false;
document.addEventListener("hub:loaded", async () => {
  if (seeding || S.needsMigration) return;
  seeding = true;
  try {
    // añade los ejercicios que falten y completa los músculos concretos de los que ya tenías
    const byName = {}; S.d.fit_exercises.forEach(e => byName[e.name.toLowerCase()] = e);
    const missing = EX_LIB.filter(([n]) => !byName[n.toLowerCase()]).map(([name, muscle, primary_muscles, secondary_muscles]) => ({ name, muscle, primary_muscles, secondary_muscles }));
    if (missing.length) await insertMany("fit_exercises", missing);
    const upd = EX_LIB.map(l => [byName[l[0].toLowerCase()], l]).filter(([e, l]) => e && l[2].length && (!e.primary_muscles || !e.primary_muscles.length));
    for (let i = 0; i < upd.length; i += 8) await Promise.all(upd.slice(i, i + 8).map(([e, l]) => save("fit_exercises", { primary_muscles: l[2], secondary_muscles: l[3] }, e.id)));
    if (missing.length || upd.length) render();
  } catch (_) {} finally { seeding = false; }
});
const primOf = ex => ex?.primary_muscles?.length ? ex.primary_muscles : [];
const secOf = ex => ex?.secondary_muscles || [];
const exMuscleText = ex => primOf(ex).length ? primOf(ex).join(", ") : (ex?.muscle || "");

/* ---------- Consultas ---------- */
const exercisesSorted = () => S.d.fit_exercises.filter(e => !e.archived).sort((a, b) => MUSCLES.indexOf(a.muscle) - MUSCLES.indexOf(b.muscle) || a.name.localeCompare(b.name, "es"));
const routinesSorted = () => [...S.d.fit_routines].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
const rexOf = rid => S.d.fit_routine_exercises.filter(x => x.routine_id === rid).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
const musclesOfRoutine = rid => [...new Set(rexOf(rid).flatMap(r => { const ex = byId("fit_exercises", r.exercise_id); return primOf(ex).length ? primOf(ex) : (ex?.muscle && ex.muscle !== "Cardio" ? [ex.muscle] : []); }))];
const setsOf = sid => S.d.fit_sets.filter(s => s.session_id === sid).sort((a, b) => a.position - b.position || a.set_index - b.set_index);
const sessionsOn = k => S.d.fit_sessions.filter(s => s.date === k);
const activeSession = () => S.d.fit_sessions.find(s => !s.finished && s.kind === "gym");
const schedOf = wd => S.d.fit_schedule.filter(x => x.weekday === wd).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
const hhmm = t => t ? t.slice(0, 5) : "";
const finishedSessionsDesc = () => S.d.fit_sessions.filter(s => s.finished).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

function lastSetsFor(exId, exceptSid) {
  for (const s of finishedSessionsDesc()) {
    if (s.id === exceptSid) continue;
    const sets = S.d.fit_sets.filter(x => x.session_id === s.id && x.exercise_id === exId && x.done).sort((a, b) => a.set_index - b.set_index);
    if (sets.length) return { session: s, sets };
  }
  return null;
}
const setsSummary = sets => {
  const ws = [...new Set(sets.map(s => s.weight_kg ?? "–"))];
  if (ws.length === 1) return `${ws[0] === "–" ? "" : fmtNum(ws[0]) + " kg × "}${sets.map(s => s.reps ?? "–").join(", ")}`;
  return sets.map(s => `${s.weight_kg !== null ? fmtNum(s.weight_kg) + "×" : ""}${s.reps ?? "–"}`).join(", ");
};

/* Lo que toca hoy (lo usa también la página de inicio) */
function fitToday() {
  const k = todayKey(), plan = schedOf(wd1(new Date())), done = sessionsOn(k);
  return plan.map(p => {
    const r = p.routine_id ? byId("fit_routines", p.routine_id) : null;
    const isDone = p.kind === "pilates" ? done.some(s => s.kind === "pilates" && s.finished)
      : p.kind === "gym" ? done.some(s => s.kind === "gym" && s.finished && (!p.routine_id || s.routine_id === p.routine_id))
      : done.some(s => s.kind === "otro" && s.finished);
    return { ...p, routine: r, name: p.kind === "gym" ? (r?.name || p.label || "Gimnasio") : p.kind === "pilates" ? "Pilates" : (p.label || "Actividad"), done: isDone };
  });
}

/* Series por músculo: principal cuenta 1, secundario 0,5 */
function detailSets(fromK, toK) {
  const ids = new Set(S.d.fit_sessions.filter(s => s.date >= fromK && s.date <= toK).map(s => s.id)), out = {};
  S.d.fit_sets.filter(s => s.done && ids.has(s.session_id)).forEach(s => addExSets(out, byId("fit_exercises", s.exercise_id), 1, s.muscle));
  return out;
}
function addExSets(out, ex, n, fallback) {
  const pr = primOf(ex);
  if (!pr.length) { const g = ex?.muscle || fallback; if (g && g !== "Cardio") out["~" + g] = (out["~" + g] || 0) + n; return; }
  pr.forEach(m => out[m] = (out[m] || 0) + n);
  secOf(ex).forEach(m => out[m] = (out[m] || 0) + n * 0.5);
}
function toGroups(det) {
  const out = {};
  Object.entries(det).forEach(([m, n]) => { const g = m.startsWith("~") ? m.slice(1) : (MUSCLE_DETAIL[m] || m); out[g] = (out[g] || 0) + n; });
  return out;
}
function weekMuscleSets(offsetWeeks = 0) {
  const a = keyOf(addDays(weekStart(new Date()), 7 * offsetWeeks)), b = keyOf(addDays(fromKey(a), 6));
  return toGroups(detailSets(a, b));
}
/* Series semanales según el plan (rutinas asignadas a cada día) */
function planDetailSets() {
  const out = {};
  S.d.fit_schedule.filter(p => p.kind === "gym" && p.routine_id).forEach(p => rexOf(p.routine_id).forEach(x => addExSets(out, byId("fit_exercises", x.exercise_id), x.target_sets || 0)));
  return out;
}

/* =====================================================================
   Vistas
   ===================================================================== */

const muscleChips = ms => ms.length ? `<div class="mchips">${ms.map(m => `<span>${esc(m)}</span>`).join("")}</div>` : "";

MOD.entreno = {
  tabs: r => r.sub === "sesion" && !byId("fit_sessions", r.id)?.finished ? null : [["hoy", "Hoy", "hoy"], ["semana", "Semana", "semana"], ["rutinas", "Rutinas", "rutinas"], ["musculos", "Músculos", "cuerpo"], ["progreso", "Progreso", "progreso"]],
  tabOf: r => ({ rutina: "rutinas", ejercicio: "progreso", historial: "progreso", sesion: "progreso", biblioteca: "rutinas" }[r.sub] || r.sub || "hoy"),
  render(r) {
    const sub = r.sub || "hoy";
    if (sub === "sesion") return viewSession(r.id);
    if (sub === "rutina") return viewRoutine(r.id);
    if (sub === "ejercicio") return viewExercise(r.id);
    if (sub === "historial") return modHead("Historial", ["entreno", "progreso", "Progreso"]) + viewHistory();
    if (sub === "biblioteca") return modHead("Ejercicios", ["entreno", "rutinas", "Rutinas"]) + viewLibrary();
    const titles = { hoy: "Entreno", semana: "Mi semana", rutinas: "Rutinas", musculos: "Músculos", progreso: "Progreso" };
    const body = { hoy: viewFitHoy, semana: viewWeek, rutinas: viewRoutines, musculos: viewMuscles, progreso: viewProgress }[sub] || viewFitHoy;
    return modHead(titles[sub] || "Entreno") + body();
  },
  fab(r) {
    const sub = r.sub || "hoy";
    if (sub === "semana") return { label: "Añadir al plan", fn: () => openSched(null, wd1(new Date())) };
    if (sub === "rutinas") return { label: "Nueva rutina", fn: () => openRoutineMeta(null) };
    if (sub === "historial" || sub === "progreso") return { label: "Registrar actividad", fn: () => openLog() };
    if (sub === "biblioteca") return { label: "Nuevo ejercicio", fn: () => openExercise(null) };
    if (sub === "sesion") return null;
    return null;
  }
};

function viewFitHoy() {
  const act = activeSession(), items = fitToday();
  let h = "";
  if (act) h += `<div class="callout"><div><b>Entreno en curso</b><span>${esc(act.name || "Entreno")}, empezado a las ${timeOf(new Date(act.created_at))}</span></div>
    <button class="btn-sm primary" data-go="entreno/sesion/${act.id}">Continuar</button></div>`;
  h += `<div class="block"><h2>${esc(cap(fmt(new Date(), { weekday: "long" })))}</h2>`;
  if (!items.length) h += `<div class="empty">Hoy no tienes nada en el plan: día de descanso. Si te apetece, puedes hacer un entreno libre.</div>`;
  h += items.map(p => {
    if (p.kind === "gym") {
      const ms = p.routine ? musclesOfRoutine(p.routine.id) : [];
      return `<div class="plan-card" style="--accent:${colorVar(p.routine?.color)}">
        <div class="pc-top"><div><span class="pc-kind">Gimnasio${p.time ? ", " + hhmm(p.time) : ""}</span><b>${esc(p.name)}</b></div>${p.done ? `<span class="done-tag">Hecho</span>` : ""}</div>
        ${muscleChips(ms)}
        ${p.done ? "" : `<button class="btn primary" data-act="startWorkout" data-routine="${p.routine_id || ""}">Empezar entreno</button>`}
      </div>`;
    }
    if (p.kind === "pilates") return `<div class="plan-card" style="--accent:var(--c-ciruela)">
        <div class="pc-top"><div><span class="pc-kind">Pilates</span><b>${p.time ? "A las " + hhmm(p.time) : "Sin hora"}</b></div>${p.done ? `<span class="done-tag">Hecho</span>` : ""}</div>
        ${p.done ? "" : `<button class="btn soft" data-act="logQuick" data-kind="pilates">Marcar pilates como hecho</button>`}</div>`;
    return `<div class="plan-card"><div class="pc-top"><div><span class="pc-kind">Otra actividad${p.time ? ", " + hhmm(p.time) : ""}</span><b>${esc(p.name)}</b></div>${p.done ? `<span class="done-tag">Hecho</span>` : ""}</div>
      ${p.done ? "" : `<button class="btn soft" data-act="logQuick" data-kind="otro" data-label="${esc(p.name)}">Marcar como hecho</button>`}</div>`;
  }).join("");
  h += `<button class="link-btn" data-act="freeWorkout">Hacer un entreno libre o de otra rutina</button></div>`;

  const ws = weekMuscleSets(), wk0 = keyOf(weekStart(new Date())), wk1 = keyOf(addDays(weekStart(new Date()), 6));
  const wsess = S.d.fit_sessions.filter(s => s.finished && s.date >= wk0 && s.date <= wk1);
  h += `<div class="block"><h2>Esta semana</h2>
    <div class="stats3"><div><b>${wsess.filter(s => s.kind === "gym").length}</b><span>gimnasio</span></div><div><b>${wsess.filter(s => s.kind === "pilates").length}</b><span>pilates</span></div><div><b>${S.d.fit_sets.filter(x => x.done && wsess.some(s => s.id === x.session_id)).length}</b><span>series</span></div></div>
    ${muscleBars(ws)}</div>`;
  return h;
}
function muscleBars(ws) {
  const entries = Object.entries(ws).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<div class="empty">Cuando completes series, aquí verás cuántas haces por grupo muscular.</div>`;
  const max = Math.max(...entries.map(e => e[1]));
  return `<div class="mbars">${entries.map(([m, n]) => `<div class="mbar"><span>${esc(m)}</span>${bar(n / max * 100)}<b>${fmtNum(n, 1)}</b></div>`).join("")}</div>`;
}

function viewWeek() {
  const today = wd1(new Date());
  return `<p class="lead">Lo que haces cada semana. Aparece en la página de inicio el día que toca.</p>` + DIAS.map((d, i) => {
    const wd = i + 1, items = schedOf(wd);
    return `<div class="week-day ${wd === today ? "is-today" : ""}">
      <div class="wd-h"><b>${d}</b><button class="link-btn" data-act="addSched" data-wd="${wd}">Añadir</button></div>
      ${items.length ? items.map(p => {
        const r = p.routine_id ? byId("fit_routines", p.routine_id) : null;
        const name = p.kind === "gym" ? (r?.name || p.label || "Gimnasio") : p.kind === "pilates" ? "Pilates" : (p.label || "Actividad");
        return `<button class="row" data-act="editSched" data-id="${p.id}"><span class="time">${esc(hhmm(p.time) || "")}</span>
          <span class="bar" style="background:${p.kind === "pilates" ? "var(--c-ciruela)" : colorVar(r?.color)}"></span>
          <span class="body"><span class="title">${esc(name)}</span><span class="meta">${esc(KIND_LABEL[p.kind])}${r ? ", " + esc(musclesOfRoutine(r.id).join(", ")) : ""}</span></span></button>`;
      }).join("") : `<div class="wd-empty">Descanso</div>`}
    </div>`;
  }).join("");
}

function viewLibrary() {
  let h = "", cur = "";
  exercisesSorted().forEach(e => { if (e.muscle !== cur) { if (cur) h += `</div>`; cur = e.muscle; h += `<div class="group-h">${esc(cur)}</div><div class="list">`; }
    h += `<button class="row" data-act="editExercise" data-id="${e.id}"><span class="body"><span class="title">${esc(e.name)}</span><span class="meta">${esc(primOf(e).join(", ") || "Sin músculos asignados")}${secOf(e).length ? ` · también ${esc(secOf(e).join(", ").toLowerCase())}` : ""}</span></span></button>`; });
  return `<p class="lead">Toca un ejercicio para ver o cambiar los músculos que trabaja.</p>` + h + (cur ? `</div>` : "");
}
function viewRoutines() {
  return viewRoutinesList() + `<button class="link-btn" data-go="entreno/biblioteca" style="margin-top:14px">Ver la biblioteca de ejercicios</button>`;
}
function viewRoutinesList() {
  const rs = routinesSorted();
  if (!rs.length) return `<div class="empty">Aún no tienes rutinas. Crea una por cada tipo de día, por ejemplo "Día de culo" o "Bíceps y espalda". <button data-act="newRoutine">Crear rutina</button></div>`;
  return `<div class="list">${rs.map(r => {
    const n = rexOf(r.id).length, ms = musclesOfRoutine(r.id);
    return `<button class="row" data-go="entreno/rutina/${r.id}"><span class="bar" style="background:${colorVar(r.color)}"></span>
      <span class="body"><span class="title">${esc(r.name)}</span><span class="meta">${n} ${n === 1 ? "ejercicio" : "ejercicios"}${ms.length ? ", " + esc(ms.join(", ")) : ""}</span></span></button>`;
  }).join("")}</div>`;
}

function viewRoutine(id) {
  const r = byId("fit_routines", id);
  if (!r) return modHead("Rutina", ["entreno", "rutinas", "Rutinas"]) + `<div class="empty">Esta rutina ya no existe.</div>`;
  const items = rexOf(id);
  return modHead(r.name, ["entreno", "rutinas", "Rutinas"], `<button class="btn-sm" data-act="editRoutineMeta" data-id="${id}">Editar</button>`) +
    muscleChips(musclesOfRoutine(id)) +
    `<div class="block" style="margin-top:16px">${items.length ? `<div class="list">${items.map((x, i) => {
      const ex = byId("fit_exercises", x.exercise_id);
      const meta = [`${x.target_sets} × ${x.target_reps || "?"}`, x.target_weight !== null ? fmtNum(x.target_weight) + " kg" : "", `descanso ${x.rest_sec} s`].filter(Boolean).join(", ");
      return `<div class="rex"><button class="rex-main" data-act="editRex" data-id="${x.id}"><span class="rex-n">${i + 1}</span>
        <span class="body"><span class="title">${esc(ex?.name || "Ejercicio")}</span><span class="meta">${esc(exMuscleText(ex))}, ${esc(meta)}</span></span></button>
        <div class="rex-move"><button class="icon-xs" data-act="moveRex" data-id="${x.id}" data-dir="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>▲</button>
        <button class="icon-xs" data-act="moveRex" data-id="${x.id}" data-dir="1" aria-label="Bajar" ${i === items.length - 1 ? "disabled" : ""}>▼</button></div></div>`;
    }).join("")}</div>` : `<div class="empty">Esta rutina no tiene ejercicios todavía.</div>`}
    <button class="btn soft" data-act="addRex" data-id="${id}" style="margin-top:14px">Añadir ejercicio</button>
    ${items.length ? `<button class="btn primary" data-act="startWorkout" data-routine="${id}" style="margin-top:10px">Empezar esta rutina</button>` : ""}</div>`;
}

function viewSession(id) {
  const s = byId("fit_sessions", id);
  if (!s) return modHead("Entreno", ["entreno", "hoy", "Entreno"]) + `<div class="empty">Este entreno ya no existe.</div>`;
  const sets = setsOf(id), groups = [];
  sets.forEach(x => { let g = groups.find(g => g.pos === x.position && g.ex === x.exercise_id); if (!g) groups.push(g = { pos: x.position, ex: x.exercise_id, name: x.exercise_name, muscle: x.muscle, sets: [] }); g.sets.push(x); });
  const rexMap = {}; if (s.routine_id) rexOf(s.routine_id).forEach(x => rexMap[x.exercise_id] = x);
  const doneN = sets.filter(x => x.done).length, vol = sum(sets.filter(x => x.done), x => (x.weight_kg || 0) * (x.reps || 0));
  const sub = s.finished ? `${esc(niceDate(s.date))}${s.duration_min ? `, ${s.duration_min} min` : ""}, ${plural(doneN, "serie", "series")}, ${fmtNum(vol, 0)} kg de volumen`
    : `En curso desde las ${timeOf(new Date(s.created_at))}, ${plural(doneN, "serie hecha", "series hechas")}`;
  return modHead(s.name || "Entreno", s.finished ? ["entreno", "historial", "Historial"] : ["entreno", "hoy", "Entreno"],
      `<button class="btn-sm" data-act="editSessionMeta" data-id="${id}">Editar</button>`) +
    `<p class="lead">${sub}</p>` +
    groups.map(g => {
      const last = g.ex ? lastSetsFor(g.ex, id) : null, rx = rexMap[g.ex];
      return `<div class="ex-block">
        <div class="ex-h"><div><b>${esc(g.name)}</b><span>${esc(exMuscleText(byId("fit_exercises", g.ex)) || g.muscle || "")}${rx ? `, objetivo ${rx.target_sets} × ${esc(rx.target_reps || "?")}` : ""}</span></div>
          <button class="icon-xs" data-act="removeExFromSession" data-sid="${id}" data-pos="${g.pos}" data-ex="${g.ex || ""}" aria-label="Quitar ${esc(g.name)}">✕</button></div>
        ${last ? `<div class="last">Última vez (${esc(niceDate(last.session.date))}): ${esc(setsSummary(last.sets))}</div>` : ""}
        <div class="set-h"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>
        ${g.sets.map((x, i) => `<div class="set-row ${x.done ? "done" : ""}">
          <span class="sn">${i + 1}</span>
          <input class="input sm" inputmode="decimal" autocomplete="off" data-ch="setW" data-id="${x.id}" value="${fmtIn(x.weight_kg)}" placeholder="${esc(rx?.target_weight != null ? fmtIn(rx.target_weight) : "kg")}" aria-label="Kilos serie ${i + 1}">
          <input class="input sm" inputmode="numeric" autocomplete="off" data-ch="setR" data-id="${x.id}" value="${x.reps ?? ""}" placeholder="${esc(rx?.target_reps ?? "reps")}" aria-label="Repeticiones serie ${i + 1}">
          <button class="check" data-act="setDone" data-id="${x.id}" aria-label="Serie ${i + 1} hecha">${ICON_CHECK}</button></div>`).join("")}
        <div class="set-actions"><button class="link-btn" data-act="addSet" data-sid="${id}" data-pos="${g.pos}" data-ex="${g.ex || ""}">Añadir serie</button>
          ${g.sets.length > 1 ? `<button class="link-btn muted" data-act="dropSet" data-id="${g.sets[g.sets.length - 1].id}">Quitar la última</button>` : ""}</div>
      </div>`;
    }).join("") +
    `<button class="btn soft" data-act="addExToSession" data-sid="${id}">Añadir ejercicio</button>
    ${s.finished ? `<button class="btn ghost" data-act="deleteSession" data-id="${id}">Eliminar entreno</button>`
      : `<button class="btn primary" data-act="finishSession" data-id="${id}" style="margin-top:10px">Terminar entreno</button>
         <button class="btn ghost" data-act="deleteSession" data-id="${id}">Descartar entreno</button>`}`;
}

function exerciseStats() {
  const map = {};
  const sessDate = {}; S.d.fit_sessions.forEach(s => sessDate[s.id] = s.date);
  S.d.fit_sets.filter(x => x.done && x.exercise_id).forEach(x => {
    const m = map[x.exercise_id] ||= { id: x.exercise_id, name: x.exercise_name, muscle: x.muscle, best: 0, last: "", n: 0 };
    m.n++; if ((x.weight_kg || 0) > m.best) m.best = x.weight_kg || 0;
    const d = sessDate[x.session_id] || ""; if (d > m.last) m.last = d;
  });
  return Object.values(map).sort((a, b) => b.last.localeCompare(a.last));
}

function viewProgress() {
  return viewProgressInner() + `<div class="block"><h2>Historial <button data-go="entreno/historial">Ver todo</button></h2>${viewHistoryShort()}</div>`;
}
function viewHistoryShort() {
  const list = finishedSessionsDesc().slice(0, 5);
  if (!list.length) return `<div class="empty">Aún no hay entrenos registrados.</div>`;
  return `<div class="list">${list.map(s => { const r = s.routine_id ? byId("fit_routines", s.routine_id) : null;
    return `<button class="row" ${s.kind === "gym" ? `data-go="entreno/sesion/${s.id}"` : `data-act="editLog" data-id="${s.id}"`}><span class="bar" style="background:${s.kind === "pilates" ? "var(--c-ciruela)" : colorVar(r?.color)}"></span>
      <span class="body"><span class="title">${esc(s.name || KIND_LABEL[s.kind])}</span><span class="meta">${esc(niceDate(s.date))}${s.duration_min ? `, ${s.duration_min} min` : ""}</span></span></button>`; }).join("")}</div>`;
}
function viewProgressInner() {
  const mk = monthKey(new Date()), monthSess = S.d.fit_sessions.filter(s => s.finished && s.date.startsWith(mk));
  const stats = exerciseStats();
  return `<div class="block"><h2>Este mes</h2>
    <div class="stats3"><div><b>${monthSess.filter(s => s.kind === "gym").length}</b><span>gimnasio</span></div><div><b>${monthSess.filter(s => s.kind === "pilates").length}</b><span>pilates</span></div><div><b>${sum(monthSess, s => s.duration_min)}</b><span>minutos</span></div></div></div>
  <div class="block"><h2>Series por grupo esta semana</h2>${muscleBars(weekMuscleSets())}
    <p class="hint">Los músculos principales de cada ejercicio cuentan una serie y los secundarios, media.</p></div>
  <div class="block"><h2>Tus ejercicios</h2>${stats.length ? `<div class="list">${stats.map(m => `<button class="row" data-go="entreno/ejercicio/${m.id}">
      <span class="body"><span class="title">${esc(m.name)}</span><span class="meta">${esc(m.muscle || "")}, última vez ${esc(niceDate(m.last).toLowerCase())}</span></span>
      <span class="pr">${m.best ? fmtNum(m.best) + " kg" : ""}</span></button>`).join("")}</div>`
    : `<div class="empty">Aquí aparecerán tus ejercicios con su mejor marca cuando completes tu primer entreno.</div>`}</div>`;
}

function viewExercise(id) {
  const ex = byId("fit_exercises", id);
  const sessDate = {}; S.d.fit_sessions.forEach(s => sessDate[s.id] = s);
  const bySess = {};
  S.d.fit_sets.filter(x => x.done && x.exercise_id === id).forEach(x => (bySess[x.session_id] ||= []).push(x));
  const hist = Object.entries(bySess).map(([sid, sets]) => ({ s: sessDate[sid], sets: sets.sort((a, b) => a.set_index - b.set_index) }))
    .filter(h => h.s).sort((a, b) => a.s.date.localeCompare(b.s.date));
  const pts = hist.map(h => ({ x: fromKey(h.s.date).getTime(), y: Math.max(...h.sets.map(x => x.weight_kg || 0)) })).filter(p => p.y > 0);
  const e1 = hist.flatMap(h => h.sets).map(x => (x.weight_kg || 0) * (1 + (x.reps || 0) / 30));
  const best = Math.max(0, ...hist.flatMap(h => h.sets).map(x => x.weight_kg || 0));
  return modHead(ex?.name || "Ejercicio", ["entreno", "progreso", "Progreso"]) +
    `<div class="stats3"><div><b>${best ? fmtNum(best) : "–"}</b><span>kg máximo</span></div><div><b>${e1.length ? fmtNum(Math.max(...e1), 0) : "–"}</b><span>1RM estimado</span></div><div><b>${hist.length}</b><span>sesiones</span></div></div>
    <div class="block"><h2>Peso máximo por sesión</h2>${lineChart(pts, { fy: v => fmtNum(v) + " kg" })}</div>
    <div class="block"><h2>Historial</h2>${hist.length ? `<div class="list">${[...hist].reverse().map(h => `<button class="row" data-go="entreno/sesion/${h.s.id}">
      <span class="body"><span class="title">${esc(setsSummary(h.sets))}</span><span class="meta">${esc(niceDate(h.s.date))}, ${esc(h.s.name || "")}</span></span></button>`).join("")}</div>` : `<div class="empty">Sin registros todavía.</div>`}</div>
    <p class="hint">El 1RM estimado es el peso que, en teoría, podrías levantar una vez, calculado a partir de tus series (fórmula de Epley). Sirve para comparar tu progreso, no como objetivo.</p>`;
}

function viewHistory() {
  const list = finishedSessionsDesc();
  if (!list.length) return `<div class="empty">Aún no hay entrenos registrados. Cuando termines uno, aparecerá aquí.</div>`;
  let h = "", cur = "";
  list.forEach(s => {
    const mk = s.date.slice(0, 7);
    if (mk !== cur) { if (cur) h += `</div>`; cur = mk; h += `<div class="group-h">${esc(cap(fmt(fromKey(s.date), { month: "long", year: "numeric" })))}</div><div class="list">`; }
    const sets = S.d.fit_sets.filter(x => x.session_id === s.id && x.done);
    const meta = [niceDate(s.date), s.duration_min ? s.duration_min + " min" : "", s.kind === "gym" ? plural(sets.length, "serie", "series") : ""].filter(Boolean).join(", ");
    const r = s.routine_id ? byId("fit_routines", s.routine_id) : null;
    h += `<button class="row" ${s.kind === "gym" ? `data-go="entreno/sesion/${s.id}"` : `data-act="editLog" data-id="${s.id}"`}>
      <span class="bar" style="background:${s.kind === "pilates" ? "var(--c-ciruela)" : colorVar(r?.color)}"></span>
      <span class="body"><span class="title">${esc(s.name || KIND_LABEL[s.kind])}</span><span class="meta">${esc(meta)}</span></span></button>`;
  });
  return h + `</div>`;
}

/* =====================================================================
   Acciones
   ===================================================================== */
async function startSession(routineId) {
  const act = activeSession();
  if (act) {
    if (confirm(`Tienes "${act.name || "un entreno"}" sin terminar. ¿Quieres continuarlo?`)) return go("entreno", "sesion", act.id);
    return;
  }
  const r = routineId ? byId("fit_routines", routineId) : null;
  try {
    const s = await save("fit_sessions", { date: todayKey(), kind: "gym", routine_id: r?.id || null, name: r?.name || "Entreno libre" });
    if (r) {
      const rows = [];
      rexOf(r.id).forEach((x, i) => {
        const ex = byId("fit_exercises", x.exercise_id); if (!ex) return;
        rows.push(...buildSets(s.id, ex, i, x.target_sets, x));
      });
      await insertMany("fit_sets", rows);
    }
    go("entreno", "sesion", s.id);
  } catch (x) { toast(errMsg(x), true); }
}
function buildSets(sid, ex, position, n, rx) {
  const last = lastSetsFor(ex.id, sid)?.sets || [];
  const out = [];
  for (let j = 1; j <= Math.max(1, n || 3); j++) {
    const ls = last[j - 1] || last[last.length - 1];
    out.push({ session_id: sid, exercise_id: ex.id, exercise_name: ex.name, muscle: ex.muscle, position, set_index: j,
      reps: ls?.reps ?? null, weight_kg: ls?.weight_kg ?? rx?.target_weight ?? null, done: false });
  }
  return out;
}
ACT.startWorkout = (el, d) => startSession(d.routine || null);
ACT.freeWorkout = () => {
  const rs = routinesSorted();
  openSheet(`${sheetHead("Empezar entreno")}<div class="list">${rs.map(r => `<button class="row" data-pickr="${r.id}"><span class="bar" style="background:${colorVar(r.color)}"></span>
    <span class="body"><span class="title">${esc(r.name)}</span><span class="meta">${esc(musclesOfRoutine(r.id).join(", "))}</span></span></button>`).join("")}
    <button class="row" data-pickr=""><span class="bar" style="background:var(--line)"></span><span class="body"><span class="title">Entreno libre</span><span class="meta">Empiezas vacío y añades ejercicios</span></span></button></div>`,
    root => $$("[data-pickr]", root).forEach(b => b.addEventListener("click", () => { closeSheet(); startSession(b.dataset.pickr || null); })));
};

CH.setW = async el => { const x = byId("fit_sets", el.dataset.id); if (!x) return; const v = num(el.value); x.weight_kg = v; try { await save("fit_sets", { weight_kg: v }, x.id); } catch (e) { toast(errMsg(e), true); } };
CH.setR = async el => { const x = byId("fit_sets", el.dataset.id); if (!x) return; const v = num(el.value); x.reps = v === null ? null : Math.round(v); try { await save("fit_sets", { reps: x.reps }, x.id); } catch (e) { toast(errMsg(e), true); } };
ACT.setDone = async (el, d) => {
  const x = byId("fit_sets", d.id); if (!x) return;
  // guardar lo escrito aunque no se haya salido del campo
  const row = el.closest(".set-row"), w = num($('[data-ch="setW"]', row).value), r = num($('[data-ch="setR"]', row).value);
  const patch = { done: !x.done, weight_kg: w, reps: r === null ? null : Math.round(r) };
  Object.assign(x, patch); render();
  try {
    await save("fit_sets", patch, x.id);
    const s = byId("fit_sessions", x.session_id);
    if (patch.done && s && !s.finished) {
      const rx = s.routine_id ? rexOf(s.routine_id).find(z => z.exercise_id === x.exercise_id) : null;
      startRest(rx?.rest_sec || 90);
    }
  } catch (e) { x.done = !patch.done; render(); toast(errMsg(e), true); }
};
ACT.addSet = async (el, d) => {
  const sets = setsOf(d.sid).filter(x => x.position === +d.pos && (x.exercise_id || "") === d.ex);
  const lastS = sets[sets.length - 1]; if (!lastS) return;
  try { await save("fit_sets", { session_id: d.sid, exercise_id: lastS.exercise_id, exercise_name: lastS.exercise_name, muscle: lastS.muscle, position: lastS.position, set_index: lastS.set_index + 1, reps: lastS.reps, weight_kg: lastS.weight_kg, done: false }); render(); }
  catch (x) { toast(errMsg(x), true); }
};
ACT.dropSet = async (el, d) => { try { await remove("fit_sets", d.id); render(); } catch (x) { toast(errMsg(x), true); } };
ACT.removeExFromSession = async (el, d) => {
  if (!confirm("¿Quitar este ejercicio del entreno?")) return;
  const ids = setsOf(d.sid).filter(x => x.position === +d.pos && (x.exercise_id || "") === d.ex).map(x => x.id);
  try { await removeIds("fit_sets", ids); render(); } catch (x) { toast(errMsg(x), true); }
};
ACT.addExToSession = (el, d) => pickExercise(async exId => {
  const ex = byId("fit_exercises", exId), pos = Math.max(-1, ...setsOf(d.sid).map(x => x.position)) + 1;
  try { await insertMany("fit_sets", buildSets(d.sid, ex, pos, 3)); render(); } catch (x) { toast(errMsg(x), true); }
});
ACT.finishSession = async (el, d) => {
  const s = byId("fit_sessions", d.id), sets = setsOf(d.id), done = sets.filter(x => x.done);
  if (!done.length) {
    if (!confirm("No has marcado ninguna serie como hecha. ¿Descartar este entreno?")) return;
    try { await remove("fit_sessions", s.id); stopRest(); go("entreno", "hoy"); toast("Entreno descartado"); } catch (x) { toast(errMsg(x), true); }
    return;
  }
  const pending = sets.filter(x => !x.done);
  if (pending.length && !confirm(`Hay ${pending.length} ${pending.length === 1 ? "serie sin marcar" : "series sin marcar"}. Se quitarán al terminar. ¿Terminar el entreno?`)) return;
  try {
    await removeIds("fit_sets", pending.map(x => x.id));
    const mins = s.date === todayKey() ? Math.min(300, Math.max(1, Math.round((Date.now() - new Date(s.created_at)) / 60000))) : s.duration_min;
    await save("fit_sessions", { finished: true, duration_min: mins }, s.id);
    stopRest(); go("entreno", "hoy"); toast("¡Entreno guardado!");
  } catch (x) { toast(errMsg(x), true); }
};
ACT.deleteSession = async (el, d) => {
  const s = byId("fit_sessions", d.id);
  if (!confirm(s.finished ? "¿Eliminar este entreno del historial?" : "¿Descartar este entreno? Se perderán las series.")) return;
  try { await remove("fit_sessions", d.id); stopRest(); go("entreno", s.finished ? "historial" : "hoy"); toast(s.finished ? "Entreno eliminado" : "Entreno descartado"); }
  catch (x) { toast(errMsg(x), true); }
};
ACT.editSessionMeta = (el, d) => {
  const s = byId("fit_sessions", d.id);
  formSheet("Editar entreno", `${field("Nombre", inp("sName", s.name), "sName")}
    <input type="date" class="input" id="sDate" value="${esc(s.date)}" aria-label="Fecha" style="margin-bottom:14px">
    ${field("Duración (min)", numInp("sDur", s.duration_min ?? ""), "sDur")}${field("Notas", area("sNotes", s.notes), "sNotes")}`, {
    onSubmit: async root => { await save("fit_sessions", { name: val(root, "sName") || null, date: val(root, "sDate") || s.date, duration_min: num(val(root, "sDur")), notes: val(root, "sNotes") || null }, s.id); toast("Guardado"); }
  });
};

/* ---------- Pilates y otras actividades ---------- */
ACT.logQuick = async (el, d) => {
  try { await save("fit_sessions", { date: todayKey(), kind: d.kind, name: d.kind === "pilates" ? "Pilates" : (d.label || "Actividad"), finished: true }); render(); toast(d.kind === "pilates" ? "Pilates hecho" : "Hecho"); }
  catch (x) { toast(errMsg(x), true); }
};
function openLog(s) {
  let kind = s?.kind || "pilates";
  formSheet(s ? "Editar actividad" : "Registrar actividad", `
    ${s ? "" : `<div class="field"><span class="lbl">Tipo</span><div class="segfull" role="group">
      ${["pilates", "gym", "otro"].map(k => `<button type="button" data-k="${k}" aria-pressed="${k === kind}">${k === "gym" ? "Gimnasio" : k === "pilates" ? "Pilates" : "Otra"}</button>`).join("")}</div></div>`}
    ${field("Nombre", inp("lName", s?.name || ""), "lName")}
    ${field("Fecha", `<input type="date" class="input" id="lDate" value="${esc(s?.date || todayKey())}">`, "lDate")}
    ${field("Duración (min)", numInp("lDur", s?.duration_min ?? ""), "lDur")}
    ${field("Notas", area("lNotes", s?.notes), "lNotes")}
    <p class="hint" id="lHint">${s ? "" : "Si eliges Gimnasio, se abrirá el entreno para que apuntes las series."}</p>`, {
    mount: root => bindSeg(root, "[data-k]", b => kind = b.dataset.k),
    onSubmit: async root => {
      const date = val(root, "lDate") || todayKey(), row = { date, name: val(root, "lName") || null, duration_min: num(val(root, "lDur")), notes: val(root, "lNotes") || null };
      if (s) { await save("fit_sessions", row, s.id); toast("Guardado"); return; }
      if (kind === "gym") { const ns = await save("fit_sessions", { ...row, kind: "gym", name: row.name || "Entreno" }); setTimeout(() => go("entreno", "sesion", ns.id)); return; }
      await save("fit_sessions", { ...row, kind, name: row.name || (kind === "pilates" ? "Pilates" : "Actividad"), finished: true }); toast("Actividad registrada");
    },
    onDelete: s ? () => remove("fit_sessions", s.id) : null
  });
}
ACT.editLog = (el, d) => openLog(byId("fit_sessions", d.id));

/* ---------- Plan semanal ---------- */
ACT.addSched = (el, d) => openSched(null, +d.wd);
ACT.editSched = (el, d) => openSched(byId("fit_schedule", d.id));
function openSched(p, wd) {
  let kind = p?.kind || "gym";
  const rs = routinesSorted();
  formSheet(p ? "Editar plan" : "Añadir al plan", `
    ${field("Día", sel("scDay", DIAS.map((x, i) => [i + 1, x]), p?.weekday || wd), "scDay")}
    <div class="field"><span class="lbl">Tipo</span><div class="segfull" role="group">
      ${["gym", "pilates", "otro"].map(k => `<button type="button" data-k="${k}" aria-pressed="${k === kind}">${k === "gym" ? "Gimnasio" : k === "pilates" ? "Pilates" : "Otra"}</button>`).join("")}</div></div>
    <div class="field" id="scRoutineF"><label for="scRoutine">Rutina</label>${sel("scRoutine", [["", "Sin rutina fija"], ...rs.map(r => [r.id, r.name])], p ? (p.routine_id || "") : (rs[0]?.id || ""))}
      ${rs.length ? "" : `<p class="hint">Aún no tienes rutinas. Créalas en la pestaña Rutinas y luego asígnalas aquí.</p>`}</div>
    <div class="field" id="scLabelF"><label for="scLabel">Nombre</label>${inp("scLabel", p?.label || "", 'placeholder="Por ejemplo: correr, nadar…"')}</div>
    ${field("Hora (opcional)", `<input type="time" class="input" id="scTime" value="${esc(hhmm(p?.time))}">`, "scTime")}`, {
    mount: root => {
      const sync = () => { $("#scRoutineF", root).classList.toggle("hidden", kind !== "gym"); $("#scLabelF", root).classList.toggle("hidden", kind !== "otro"); };
      bindSeg(root, "[data-k]", b => { kind = b.dataset.k; sync(); }); sync();
    },
    onSubmit: async root => {
      await save("fit_schedule", { weekday: +val(root, "scDay"), kind, routine_id: kind === "gym" ? (val(root, "scRoutine") || null) : null,
        label: kind === "otro" ? (val(root, "scLabel") || null) : null, time: val(root, "scTime") || null }, p?.id);
      toast("Plan guardado");
    },
    onDelete: p ? () => remove("fit_schedule", p.id) : null
  });
}

/* ---------- Rutinas ---------- */
ACT.newRoutine = () => openRoutineMeta(null);
ACT.editRoutineMeta = (el, d) => openRoutineMeta(byId("fit_routines", d.id));
function openRoutineMeta(r) {
  let color = r?.color || "verde";
  formSheet(r ? "Editar rutina" : "Nueva rutina", `
    ${field("Nombre", inp("rName", r?.name, 'placeholder="Por ejemplo: Día de culo" maxlength="80"'), "rName")}
    ${field("Color", colorChips(color))}${field("Notas", area("rNotes", r?.notes), "rNotes")}`, {
    mount: root => { bindChips(root, c => color = c); if (!r) setTimeout(() => $("#rName", root).focus(), 280); },
    onSubmit: async root => {
      const name = val(root, "rName"); if (!name) return "Ponle nombre a la rutina.";
      const saved = await save("fit_routines", { name, color, notes: val(root, "rNotes") || null, position: r?.position ?? S.d.fit_routines.length }, r?.id);
      if (!r) setTimeout(() => go("entreno", "rutina", saved.id));
      toast("Rutina guardada");
    },
    onDelete: r ? async () => { await remove("fit_routines", r.id); setTimeout(() => go("entreno", "rutinas")); } : null,
    deleteLabel: "Eliminar rutina"
  });
}
ACT.addRex = (el, d) => pickExercise(async exId => {
  const items = rexOf(d.id);
  try { await save("fit_routine_exercises", { routine_id: d.id, exercise_id: exId, position: items.length ? items[items.length - 1].position + 1 : 0, target_sets: 3, target_reps: "10", rest_sec: 90 }); render(); }
  catch (x) { toast(errMsg(x), true); }
});
ACT.moveRex = async (el, d) => {
  const x = byId("fit_routine_exercises", d.id), items = rexOf(x.routine_id), i = items.indexOf(x), j = i + Number(d.dir);
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  items.forEach((it, k) => it.position = k); render();
  try { await Promise.all([save("fit_routine_exercises", { position: i }, items[i].id), save("fit_routine_exercises", { position: j }, items[j].id)]); }
  catch (e) { toast(errMsg(e), true); loadAll(); }
};
ACT.editRex = (el, d) => {
  const x = byId("fit_routine_exercises", d.id), ex = byId("fit_exercises", x.exercise_id);
  formSheet(ex?.name || "Ejercicio", `
    <div class="two-eq">${field("Series", numInp("xSets", x.target_sets), "xSets")}${field("Repeticiones", inp("xReps", x.target_reps, 'placeholder="10 o 8-12"'), "xReps")}</div>
    <div class="two-eq">${field("Peso objetivo (kg)", numInp("xW", fmtIn(x.target_weight), "opcional"), "xW")}${field("Descanso (s)", numInp("xRest", x.rest_sec), "xRest")}</div>
    ${field("Notas", area("xNotes", x.notes), "xNotes")}`, {
    onSubmit: async root => {
      const sets = Math.round(num(val(root, "xSets")) || 0); if (sets < 1 || sets > 20) return "Pon entre 1 y 20 series.";
      await save("fit_routine_exercises", { target_sets: sets, target_reps: val(root, "xReps") || null, target_weight: num(val(root, "xW")), rest_sec: Math.round(num(val(root, "xRest")) || 90), notes: val(root, "xNotes") || null }, x.id);
    },
    onDelete: () => remove("fit_routine_exercises", x.id), deleteLabel: "Quitar de la rutina"
  });
};

/* ---------- Selector de ejercicios ---------- */
function pickExercise(cb) {
  let q = "", muscle = "";
  const listHtml = () => {
    const items = exercisesSorted().filter(e => (!muscle || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q)));
    let cur = "", h = "";
    items.forEach(e => { if (e.muscle !== cur) { cur = e.muscle; h += `<div class="group-h">${esc(cur)}</div>`; } h += `<button class="pick" data-pick="${e.id}">${esc(e.name)}${primOf(e).length ? `<small>${esc(primOf(e).join(", "))}${secOf(e).length ? ` · también ${esc(secOf(e).join(", ").toLowerCase())}` : ""}</small>` : ""}</button>`; });
    return h || `<div class="empty">No hay ejercicios con ese nombre. Puedes crearlo abajo.</div>`;
  };
  openSheet(`${sheetHead("Elegir ejercicio")}
    <input class="input" id="pkQ" placeholder="Buscar ejercicio" autocomplete="off" style="margin-bottom:10px">
    <div class="mfilter">${["", ...MUSCLES].map(m => `<button type="button" data-m="${esc(m)}" aria-pressed="${m === ""}">${m || "Todos"}</button>`).join("")}</div>
    <div id="pkList">${listHtml()}</div>
    <button class="btn soft" id="pkNew" style="margin-top:12px">Crear ejercicio nuevo</button>`, root => {
    const upd = () => $("#pkList", root).innerHTML = listHtml();
    $("#pkQ", root).addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); upd(); });
    bindSeg(root, "[data-m]", b => { muscle = b.dataset.m; upd(); });
    $("#pkList", root).addEventListener("click", e => { const b = e.target.closest("[data-pick]"); if (b) { closeSheet(); cb(b.dataset.pick); } });
    $("#pkNew", root).addEventListener("click", () => newExercise(q, muscle, cb));
  });
}
const muscleChipsSel = (id, sel) => `<div class="cat-pills" id="${id}">${DETAIL_MUSCLES.map(m => `<button type="button" data-mm="${esc(m)}" aria-pressed="${sel.includes(m)}">${esc(m)}</button>`).join("")}</div>`;
const readChips = (root, id) => $$(`#${id} [data-mm]`, root).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.mm);
function bindToggleChips(root) { $$("[data-mm]", root).forEach(b => b.addEventListener("click", () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"))); }
function newExercise(name, muscle, cb) { openExercise(null, name, muscle, cb); }
function openExercise(ex, name, muscle, cb) {
  formSheet(ex ? "Editar ejercicio" : "Nuevo ejercicio", `${field("Nombre", inp("neName", ex?.name ?? name ?? ""), "neName")}
    ${field("Grupo", sel("neMuscle", MUSCLES.map(m => [m, m]), ex?.muscle || muscle || "Glúteo"), "neMuscle")}
    <div class="field"><span class="lbl">Músculos principales</span>${muscleChipsSel("nePri", primOf(ex))}</div>
    <div class="field"><span class="lbl">Músculos secundarios</span>${muscleChipsSel("neSec", secOf(ex))}</div>
    <p class="hint">Los principales cuentan como una serie completa; los secundarios, como media serie.</p>`, {
    submit: ex ? "Guardar" : "Crear y añadir",
    mount: bindToggleChips,
    onSubmit: async root => {
      const n = val(root, "neName"); if (!n) return "Escribe el nombre del ejercicio.";
      const pri = readChips(root, "nePri"), sec = readChips(root, "neSec").filter(m => !pri.includes(m));
      const saved = await save("fit_exercises", { name: n, muscle: val(root, "neMuscle"), primary_muscles: pri, secondary_muscles: sec }, ex?.id);
      if (cb) setTimeout(() => cb(saved.id)); else toast("Ejercicio guardado");
    },
    onDelete: ex ? () => save("fit_exercises", { archived: true }, ex.id) : null, deleteLabel: "Quitar de la biblioteca"
  });
}
ACT.editExercise = (el, d) => openExercise(byId("fit_exercises", d.id));

/* ---------- Temporizador de descanso ---------- */
let restEnd = 0, restTimer = null;
function startRest(secs) {
  restEnd = Date.now() + secs * 1000;
  $("#rest").classList.remove("hidden");
  clearInterval(restTimer); restTimer = setInterval(tickRest, 250); tickRest();
}
function stopRest() { clearInterval(restTimer); restTimer = null; $("#rest").classList.add("hidden"); }
function tickRest() {
  const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000));
  $("#restTime").textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
  if (left <= 0) { stopRest(); toast("Descanso terminado: a por la siguiente serie"); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (_) {} }
}
ACT.restAdd = (el, d) => { restEnd += Number(d.v) * 1000; tickRest(); };
ACT.restSkip = () => stopRest();
