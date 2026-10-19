"use strict";
/* =====================================================================
   Entreno · Músculos: mapa del cuerpo y evaluación del entreno
   ===================================================================== */
S.ui.muscleMode = null;   // "real" (últimas 4 semanas) o "plan"

/* Mapa del cuerpo: formas anatómicas (lado derecho; el izquierdo se refleja) */
// Coordenadas: lado derecho de la figura (x >= 0 desde el eje central). Se refleja para el lado izquierdo.
const OUTLINE = "M0,12 C11,12 18,21 18,34 C18,47 14,56 10,61 L11,73 C22,79 36,81 48,85 C61,89 68,99 70,113 C72,130 72,146 74,164 C76,184 80,206 82,230 C83,244 85,256 84,266 C83,276 77,280 74,272 C72,262 72,250 70,238 C67,216 63,196 60,180 C58,168 56,158 55,150 C54,166 51,182 49,198 C48,210 50,220 53,232 C55,246 54,262 52,280 C50,300 46,318 44,334 C43,346 45,358 44,372 C43,390 39,404 38,416 C38,424 41,430 36,434 C30,437 22,437 16,434 C13,428 15,420 15,412 C14,396 12,380 12,362 C12,350 11,342 10,334 C8,312 6,290 5,268 L4,256 C2,252 1,250 0,250 Z";
const FRONT = {
  "Trapecio superior": "M9,72 C20,77 33,80 44,84 C34,87 22,87 12,83 C10,79 9,76 9,72 Z",
  "Deltoides anterior": "M46,88 C55,88 62,95 63,106 C63,116 60,124 56,128 C55,114 52,101 46,91 Z",
  "Deltoides lateral": "M55,86 C64,89 69,97 70,110 C70,119 68,124 66,126 C66,112 64,98 58,90 Z",
  "Pectoral superior": "M3,90 C16,86 32,86 44,92 C49,96 51,101 51,106 C38,105 20,105 3,107 Z",
  "Pectoral mayor": "M3,110 C20,108 38,108 51,110 C51,120 47,128 40,133 C30,138 15,137 3,133 Z",
  "Bíceps": "M57,132 C64,129 69,138 70,152 C71,164 68,173 64,176 C60,170 57,158 56,146 C56,140 56,135 57,132 Z",
  "Braquiorradial": "M63,183 C70,184 75,195 78,210 C80,224 80,238 79,246 C76,240 72,228 69,214 C66,202 64,192 63,183 Z",
  "Recto abdominal": "M3,141 L17,141 C18,147 18,152 17,157 L3,157 Z M3,160 L17,160 C18,166 18,171 17,176 L3,176 Z M3,179 L17,179 C18,185 18,190 17,195 L3,195 Z M3,198 L17,198 C17,208 15,218 12,226 C8,230 5,231 3,231 Z",
  "Oblicuos": "M21,140 C32,142 42,148 47,158 C48,176 47,194 44,210 C38,218 30,224 22,226 C22,206 23,190 22,174 C22,162 21,150 21,140 Z",
  "Abductores": "M47,216 C52,220 54,230 53,244 C52,250 50,254 48,256 C47,244 46,230 47,216 Z",
  "Cuádriceps": "M15,252 C24,245 38,240 47,246 C50,262 49,282 46,302 C44,316 40,326 34,330 C28,332 23,330 20,324 C16,308 14,282 15,252 Z",
  "Aductores": "M5,256 C9,254 12,258 13,266 C13,284 12,298 9,308 C7,296 5,278 5,256 Z",
  "Tibial": "M28,344 C34,346 38,354 38,366 C37,382 34,396 31,408 C29,396 27,380 26,366 C26,356 26,348 28,344 Z"
};
const BACK = {
  "Trapecio superior": "M0,64 C7,66 11,71 13,77 C25,81 37,84 47,88 C35,92 20,93 0,100 Z",
  "Trapecio medio y romboides": "M0,103 C14,99 28,98 38,101 C35,117 24,132 0,150 Z",
  "Deltoides posterior": "M49,90 C60,92 68,102 69,116 C64,121 57,120 51,115 C48,107 47,98 49,90 Z",
  "Manguito rotador": "M21,106 C31,103 41,105 46,110 C45,122 37,131 27,132 C22,124 20,114 21,106 Z",
  "Dorsal ancho": "M9,140 C24,132 40,124 52,121 C56,139 53,162 46,182 C35,192 20,196 10,194 C12,175 12,157 9,140 Z",
  "Erectores espinales": "M2,154 L9,154 C11,178 12,202 10,226 C7,229 4,230 2,230 Z",
  "Tríceps": "M58,126 C66,126 71,137 71,152 C71,164 67,174 62,176 C58,166 56,150 58,126 Z",
  "Antebrazo": "M63,183 C70,184 75,195 78,210 C80,224 80,238 79,246 C76,240 72,228 69,214 C66,202 64,192 63,183 Z",
  "Glúteo medio": "M16,212 C28,206 42,208 50,220 C51,229 45,234 35,233 C27,232 20,226 16,212 Z",
  "Glúteo mayor": "M3,236 C16,229 36,230 49,240 C56,252 54,270 44,281 C33,291 14,290 3,283 Z",
  "Isquiotibiales": "M7,292 C19,286 35,284 45,290 C45,310 42,328 37,338 C29,343 19,343 13,337 C9,321 7,306 7,292 Z",
  "Gemelos": "M13,350 C23,343 37,345 41,358 C42,373 38,387 32,394 C25,394 19,390 16,381 C13,371 12,360 13,350 Z",
  "Sóleo": "M17,396 C23,399 30,399 34,396 C34,406 32,414 30,419 L20,419 C18,411 17,403 17,396 Z"
};
function figure(cx, zones, colorOf, label, vals) {
  const side = (inner) => `<g transform="translate(${cx},0)">${inner}</g><g transform="translate(${cx},0) scale(-1,1)">${inner}</g>`;
  const open = OUTLINE.replace(/ L4,256 C2,252 1,250 0,250 Z$/, " L4,256 C2,252 1,250 0,250");
  let g = side(`<path d="${OUTLINE}" fill="var(--b-skin)" stroke="var(--b-skin)" stroke-width="1"/>`) + side(`<path d="${open}" fill="none" stroke="var(--b-edge)" stroke-width="1.2" stroke-linejoin="round"/>`);
  for (const [m, d] of Object.entries(zones)) g += side(`<path d="${d}" fill="${colorOf(m)}" data-act="muscleInfo" data-m="${esc(m)}" data-v="${vals[m] || 0}" style="cursor:pointer"/>`);
  return g + `<text x="${cx}" y="458" text-anchor="middle" class="cx">${label}</text>`;
}

const ZONE_ALIAS = { "Braquial": "Bíceps", "Transverso abdominal": "Recto abdominal" };
function heatColor(v, max) {
  if (!v) return "var(--b-muscle)";
  const t = Math.min(1, v / Math.max(max, 1));
  return `color-mix(in srgb, var(--heat-hi) ${Math.round(15 + t * 85)}%, var(--heat-lo))`;
}
function zoneValues(det) {
  const v = {};
  Object.entries(det).forEach(([m, n]) => { if (m.startsWith("~")) return; const z = ZONE_ALIAS[m] || m; v[z] = (v[z] || 0) + n; });
  return v;
}

/* ---------- Datos: últimas 4 semanas o plan ---------- */
function muscleData(mode) {
  if (mode === "plan") return { det: planDetailSets(), grp: planGroupSets(), weeks: 1 };
  const to = todayKey(), from = keyOf(addDays(new Date(), -27)), per4 = o => { const r = {}; Object.entries(o).forEach(([m, n]) => r[m] = n / 4); return r; };
  return { det: per4(detailSets(from, to)), grp: per4(groupSets(from, to)), weeks: 4 };
}
function trainingDaysPerWeek(group) {
  const from = keyOf(addDays(new Date(), -27)), days = new Set();
  const sess = {}; S.d.fit_sessions.filter(s => s.date >= from && s.finished).forEach(s => sess[s.id] = s.date);
  S.d.fit_sets.filter(x => x.done && sess[x.session_id]).forEach(x => {
    const ex = byId("fit_exercises", x.exercise_id);
    if (primOf(ex).some(m => MUSCLE_DETAIL[m] === group)) days.add(sess[x.session_id]);
  });
  return days.size / 4;
}

/* ---------- Evaluación ---------- */
/* Tu tabla de hipertrofia: series semanales [grupo, nombre, MV, MEV desde, MEV hasta, MAV desde, MAV hasta, MRV, frecuencia mínima] */
const VOL_GUIDE = [
  ["Cuádriceps", "Cuádriceps", 6, 8, 12, 12, 18, 20, 1.5], ["Isquiotibiales", "Isquios", 4, 6, 10, 10, 16, 20, 2],
  ["Glúteos", "Glúteos", 0, 0, 4, 4, 12, 16, 2], ["Pecho", "Pectoral", 8, 10, 12, 12, 20, 22, 2],
  ["Espalda", "Espalda", 8, 10, 14, 14, 22, 25, 2], ["Hombros", "Deltoides", 0, 6, 8, 16, 22, 26, 2],
  ["Bíceps", "Bíceps", 0, 8, 14, 14, 20, 26, 2], ["Tríceps", "Tríceps", 0, 6, 10, 10, 14, 18, 2],
  ["Trapecio", "Trapecio", 0, 1, 12, 12, 20, 26, 2], ["Gemelos", "Gemelos y sóleo", 0, 8, 12, 12, 16, 20, 2],
  ["Core", "Core", 0, 1, 15, 16, 20, 25, 2]
];
const VOL_LABEL = { nada: "Nada", bajo: "Bajo MEV", mev: "MEV", mav: "MAV", alto: "Hacia MRV", pasado: "Pasa MRV" };
function evaluate(mode) {
  const { det, grp } = muscleData(mode), groups = grp, good = [], improve = [], rows = [];
  VOL_GUIDE.forEach(([g, name, mv, mevLo, mevHi, mavLo, mavHi, mrv, freq]) => {
    const n = Math.round((groups[g] || 0) * 10) / 10;
    const st = n === 0 ? "nada" : n < mevLo ? "bajo" : n < mavLo ? "mev" : n <= mavHi ? "mav" : n < mrv ? "alto" : "pasado";
    rows.push({ g, name, n, mevLo, mavLo, mavHi, mrv, freq, st, ok: n >= mevLo && n < mrv && n > 0 });
  });
  const okRows = rows.filter(r => r.ok), low = rows.filter(r => r.st === "bajo" || r.st === "nada"), high = rows.filter(r => r.st === "pasado");
  if (okRows.length) good.push(`Entre el MEV y el MRV: ${okRows.map(r => r.name.toLowerCase()).join(", ")}.`);
  const inMav = rows.filter(r => r.st === "mav"); if (inMav.length) good.push(`En la zona MAV, la de mejor respuesta: ${inMav.map(r => r.name.toLowerCase()).join(", ")}.`);
  low.forEach(r => improve.push(r.n === 0 ? `${r.name}: no le dedicas series directas. Tu tabla marca un MEV desde ${r.mevLo}.` : `${r.name}: unas ${fmtNum(r.n, 1)} series a la semana, por debajo de su MEV (${r.mevLo}).`));
  high.forEach(r => improve.push(`${r.name}: unas ${fmtNum(r.n, 1)} series a la semana, en o por encima de su MRV (${r.mrv}). Te puede costar recuperarte; baja algo de volumen.`));
  const G = k => groups[k] || 0;
  const push = G("Pecho") + (det["Deltoides anterior"] || 0) + G("Tríceps"), pull = G("Espalda") + (det["Deltoides posterior"] || 0) + G("Bíceps");
  if (push + pull >= 6) {
    if (pull < push * 0.8) improve.push("Haces bastante más empuje que tirón. Añadir remos o jalones ayuda a la postura y protege los hombros.");
    else good.push("Buen equilibrio entre ejercicios de empuje y de tirón.");
  }
  if (G("Cuádriceps") >= 4) {
    if (G("Isquiotibiales") < G("Cuádriceps") * 0.6) improve.push("Los isquiotibiales se quedan cortos frente al cuádriceps. Un peso muerto rumano o un curl femoral lo compensan.");
    else good.push("Buena proporción entre cuádriceps e isquiotibiales.");
  }
  if (G("Glúteos") >= 6 && (det["Glúteo medio"] || 0) < 3) improve.push("Casi todo tu trabajo de glúteo va al glúteo mayor. Una abducción o paseo lateral con banda trabaja el glúteo medio.");
  if (G("Hombros") >= 4 && (det["Deltoides posterior"] || 0) < 3) improve.push("El deltoides posterior está poco trabajado. Pájaros o face pull, 2 o 3 series, son suficientes.");
  if (mode !== "plan") {
    rows.filter(r => r.n >= 4).forEach(r => { const f = trainingDaysPerWeek(r.g); if (f > 0 && f < r.freq - 0.25) improve.push(`${r.name}: lo entrenas unos ${fmtNum(f, 1)} días por semana; tu tabla recomienda ${fmtNum(r.freq, 1)} o más.`); });
    const planned = S.d.fit_schedule.filter(p => p.kind === "gym").length * 4;
    const done = S.d.fit_sessions.filter(s => s.kind === "gym" && s.finished && s.date >= keyOf(addDays(new Date(), -27))).length;
    if (planned) { const pct = done / planned * 100; (pct >= 80 ? good : improve).push(pct >= 80 ? `Constancia: has hecho ${done} de unos ${planned} entrenos planificados en 4 semanas.` : `Constancia: ${done} de unos ${planned} entrenos planificados en 4 semanas. La regularidad es lo que más influye en el progreso.`); }
    const prog = progressionCheck();
    if (prog.up.length) good.push(`Progresas en ${prog.up.slice(0, 4).join(", ")}.`);
    if (prog.flat.length) improve.push(`Estancado en las últimas semanas: ${prog.flat.slice(0, 4).join(", ")}. Prueba a subir 1 o 2 repeticiones o un poco de peso.`);
  }
  const score = Math.round(okRows.length / VOL_GUIDE.length * 100);
  return { rows, good, improve, score, det, groups };
}
function progressionCheck() {
  const from = keyOf(addDays(new Date(), -56)), sessDate = {}, up = [], flat = [];
  S.d.fit_sessions.filter(s => s.finished && s.date >= from).forEach(s => sessDate[s.id] = s.date);
  const byEx = {};
  S.d.fit_sets.filter(x => x.done && sessDate[x.session_id] && x.weight_kg).forEach(x => {
    const e1 = x.weight_kg * (1 + (x.reps || 0) / 30), d = sessDate[x.session_id];
    const m = (byEx[x.exercise_id] ||= { name: x.exercise_name, days: {} }); m.days[d] = Math.max(m.days[d] || 0, e1);
  });
  Object.values(byEx).forEach(m => {
    const pts = Object.entries(m.days).sort((a, b) => a[0].localeCompare(b[0])).map(p => p[1]);
    if (pts.length < 3) return;
    const half = Math.floor(pts.length / 2), a = Math.max(...pts.slice(0, half)), b = Math.max(...pts.slice(half));
    if (b > a * 1.02) up.push(m.name.toLowerCase()); else if (pts.length >= 4) flat.push(m.name.toLowerCase());
  });
  return { up, flat };
}

/* ---------- Vista ---------- */
function viewMuscles() {
  const hasHistory = S.d.fit_sessions.some(s => s.kind === "gym" && s.finished && s.date >= keyOf(addDays(new Date(), -27)));
  const mode = S.ui.muscleMode || (hasHistory ? "real" : "plan");
  const ev = evaluate(mode), vals = zoneValues(ev.det);
  const max = Math.max(12, ...Object.values(vals));
  const sorted = Object.entries(vals).filter(([m]) => DETAIL_MUSCLES.includes(m) || FRONT[m] || BACK[m]).sort((a, b) => b[1] - a[1]);
  const notWorked = DETAIL_MUSCLES.filter(m => !ZONE_ALIAS[m] && !(vals[m] > 0));
  const empty = !sorted.length;
  let h = `<div class="seg-scroll"><button data-act="muscleMode" data-v="real" aria-pressed="${mode === "real"}">Lo que has hecho (4 semanas)</button>
    <button data-act="muscleMode" data-v="plan" aria-pressed="${mode === "plan"}">Según tu plan</button></div>`;
  h += `<p class="lead">${mode === "plan" ? "Series por semana que suman las rutinas asignadas en tu plan semanal." : "Media de series por semana de las últimas 4 semanas."} Toca un músculo para ver el detalle.</p>`;
  if (empty) h += `<div class="empty">${mode === "plan" ? "Asigna rutinas a los días de tu plan semanal para ver qué músculos trabajarías." : "Aún no hay entrenos en las últimas 4 semanas. Mira la vista según tu plan."}</div>`;
  const colorOf = m => heatColor(vals[m] || 0, max);
  h += `<div class="body-card"><svg class="body-map" viewBox="0 0 400 470" role="img" aria-label="Mapa de músculos trabajados">${figure(100, FRONT, colorOf, "Delante", vals)}${figure(300, BACK, colorOf, "Detrás", vals)}</svg>
    <div class="heat-legend"><span>Nada</span><i style="background:var(--b-muscle)"></i><i style="background:${heatColor(max * .25, max)}"></i><i style="background:${heatColor(max * .6, max)}"></i><i style="background:${heatColor(max, max)}"></i><span>Mucho</span></div></div>`;
  if (!empty) {
    h += `<div class="block" style="margin-top:20px"><h2>Más trabajados</h2>${muscleList(sorted.slice(0, 6))}</div>`;
    if (notWorked.length) h += `<div class="block"><h2>Poco o nada trabajados</h2><div class="mchips">${notWorked.map(m => `<span>${esc(m)}</span>`).join("")}</div></div>`;
    h += `<div class="block"><h2>Evaluación de tu entreno</h2>
      <div class="eval-score"><b>${ev.rows.filter(r => r.ok).length}<small>/${ev.rows.length}</small></b><span>grupos musculares<br>entre su MEV y su MRV</span></div>
      ${ev.good.length ? `<div class="eval-box good"><b>Lo que va bien</b>${ev.good.map(t => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      ${ev.improve.length ? `<div class="eval-box warn"><b>A mejorar</b>${ev.improve.map(t => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      <div class="group-h">Series por semana frente a tu tabla</div>
      <div class="eval-table"><div class="er head"><span>Grupo</span><b>Series</b><small>MEV–MRV</small><i>Zona</i></div>
      ${ev.rows.map(r => `<div class="er ${r.st}"><span>${esc(r.name)}</span><b>${fmtNum(r.n, 1)}</b><small>${r.mevLo}–${r.mrv}</small><i>${VOL_LABEL[r.st]}</i></div>`).join("")}</div>
      <p class="hint">Rangos de tu tabla guía de hipertrofia: el mínimo es el inicio del MEV y el máximo el MRV. MAV es la zona de mejor respuesta. Las series de músculos secundarios cuentan como media serie.</p>
    </div>`;
  }
  return h;
}
function muscleList(list) {
  const max = Math.max(...list.map(x => x[1]), 1);
  return `<div class="mbars">${list.map(([m, n]) => `<div class="mbar wide"><span>${esc(m)}</span>${bar(n / max * 100)}<b>${fmtNum(n, 1)}</b></div>`).join("")}</div>`;
}
ACT.muscleMode = (el, d) => { S.ui.muscleMode = d.v; render(); };
ACT.muscleInfo = (el, d) => {
  const m = d.m, exs = exercisesSorted().filter(e => primOf(e).includes(m) || (ZONE_ALIAS.Braquial === m && primOf(e).includes("Braquial"))).map(e => e.name).slice(0, 4);
  toast(`${m}: ${fmtNum(+d.v, 1)} series por semana${exs.length ? `. Ejercicios: ${exs.join(", ")}` : ""}`);
};
