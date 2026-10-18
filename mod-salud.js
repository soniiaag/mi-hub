"use strict";
/* =====================================================================
   Salud: perfil, mediciones de la báscula y cálculos
   ===================================================================== */
const profile = () => S.d.user_profile[0] || null;
async function saveProfile(patch) { const p = profile(); return save("user_profile", patch, p?.id); }
function ageAt(birth, dateKey) {
  if (!birth) return null;
  const b = fromKey(birth), d = dateKey ? fromKey(dateKey) : new Date();
  let a = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--;
  return a;
}
const measurementsAsc = () => [...S.d.body_measurements].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
const latestMeasurement = () => { const m = measurementsAsc(); return m[m.length - 1] || null; };
function latestWith(k) { const m = measurementsAsc().filter(x => mval(x, k) !== null); return m[m.length - 1] || null; }

/* ---------- Cálculos ---------- */
const H = () => (profile()?.height_cm || 0) / 100;
const isW = () => (profile()?.sex || "mujer") === "mujer";
function calc(m, k) {
  const w = m.weight_kg, h = H(), bf = m.body_fat_pct;
  switch (k) {
    case "bmi": return w && h ? w / (h * h) : null;
    case "fat_mass_kg": return w && bf != null ? w * bf / 100 : null;
    case "fat_free_mass_kg": { const fm = mval(m, "fat_mass_kg"); return w && fm != null ? w - fm : null; }
    case "protein_kg": return w && m.protein_pct != null ? w * m.protein_pct / 100 : null;
    case "water_kg": return w && m.water_pct != null ? w * m.water_pct / 100 : null;
    case "standard_weight": return h ? 22 * h * h : null;
    case "obesity_pct": { const sw = mval(m, "standard_weight"); return w && sw ? (w - sw) / sw * 100 : null; }
    case "bmr": {
      const ffm = mval(m, "fat_free_mass_kg");
      if (ffm) return 370 + 21.6 * ffm;                                   // Katch-McArdle
      const p = profile(), age = ageAt(p?.birth_date, m.date);
      if (w && h && age != null) return 10 * w + 625 * h - 5 * age + (isW() ? -161 : 5);  // Mifflin-St Jeor
      return null;
    }
  }
  return null;
}
function mval(m, k) {
  if (!m) return null;
  if (m[k] !== null && m[k] !== undefined && m[k] !== "") return Number(m[k]);
  return calc(m, k);
}
const isCalculated = (m, k) => (m[k] === null || m[k] === undefined) && calc(m, k) !== null;

function bmiLabel(v) { return v == null ? "" : v < 18.5 ? "Bajo peso" : v < 25 ? "Normal" : v < 30 ? "Sobrepeso" : "Obesidad"; }
function obesityLabel(v) { return v == null ? "" : v < -10 ? "Peso bajo" : v <= 10 ? "Normal" : v <= 20 ? "Sobrepeso" : "Obesidad"; }
function bodyType(m) {
  if (m.body_type) return m.body_type;
  const bf = m.body_fat_pct, ffm = mval(m, "fat_free_mass_kg"), h = H();
  if (bf == null || !ffm || !h) return null;
  const ffmi = ffm / (h * h);
  const fat = isW() ? (bf < 21 ? 0 : bf < 32 ? 1 : 2) : (bf < 8 ? 0 : bf < 25 ? 1 : 2);
  const mus = isW() ? (ffmi < 14.5 ? 0 : ffmi <= 17 ? 1 : 2) : (ffmi < 18 ? 0 : ffmi <= 20 ? 1 : 2);
  return [["Delgado", "Delgado musculado", "Atlético"], ["Falta de ejercicio", "Estándar", "Musculoso"], ["Obesidad oculta", "Sobrepeso", "Robusto"]][fat][mus];
}

const METRICS = [
  { k: "weight_kg", l: "Peso", u: "kg", d: 1 },
  { k: "bmi", l: "IMC", u: "", d: 1, lab: bmiLabel },
  { k: "body_fat_pct", l: "Grasa corporal", u: "%", d: 1 },
  { k: "fat_mass_kg", l: "Masa grasa", u: "kg", d: 1 },
  { k: "fat_free_mass_kg", l: "Masa libre de grasa", u: "kg", d: 1 },
  { k: "muscle_mass_kg", l: "Masa muscular", u: "kg", d: 1 },
  { k: "skeletal_muscle_pct", l: "Músculo esquelético", u: "%", d: 1 },
  { k: "protein_pct", l: "Proteína", u: "%", d: 1 },
  { k: "protein_kg", l: "Cantidad de proteína", u: "kg", d: 1 },
  { k: "water_pct", l: "Agua corporal", u: "%", d: 1 },
  { k: "water_kg", l: "Cantidad de agua", u: "kg", d: 1 },
  { k: "subcutaneous_fat_pct", l: "Grasa subcutánea", u: "%", d: 1 },
  { k: "visceral_fat", l: "Grasa visceral", u: "", d: 0 },
  { k: "bone_mass_kg", l: "Masa ósea", u: "kg", d: 1 },
  { k: "bmr", l: "Metabolismo basal", u: "kcal", d: 0 },
  { k: "metabolic_age", l: "Edad metabólica", u: "años", d: 0 },
  { k: "standard_weight", l: "Peso estándar", u: "kg", d: 1 },
  { k: "obesity_pct", l: "Nivel de obesidad", u: "%", d: 1, lab: obesityLabel }
];
const CALCULABLE = new Set(["bmi", "fat_mass_kg", "fat_free_mass_kg", "protein_kg", "water_kg", "standard_weight", "obesity_pct", "bmr"]);
const fmtMetric = (mt, v) => v == null ? "–" : `${fmtNum(v, mt.d)}${mt.u ? (mt.u === "%" ? " %" : " " + mt.u) : ""}`;

/* =====================================================================
   Vistas
   ===================================================================== */
MOD.salud = {
  render(r) {
    if (r.sub === "metrica") return viewMetric(r.id);
    const sub = r.sub || "resumen";
    return modHead("Salud") + subnav("salud", [["resumen", "Resumen"], ["historial", "Historial"]], sub) + (sub === "historial" ? viewMeasHistory() : viewHealthSummary());
  },
  fab: r => r.sub === "metrica" ? null : { label: "Añadir medición", fn: () => openMeasurement(null) }
};

function profileLine() {
  const p = profile();
  if (!p || !p.height_cm || !p.birth_date || !p.sex) return `<div class="callout soft-call"><div><b>Completa tu perfil</b><span>Con tu altura, sexo y fecha de nacimiento calculo el IMC, el metabolismo basal y el resto de datos.</span></div>
    <button class="btn-sm primary" data-act="editProfile">Completar</button></div>`;
  return `<div class="prof-line"><span>${esc(cap(p.sex))}, ${ageAt(p.birth_date)} años, ${fmtNum(p.height_cm, 0)} cm</span><button class="link-btn" data-act="editProfile">Editar perfil</button></div>`;
}

function viewHealthSummary() {
  const all = measurementsAsc(), m = all[all.length - 1];
  let h = profileLine();
  if (!m) return h + `<div class="empty">Aún no hay mediciones. Pésate con la báscula y copia aquí los datos de FitDays. <button data-act="newMeasurement">Añadir medición</button></div>`;
  const prev = all[all.length - 2];
  const bt = bodyType(m);
  h += `<div class="meas-head"><div><span>Última medición</span><b>${esc(niceDate(m.date))}</b></div>${bt ? `<div><span>Tipo de cuerpo</span><b>${esc(bt)}</b></div>` : ""}</div>
  <div class="metric-grid">${METRICS.map(mt => {
    const v = mval(m, mt.k); if (v == null) return "";
    const pv = prev ? mval(prev, mt.k) : null, diff = pv != null ? v - pv : null;
    return `<button class="metric" data-go="salud/metrica/${mt.k}">
      <span class="m-l">${esc(mt.l)}${isCalculated(m, mt.k) ? ` <i title="Calculado">calc.</i>` : ""}</span>
      <span class="m-v">${esc(fmtMetric(mt, v))}</span>
      <span class="m-s">${mt.lab ? esc(mt.lab(v)) : diff != null && Math.abs(diff) >= Math.pow(10, -mt.d) / 2 ? `${diff > 0 ? "+" : "−"}${fmtNum(Math.abs(diff), mt.d)} desde la anterior` : prev ? "Sin cambios" : ""}</span>
    </button>`;
  }).join("")}</div>
  <p class="hint">"calc." indica que el dato lo ha calculado la app con tu peso, tu perfil y el resto de valores. Si la báscula te da ese dato, apúntalo y se usará el tuyo. Los cálculos son orientativos.</p>`;
  return h;
}

function viewMetric(k) {
  const mt = METRICS.find(x => x.k === k);
  if (!mt) return modHead("Salud", ["salud", "resumen", "Salud"]);
  const list = measurementsAsc().filter(m => mval(m, k) != null);
  const pts = list.map(m => ({ x: fromKey(m.date).getTime(), y: mval(m, k) }));
  const first = list[0], last = list[list.length - 1];
  return modHead(mt.l, ["salud", "resumen", "Salud"]) +
    (last ? `<div class="nw small"><span>Actual</span><b>${esc(fmtMetric(mt, mval(last, k)))}</b></div>` : "") +
    (first && last && first !== last ? `<p class="lead">Desde el ${esc(fmt(fromKey(first.date), { day: "numeric", month: "long", year: "numeric" }))}: ${(() => { const d = mval(last, k) - mval(first, k); return `${d >= 0 ? "+" : "−"}${fmtNum(Math.abs(d), mt.d)}${mt.u === "%" ? " puntos" : mt.u ? " " + mt.u : ""}`; })()}</p>` : "") +
    `<div class="block">${lineChart(pts, { fy: v => fmtMetric(mt, v) })}</div>
    <div class="block"><h2>Registros</h2>${list.length ? `<div class="list">${[...list].reverse().map(m => `<button class="row" data-act="editMeasurement" data-id="${m.id}">
      <span class="body"><span class="title">${esc(fmtMetric(mt, mval(m, k)))}</span><span class="meta">${esc(niceDate(m.date))}${isCalculated(m, k) ? ", calculado" : ""}</span></span></button>`).join("")}</div>` : `<div class="empty">Sin registros.</div>`}</div>`;
}

function viewMeasHistory() {
  const list = measurementsAsc().reverse();
  if (!list.length) return `<div class="empty">Aún no hay mediciones.</div>`;
  return `<div class="list">${list.map(m => `<button class="row" data-act="editMeasurement" data-id="${m.id}">
    <span class="body"><span class="title">${esc(niceDate(m.date))}</span>
    <span class="meta">${esc([m.weight_kg != null ? fmtNum(m.weight_kg) + " kg" : "", m.body_fat_pct != null ? fmtNum(m.body_fat_pct) + " % grasa" : "", m.muscle_mass_kg != null ? fmtNum(m.muscle_mass_kg) + " kg músculo" : ""].filter(Boolean).join(", "))}</span></span></button>`).join("")}</div>`;
}

/* =====================================================================
   Formularios
   ===================================================================== */
ACT.editProfile = () => openProfile();
function openProfile(after) {
  const p = profile() || {};
  formSheet("Tu perfil", `
    <div class="field"><span class="lbl">Sexo</span><div class="segfull two-only" role="group">
      <button type="button" data-sx="mujer" aria-pressed="${(p.sex || "mujer") === "mujer"}">Mujer</button><button type="button" data-sx="hombre" aria-pressed="${p.sex === "hombre"}">Hombre</button></div></div>
    <div class="two-eq">${field("Altura (cm)", numInp("pfH", fmtIn(p.height_cm), "165"), "pfH")}${field("Fecha de nacimiento", `<input type="date" class="input" id="pfB" value="${esc(p.birth_date || "")}">`, "pfB")}</div>
    <p class="hint">Se usa para calcular el IMC, el metabolismo basal, el peso estándar y tus objetivos de dieta.</p>`, {
    mount: root => { root.dataset.sx = p.sex || "mujer"; bindSeg(root, "[data-sx]", b => root.dataset.sx = b.dataset.sx); },
    onSubmit: async root => {
      const h = num(val(root, "pfH")); if (!h || h < 100 || h > 230) return "Escribe tu altura en centímetros.";
      if (!val(root, "pfB")) return "Elige tu fecha de nacimiento.";
      await saveProfile({ sex: root.dataset.sx, height_cm: h, birth_date: val(root, "pfB") }); toast("Perfil guardado");
      after && setTimeout(after);
    }
  });
}

ACT.newMeasurement = () => openMeasurement(null);
ACT.editMeasurement = (el, d) => openMeasurement(byId("body_measurements", d.id));
const MEAS_FORM = [
  ["Básicos", ["weight_kg", "body_fat_pct", "muscle_mass_kg", "visceral_fat"]],
  ["Composición", ["skeletal_muscle_pct", "protein_pct", "water_pct", "subcutaneous_fat_pct", "bone_mass_kg", "metabolic_age"]],
  ["Si la báscula te los da (si no, se calculan)", ["bmi", "fat_mass_kg", "fat_free_mass_kg", "protein_kg", "water_kg", "bmr", "standard_weight", "obesity_pct"]]
];
function openMeasurement(m) {
  const fieldsHtml = MEAS_FORM.map(([title, keys]) => `<div class="form-sec">${esc(title)}</div><div class="two-eq">${keys.map(k => {
    const mt = METRICS.find(x => x.k === k);
    return field(`${mt.l}${mt.u ? ` (${mt.u})` : ""}`, numInp("ms_" + k, fmtIn(m?.[k]), CALCULABLE.has(k) ? "auto" : ""), "ms_" + k);
  }).join("")}</div>`).join("");
  formSheet(m ? "Editar medición" : "Nueva medición", `
    ${field("Fecha", `<input type="date" class="input" id="msDate" value="${esc(m?.date || todayKey())}">`, "msDate")}
    ${fieldsHtml}
    ${field("Tipo de cuerpo (si la báscula lo indica)", inp("msType", m?.body_type || "", 'placeholder="Se calcula si lo dejas vacío"'), "msType")}
    ${field("Notas", area("msNotes", m?.notes), "msNotes")}
    <p class="hint">Copia los valores de FitDays. Solo el peso es necesario; el resto, los que tengas.</p>`, {
    submit: "Guardar medición",
    onSubmit: async root => {
      const row = { date: val(root, "msDate") || todayKey(), body_type: val(root, "msType") || null, notes: val(root, "msNotes") || null };
      MEAS_FORM.forEach(([, keys]) => keys.forEach(k => row[k] = num(val(root, "ms_" + k))));
      if (!row.weight_kg || row.weight_kg < 25 || row.weight_kg > 300) return "Escribe tu peso en kg.";
      for (const k of ["body_fat_pct", "skeletal_muscle_pct", "protein_pct", "water_pct", "subcutaneous_fat_pct"])
        if (row[k] != null && (row[k] < 0 || row[k] > 100)) return `${METRICS.find(x => x.k === k).l}: tiene que ser un porcentaje entre 0 y 100.`;
      await save("body_measurements", row, m?.id); toast("Medición guardada");
    },
    onDelete: m ? () => remove("body_measurements", m.id) : null
  });
}
