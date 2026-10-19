"use strict";
/* =====================================================================
   Entreno · Músculos: mapa del cuerpo y evaluación del entreno
   ===================================================================== */
S.ui.muscleMode = null;   // "real" (últimas 4 semanas) o "plan"

/* Zonas del mapa. Coordenadas del lado derecho (x desde el centro), se reflejan al otro lado. */
const BODY_SIL = [
  [[0, 56], [12, 56], [16, 60], [38, 64], [46, 72], [44, 96], [36, 150], [40, 180], [38, 196], [0, 200]],
  [[40, 66], [50, 70], [56, 96], [57, 138], [48, 140], [43, 110], [42, 92]],
  [[48, 140], [57, 138], [63, 170], [64, 200], [58, 206], [53, 200], [50, 170]],
  [[2, 196], [38, 190], [36, 240], [30, 272], [30, 300], [26, 340], [24, 352], [12, 352], [12, 330], [8, 300], [10, 272], [6, 240], [2, 210]]
];
const ZONES_FRONT = {
  "Trapecio superior": [[12, 57], [28, 63], [16, 65]],
  "Deltoides anterior": [[30, 65], [41, 66], [47, 76], [44, 90], [36, 80]],
  "Deltoides lateral": [[42, 66], [50, 72], [53, 86], [47, 92], [46, 78]],
  "Pectoral superior": [[3, 68], [28, 66], [36, 78], [20, 80], [3, 78]],
  "Pectoral mayor": [[3, 80], [20, 82], [36, 82], [34, 100], [20, 106], [3, 104]],
  "Bíceps": [[44, 92], [52, 96], [55, 128], [50, 137], [45, 126]],
  "Braquiorradial": [[52, 143], [59, 145], [62, 186], [57, 194], [53, 172]],
  "Recto abdominal": [[2, 108], [14, 108], [14, 160], [2, 166]],
  "Oblicuos": [[16, 110], [36, 104], [33, 150], [31, 166], [16, 160]],
  "Abductores": [[33, 172], [39, 178], [37, 204], [32, 196]],
  "Cuádriceps": [[11, 197], [32, 187], [33, 238], [27, 266], [17, 266], [11, 230]],
  "Aductores": [[3, 200], [10, 199], [12, 236], [6, 242], [3, 216]]
};
const ZONES_BACK = {
  "Trapecio superior": [[0, 55], [12, 56], [36, 65], [14, 70], [0, 72]],
  "Trapecio medio y romboides": [[0, 73], [14, 71], [26, 77], [18, 100], [0, 110]],
  "Deltoides posterior": [[36, 66], [46, 70], [50, 84], [42, 88], [34, 76]],
  "Deltoides lateral": [[46, 71], [52, 77], [53, 88], [50, 85]],
  "Manguito rotador": [[19, 80], [32, 78], [34, 92], [22, 98]],
  "Dorsal ancho": [[17, 101], [34, 93], [41, 104], [35, 138], [15, 150], [9, 130]],
  "Erectores espinales": [[2, 113], [10, 113], [12, 166], [3, 169]],
  "Tríceps": [[44, 90], [54, 94], [56, 128], [50, 138], [44, 124]],
  "Antebrazo": [[52, 143], [59, 145], [62, 186], [57, 194], [53, 172]],
  "Glúteo medio": [[14, 168], [35, 166], [39, 182], [26, 184], [12, 178]],
  "Glúteo mayor": [[2, 177], [26, 185], [37, 187], [35, 207], [18, 213], [2, 207]],
  "Isquiotibiales": [[8, 215], [32, 209], [31, 250], [25, 268], [14, 268], [8, 240]],
  "Gemelos": [[10, 279], [27, 277], [28, 300], [22, 318], [14, 318], [10, 300]],
  "Sóleo": [[12, 319], [24, 319], [22, 338], [14, 338]]
};
const ZONE_ALIAS = { "Braquial": "Bíceps", "Transverso abdominal": "Recto abdominal" };

function heatColor(v, max) {
  if (!v) return "var(--sunk)";
  const t = Math.min(1, v / Math.max(max, 1));
  return `color-mix(in srgb, var(--primary) ${Math.round(22 + t * 78)}%, var(--sunk))`;
}
function bodyFigure(cx, zones, vals, max, label) {
  const pt = (p, side) => `${(cx + side * p[0]).toFixed(1)},${p[1]}`;
  const poly = (pts, side, attrs) => `<polygon points="${pts.map(p => pt(p, side)).join(" ")}" ${attrs}/>`;
  let g = `<circle cx="${cx}" cy="32" r="17" fill="var(--sunk)" stroke="var(--line)"/><rect x="${cx - 8}" y="46" width="16" height="12" rx="4" fill="var(--sunk)"/>`;
  BODY_SIL.forEach(s => [1, -1].forEach(side => g += poly(s, side, `fill="var(--sunk)" stroke="var(--line)" stroke-width="1"`)));
  g += `<circle cx="${cx + 61}" cy="212" r="6" fill="var(--sunk)" stroke="var(--line)"/><circle cx="${cx - 61}" cy="212" r="6" fill="var(--sunk)" stroke="var(--line)"/>`;
  Object.entries(zones).forEach(([m, pts]) => {
    const v = vals[m] || 0, fill = heatColor(v, max);
    [1, -1].forEach(side => g += poly(pts, side, `fill="${fill}" stroke="var(--bg)" stroke-width="1.2" data-act="muscleInfo" data-m="${esc(m)}" data-v="${v}" style="cursor:pointer"`));
  });
  return g + `<text x="${cx}" y="372" text-anchor="middle" class="cx">${label}</text>`;
}
function zoneValues(det) {
  const v = {};
  Object.entries(det).forEach(([m, n]) => { if (m.startsWith("~")) return; const z = ZONE_ALIAS[m] || m; v[z] = (v[z] || 0) + n; });
  return v;
}

/* ---------- Datos: últimas 4 semanas o plan ---------- */
function muscleData(mode) {
  if (mode === "plan") return { det: planDetailSets(), weeks: 1 };
  const to = todayKey(), from = keyOf(addDays(new Date(), -27));
  const det = detailSets(from, to), out = {};
  Object.entries(det).forEach(([m, n]) => out[m] = n / 4);
  return { det: out, weeks: 4 };
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
const EVAL_GROUPS = [["Glúteos", 10, 20], ["Cuádriceps", 8, 20], ["Isquiotibiales", 8, 16], ["Aductores", 4, 12], ["Gemelos", 4, 12], ["Pecho", 8, 20],
  ["Espalda", 10, 20], ["Hombros", 8, 20], ["Bíceps", 6, 16], ["Tríceps", 6, 16], ["Core", 4, 16], ["Zona lumbar", 3, 10]];
function evaluate(mode) {
  const { det } = muscleData(mode), groups = toGroups(det), good = [], improve = [], rows = [];
  EVAL_GROUPS.forEach(([g, lo, hi]) => {
    const n = groups[g] || 0;
    const st = n < lo * 0.5 ? "muy-bajo" : n < lo ? "bajo" : n <= hi ? "ok" : "alto";
    rows.push({ g, n, lo, hi, st });
  });
  const okRows = rows.filter(r => r.st === "ok"), low = rows.filter(r => r.st === "muy-bajo" || r.st === "bajo"), high = rows.filter(r => r.st === "alto");
  if (okRows.length) good.push(`Trabajas en un rango adecuado: ${okRows.map(r => r.g.toLowerCase()).join(", ")}.`);
  low.forEach(r => improve.push(`${r.g}: unas ${fmtNum(r.n, 0)} series a la semana. Para ganar músculo suele recomendarse empezar en ${r.lo} o más.`));
  high.forEach(r => improve.push(`${r.g}: unas ${fmtNum(r.n, 0)} series a la semana, por encima de ${r.hi}. Si notas que no te recuperas bien, reduce un poco.`));
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
    ["Glúteos", "Cuádriceps", "Espalda", "Pecho"].forEach(g => { const f = trainingDaysPerWeek(g); if (G(g) >= 6 && f > 0 && f < 1.5) improve.push(`${g}: los entrenas unos ${fmtNum(f, 1)} días por semana. Repartir las series en 2 días suele dar mejores resultados.`); });
    const planned = S.d.fit_schedule.filter(p => p.kind === "gym").length * 4;
    const done = S.d.fit_sessions.filter(s => s.kind === "gym" && s.finished && s.date >= keyOf(addDays(new Date(), -27))).length;
    if (planned) { const pct = done / planned * 100; (pct >= 80 ? good : improve).push(pct >= 80 ? `Constancia: has hecho ${done} de unos ${planned} entrenos planificados en 4 semanas.` : `Constancia: ${done} de unos ${planned} entrenos planificados en 4 semanas. La regularidad es lo que más influye en el progreso.`); }
    const prog = progressionCheck();
    if (prog.up.length) good.push(`Progresas en ${prog.up.slice(0, 4).join(", ")}.`);
    if (prog.flat.length) improve.push(`Estancado en las últimas semanas: ${prog.flat.slice(0, 4).join(", ")}. Prueba a subir 1 o 2 repeticiones o un poco de peso.`);
  }
  const score = Math.round(okRows.length / EVAL_GROUPS.length * 100);
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
  const sorted = Object.entries(vals).filter(([m]) => DETAIL_MUSCLES.includes(m) || ZONES_FRONT[m] || ZONES_BACK[m]).sort((a, b) => b[1] - a[1]);
  const notWorked = DETAIL_MUSCLES.filter(m => !ZONE_ALIAS[m] && !(vals[m] > 0));
  const empty = !sorted.length;
  let h = `<div class="seg-scroll"><button data-act="muscleMode" data-v="real" aria-pressed="${mode === "real"}">Lo que has hecho (4 semanas)</button>
    <button data-act="muscleMode" data-v="plan" aria-pressed="${mode === "plan"}">Según tu plan</button></div>`;
  h += `<p class="lead">${mode === "plan" ? "Series por semana que suman las rutinas asignadas en tu plan semanal." : "Media de series por semana de las últimas 4 semanas."} Toca un músculo para ver el detalle.</p>`;
  if (empty) h += `<div class="empty">${mode === "plan" ? "Asigna rutinas a los días de tu plan semanal para ver qué músculos trabajarías." : "Aún no hay entrenos en las últimas 4 semanas. Mira la vista según tu plan."}</div>`;
  h += `<svg class="body-map" viewBox="0 0 360 380" role="img" aria-label="Mapa de músculos trabajados">${bodyFigure(90, ZONES_FRONT, vals, max, "Delante")}${bodyFigure(270, ZONES_BACK, vals, max, "Detrás")}</svg>
    <div class="heat-legend"><span>Nada</span><i style="background:var(--sunk)"></i><i style="background:${heatColor(max * .25, max)}"></i><i style="background:${heatColor(max * .6, max)}"></i><i style="background:${heatColor(max, max)}"></i><span>Mucho</span></div>`;
  if (!empty) {
    h += `<div class="block" style="margin-top:20px"><h2>Más trabajados</h2>${muscleList(sorted.slice(0, 6))}</div>`;
    if (notWorked.length) h += `<div class="block"><h2>Poco o nada trabajados</h2><div class="mchips">${notWorked.map(m => `<span>${esc(m)}</span>`).join("")}</div></div>`;
    h += `<div class="block"><h2>Evaluación de tu entreno</h2>
      <div class="eval-score"><b>${ev.score}</b><span>de 100<br>grupos musculares en un rango adecuado</span></div>
      ${ev.good.length ? `<div class="eval-box good"><b>Lo que va bien</b>${ev.good.map(t => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      ${ev.improve.length ? `<div class="eval-box warn"><b>A mejorar</b>${ev.improve.map(t => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
      <div class="group-h">Series por grupo y rango orientativo</div>
      <div class="eval-table">${ev.rows.map(r => `<div class="er ${r.st}"><span>${esc(r.g)}</span><b>${fmtNum(r.n, 1)}</b><small>${r.lo}-${r.hi}</small><i>${{ "muy-bajo": "Muy poco", bajo: "Poco", ok: "Bien", alto: "Mucho" }[r.st]}</i></div>`).join("")}</div>
      <p class="hint">Rangos orientativos de series semanales para ganar músculo. Si tu objetivo es otro (por ejemplo, centrarte en glúteos), es normal y está bien que unos grupos queden por debajo. No sustituye la valoración de un entrenador.</p>
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
