"use strict";
/* =====================================================================
   Dieta: objetivos, comidas del día, semana, plantilla, compra, alimentos
   ===================================================================== */
const SLOTS = [["desayuno", "Desayuno"], ["comida", "Comida"], ["merienda", "Merienda"], ["cena", "Cena"], ["snacks", "Snacks"]];
const FOOD_CATS = [["proteina", "Carne, pescado y huevos"], ["lacteo", "Lácteos"], ["carbohidrato", "Cereales, pan y tubérculos"], ["legumbre", "Legumbres"],
  ["verdura", "Verduras"], ["fruta", "Frutas"], ["grasa", "Aceites y frutos secos"], ["otros", "Otros"]];
const catName = c => (FOOD_CATS.find(x => x[0] === c) || [0, "Otros"])[1];
const ACTIVITY = [["sedentario", "Poco movimiento", "Trabajo sentada, menos de 5.000 pasos", 1.2], ["ligero", "Algo de movimiento", "5.000 a 8.000 pasos al día", 1.35],
  ["moderado", "Bastante movimiento", "8.000 a 11.000 pasos o trabajo de pie", 1.5], ["activo", "Mucho movimiento", "Más de 11.000 pasos o trabajo físico", 1.65]];
const GOALS = [["definicion", "Definición", "Perder grasa", .82, 2.0], ["recomposicion", "Recomposición", "Perder grasa y ganar músculo poco a poco", .93, 2.0],
  ["mantenimiento", "Mantenimiento", "Mantener tu peso", 1, 1.6], ["volumen", "Volumen", "Ganar músculo", 1.1, 1.8]];
const MET = { gym: 5, pilates: 3, otro: 4 };

/* Valores orientativos por 100 g: [nombre, categoría, kcal, proteína, hidratos, grasa, fibra, unidad, g/unidad] */
const FOOD_LIBRARY = [
  ["Pechuga de pollo", "proteina", 110, 23, 0, 1.5, 0], ["Pechuga de pavo", "proteina", 105, 24, 0, 1, 0], ["Ternera magra", "proteina", 130, 21, 0, 5, 0],
  ["Carne picada de ternera", "proteina", 200, 19, 0, 13, 0], ["Lomo de cerdo", "proteina", 145, 21, 0, 6.5, 0], ["Salmón", "proteina", 200, 20, 0, 13, 0],
  ["Merluza", "proteina", 75, 17, 0, 0.8, 0], ["Atún al natural (lata)", "proteina", 105, 24, 0, 1, 0, "lata", 56], ["Gambas", "proteina", 85, 19, 0, 1, 0],
  ["Huevo", "proteina", 145, 12.5, 0.7, 10, 0, "unidad", 60], ["Claras de huevo", "proteina", 50, 11, 0.7, 0.2, 0], ["Jamón serrano", "proteina", 240, 31, 0, 13, 0],
  ["Jamón cocido", "proteina", 110, 18, 1.5, 3.5, 0], ["Tofu", "proteina", 125, 13, 2, 7.5, 1], ["Proteína whey", "proteina", 380, 75, 8, 6, 0, "cacito", 30],
  ["Leche semidesnatada", "lacteo", 46, 3.2, 4.7, 1.6, 0, "vaso", 250], ["Leche desnatada", "lacteo", 35, 3.4, 4.9, 0.1, 0, "vaso", 250],
  ["Bebida de avena", "lacteo", 45, 0.5, 7, 1.5, 0.8, "vaso", 250], ["Yogur natural", "lacteo", 62, 3.8, 4.7, 3.2, 0, "unidad", 125],
  ["Yogur griego natural", "lacteo", 125, 3.5, 4.5, 10, 0, "unidad", 125], ["Yogur proteico", "lacteo", 55, 10, 3.5, 0.2, 0, "unidad", 160],
  ["Queso fresco batido 0 %", "lacteo", 46, 8, 3.5, 0.1, 0], ["Queso fresco tipo Burgos", "lacteo", 175, 12, 3, 13, 0], ["Queso curado", "lacteo", 400, 26, 0.5, 33, 0],
  ["Mozzarella", "lacteo", 250, 18, 1, 19, 0], ["Requesón", "lacteo", 100, 11, 3.5, 4.5, 0],
  ["Copos de avena", "carbohidrato", 375, 13, 60, 7, 10], ["Arroz blanco (crudo)", "carbohidrato", 355, 7, 79, 0.6, 1.4], ["Arroz integral (crudo)", "carbohidrato", 350, 7.5, 73, 2.7, 3.5],
  ["Pasta (cruda)", "carbohidrato", 355, 12.5, 71, 1.5, 3], ["Pasta integral (cruda)", "carbohidrato", 345, 13, 64, 2.5, 8], ["Pan blanco", "carbohidrato", 265, 9, 50, 3.2, 2.7, "rebanada", 30],
  ["Pan integral", "carbohidrato", 245, 11, 41, 3.5, 7, "rebanada", 30], ["Tortitas de arroz", "carbohidrato", 385, 8, 81, 3, 3, "unidad", 8],
  ["Patata", "carbohidrato", 77, 2, 17, 0.1, 2.2], ["Boniato", "carbohidrato", 86, 1.6, 20, 0.1, 3], ["Quinoa (cruda)", "carbohidrato", 368, 14, 64, 6, 7],
  ["Cuscús (crudo)", "carbohidrato", 375, 13, 77, 0.6, 5], ["Granola", "carbohidrato", 450, 10, 60, 18, 7],
  ["Garbanzos cocidos", "legumbre", 140, 7.5, 19, 2.5, 6], ["Lentejas cocidas", "legumbre", 115, 9, 17, 0.4, 8], ["Alubias cocidas", "legumbre", 105, 7, 15, 0.5, 6.5],
  ["Brócoli", "verdura", 34, 2.8, 4.5, 0.4, 2.6], ["Espinacas", "verdura", 23, 2.9, 1.4, 0.4, 2.2], ["Lechuga", "verdura", 15, 1.4, 1.5, 0.2, 1.3],
  ["Tomate", "verdura", 18, 0.9, 3.5, 0.2, 1.2, "unidad", 120], ["Pepino", "verdura", 15, 0.7, 3, 0.1, 0.5], ["Pimiento rojo", "verdura", 31, 1, 6, 0.3, 2.1],
  ["Calabacín", "verdura", 17, 1.2, 3, 0.3, 1], ["Cebolla", "verdura", 40, 1.1, 9, 0.1, 1.7], ["Zanahoria", "verdura", 41, 0.9, 9.6, 0.2, 2.8, "unidad", 70],
  ["Champiñones", "verdura", 22, 3.1, 3.3, 0.3, 1], ["Judías verdes", "verdura", 31, 1.8, 7, 0.2, 3.4], ["Coliflor", "verdura", 25, 1.9, 5, 0.3, 2],
  ["Berenjena", "verdura", 25, 1, 6, 0.2, 3], ["Espárragos verdes", "verdura", 20, 2.2, 3.9, 0.1, 2.1], ["Rúcula y canónigos", "verdura", 25, 2.5, 3.5, 0.6, 1.6],
  ["Plátano", "fruta", 89, 1.1, 20, 0.3, 2.6, "unidad", 120], ["Manzana", "fruta", 52, 0.3, 12, 0.2, 2.4, "unidad", 180], ["Fresas", "fruta", 32, 0.7, 6, 0.3, 2],
  ["Arándanos", "fruta", 57, 0.7, 12, 0.3, 2.4], ["Naranja", "fruta", 47, 0.9, 10, 0.1, 2.4, "unidad", 200], ["Kiwi", "fruta", 61, 1.1, 12, 0.5, 3, "unidad", 75],
  ["Pera", "fruta", 57, 0.4, 12, 0.1, 3.1, "unidad", 170], ["Uvas", "fruta", 69, 0.7, 16, 0.2, 0.9], ["Piña", "fruta", 50, 0.5, 12, 0.1, 1.4], ["Melón", "fruta", 34, 0.8, 8, 0.2, 0.9],
  ["Aceite de oliva", "grasa", 884, 0, 0, 100, 0, "cucharada", 10], ["Aguacate", "grasa", 160, 2, 2, 15, 6.7, "unidad", 150], ["Almendras", "grasa", 580, 21, 7, 50, 12.5, "puñado", 25],
  ["Nueces", "grasa", 650, 15, 7, 65, 6.5, "puñado", 25], ["Crema de cacahuete", "grasa", 600, 25, 12, 50, 6, "cucharada", 15], ["Chocolate negro 85 %", "grasa", 600, 10, 20, 50, 12, "onza", 10],
  ["Mantequilla", "grasa", 740, 0.7, 0.6, 82, 0], ["Hummus", "otros", 270, 7, 14, 21, 6], ["Miel", "otros", 304, 0.3, 82, 0, 0, "cucharada", 15]
];

/* ---------- Siembra de alimentos la primera vez ---------- */
let seedingFoods = false;
document.addEventListener("hub:loaded", async () => {
  if (seedingFoods || S.needsMigration || S.d.foods.length) return;
  seedingFoods = true;
  try {
    await insertMany("foods", FOOD_LIBRARY.map(([name, category, kcal, protein, carbs, fat, fiber, unit_label, unit_g]) =>
      ({ name, category, kcal, protein, carbs, fat, fiber, unit_label: unit_label || null, unit_g: unit_g || null })));
    render();
  } catch (_) {} finally { seedingFoods = false; }
});

/* ---------- Cálculos de nutrición ---------- */
function nutr(food, g) {
  const k = (g || 0) / 100;
  return { kcal: food.kcal * k, p: food.protein * k, c: food.carbs * k, f: food.fat * k, fib: food.fiber * k, veg: ["verdura", "fruta"].includes(food.category) ? g : 0 };
}
function totalsOf(items) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, veg: 0 };
  items.forEach(it => { const fd = byId("foods", it.food_id); if (!fd) return; const n = nutr(fd, it.grams); for (const x in t) t[x] += n[x]; });
  return t;
}
const entriesOn = k => S.d.meal_entries.filter(e => e.date === k).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
const templateOf = wd => S.d.diet_template.filter(e => e.weekday === wd).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
const foodsSorted = () => S.d.foods.filter(f => !f.archived).sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name, "es"));
const qtyLabel = (fd, g) => fd?.unit_g ? `${fmtNum(g, 0)} g (${fmtNum(g / fd.unit_g, 1)} ${fd.unit_label || "u."})` : `${fmtNum(g, 0)} g`;

function dietTargets(dateKey) {
  const p = profile(), wm = latestWith("weight_kg");
  const missing = [];
  if (!p?.sex || !p?.height_cm || !p?.birth_date) missing.push("perfil");
  if (!wm) missing.push("peso");
  if (missing.length && !(p?.kcal_override && p?.protein_override)) return { missing };
  const w = wm ? Number(wm.weight_kg) : null;
  const goal = GOALS.find(g => g[0] === (p?.goal || "recomposicion")) || GOALS[1];
  const act = ACTIVITY.find(a => a[0] === (p?.activity || "ligero")) || ACTIVITY[1];
  let bmr = null, tdeeBase = null, extra = 0, kcal = null, prot = null, fat = null, carbs = null;
  if (w && p?.height_cm) {
    const mm = latestMeasurement() || wm;
    bmr = mval({ ...mm, weight_kg: w }, "bmr");
    tdeeBase = bmr * act[3];
    const wd = wd1(fromKey(dateKey || todayKey()));
    extra = sum(schedOf(wd), s => (MET[s.kind] - 1) * w);
    kcal = Math.max(Math.round((tdeeBase + extra) * goal[3] / 10) * 10, Math.round(bmr / 10) * 10);
    prot = Math.round(goal[4] * w);
    fat = Math.round(Math.max(0.8 * w, kcal * 0.25 / 9));
    carbs = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  }
  if (p?.kcal_override) kcal = Number(p.kcal_override);
  if (p?.protein_override) prot = Number(p.protein_override);
  if (p?.fat_override) fat = Number(p.fat_override);
  if (p?.carbs_override) carbs = Number(p.carbs_override);
  else if (kcal && prot != null && fat != null) carbs = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { missing: [], kcal, p: prot, c: carbs, f: fat, fib: (p?.sex === "hombre" ? 30 : 25), veg: 400, bmr, tdeeBase, extra, goal, act, w };
}

/* =====================================================================
   Vistas
   ===================================================================== */
S.ui.dietWeek = keyOf(weekStart(new Date()));
S.ui.tplDay = wd1(new Date());
S.ui.shopRange = wd1(new Date()) === 7 ? "proxima" : "semana";
const DIET_TABS = [["hoy", "Hoy"], ["semana", "Semana"], ["plantilla", "Mi semana tipo"], ["compra", "Compra"], ["objetivos", "Objetivos"], ["alimentos", "Alimentos"]];

MOD.dieta = {
  render(r) {
    const sub = r.sub || "hoy";
    if (sub === "dia") return modHead(cap(fmt(fromKey(r.id), { weekday: "long", day: "numeric", month: "long" })), ["dieta", "semana", "Semana"]) + viewDay(r.id);
    const body = { hoy: () => viewDay(todayKey()), semana: viewDietWeek, plantilla: viewTemplate, compra: viewShopping, objetivos: viewTargets, alimentos: viewFoods }[sub] || (() => viewDay(todayKey()));
    return modHead("Dieta") + subnav("dieta", DIET_TABS, sub) + body();
  },
  fab(r) {
    const sub = r.sub || "hoy";
    if (sub === "alimentos") return { label: "Nuevo alimento", fn: () => openFood(null) };
    if (sub === "hoy" || sub === "dia") return { label: "Añadir comida", fn: () => addFoodFlow("meal_entries", { date: r.id || todayKey(), slot: guessSlot() }) };
    return null;
  }
};
function guessSlot() { const h = new Date().getHours(); return h < 11 ? "desayuno" : h < 16 ? "comida" : h < 20 ? "merienda" : "cena"; }

function macroBars(t, tg) {
  const rows = [["Calorías", t.kcal, tg?.kcal, "kcal"], ["Proteína", t.p, tg?.p, "g"], ["Hidratos", t.c, tg?.c, "g"], ["Grasa", t.f, tg?.f, "g"], ["Fibra", t.fib, tg?.fib, "g"], ["Fruta y verdura", t.veg, tg?.veg, "g"]];
  return `<div class="macros">${rows.map(([l, v, g, u]) => {
    const pct = g ? v / g * 100 : 0, over = g && pct > 110;
    return `<div class="macro"><div class="mc-top"><span>${l}</span><b>${fmtNum(v, 0)}${g ? ` <small>/ ${fmtNum(g, 0)} ${u}</small>` : ` <small>${u}</small>`}</b></div>
      ${g ? bar(pct, over && l === "Calorías" ? "var(--c-ambar)" : l === "Calorías" ? "var(--ink)" : "var(--primary)") : ""}</div>`;
  }).join("")}</div>`;
}

function viewDay(k) {
  const items = entriesOn(k), t = totalsOf(items), tg = dietTargets(k);
  const isToday = k === todayKey(), tpl = templateOf(wd1(fromKey(k)));
  let h = isToday ? `<div class="day-nav"><button class="icon-btn" data-go="dieta/dia/${keyOf(addDays(fromKey(k), -1))}" aria-label="Día anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <b>Hoy</b><button class="icon-btn" data-go="dieta/dia/${keyOf(addDays(fromKey(k), 1))}" aria-label="Día siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button></div>`
    : `<div class="day-nav"><button class="icon-btn" data-go="dieta/dia/${keyOf(addDays(fromKey(k), -1))}" aria-label="Día anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <button class="pill-btn" data-go="dieta/hoy">Ir a hoy</button><button class="icon-btn" data-go="dieta/dia/${keyOf(addDays(fromKey(k), 1))}" aria-label="Día siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button></div>`;
  if (tg.missing?.length) h += `<div class="callout soft-call"><div><b>Calcula tus objetivos</b><span>Completa tu perfil${tg.missing.includes("peso") ? " y apunta tu peso en Salud" : ""} para ver cuánto te conviene comer.</span></div><button class="btn-sm primary" data-go="dieta/objetivos">Ver</button></div>`;
  else if (tg.extra > 0) h += `<p class="hint" style="margin:0 0 10px">Hoy tienes entreno en el plan: el objetivo incluye unas ${fmtNum(tg.extra * tg.goal[3], 0)} kcal extra.</p>`;
  h += macroBars(t, tg.missing?.length ? null : tg);
  if (!items.length && tpl.length) h += `<div class="callout"><div><b>Día vacío</b><span>Puedes rellenarlo con tu semana tipo del ${esc(DIAS[wd1(fromKey(k)) - 1].toLowerCase())}.</span></div><button class="btn-sm primary" data-act="fillFromTpl" data-from="${k}" data-to="${k}">Rellenar</button></div>`;
  h += SLOTS.map(([s, l]) => {
    const its = items.filter(i => i.slot === s), st = totalsOf(its);
    if (s === "snacks" && !its.length) return `<div class="meal-links"><button class="link-btn" data-act="addMeal" data-table="meal_entries" data-date="${k}" data-slot="snacks">Añadir un snack</button></div>`;
    return mealSlot(l, its, st, `data-act="addMeal" data-table="meal_entries" data-date="${k}" data-slot="${s}"`, "editMealItem", "meal_entries");
  }).join("");
  if (items.length) h += `<div class="meal-links"><button class="link-btn" data-act="copyDay" data-date="${k}">Copiar este día a otros días</button></div>`;
  return h;
}
function mealSlot(label, its, st, addAttrs, editAct, table) {
  return `<div class="meal"><div class="meal-h"><b>${esc(label)}</b><span>${its.length ? `${fmtNum(st.kcal, 0)} kcal, ${fmtNum(st.p, 0)} g prot.` : ""}</span></div>
    ${its.map(i => { const fd = byId("foods", i.food_id); if (!fd) return ""; const n = nutr(fd, i.grams);
      return `<button class="food-row" data-act="${editAct}" data-table="${table}" data-id="${i.id}"><span class="fr-n">${esc(fd.name)}</span>
        <span class="fr-q">${esc(qtyLabel(fd, i.grams))}</span><span class="fr-k">${fmtNum(n.kcal, 0)} kcal</span></button>`; }).join("")}
    <button class="add-food" ${addAttrs}>Añadir</button></div>`;
}

function viewDietWeek() {
  const ws = fromKey(S.ui.dietWeek), we = addDays(ws, 6), t0 = todayKey();
  const label = `${fmt(ws, { day: "numeric", month: "short" })} al ${fmt(we, { day: "numeric", month: "short" })}`;
  let h = `<div class="month-nav"><button class="icon-btn" data-act="dietWeek" data-v="-7" aria-label="Semana anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <b>${esc(label)}</b><button class="icon-btn" data-act="dietWeek" data-v="7" aria-label="Semana siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button></div>`;
  const hasTpl = S.d.diet_template.length > 0;
  h += `<div class="list">` + [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = addDays(ws, i), k = keyOf(d), its = entriesOn(k), t = totalsOf(its), tg = dietTargets(k);
    const names = [...new Set(its.map(x => byId("foods", x.food_id)?.name).filter(Boolean))].slice(0, 5).join(", ");
    return `<button class="row wk-row ${k === t0 ? "is-today" : ""}" data-go="dieta/dia/${k}">
      <span class="wk-d"><b>${esc(cap(fmt(d, { weekday: "short" })).replace(".", ""))}</b><span>${d.getDate()}</span></span>
      <span class="body">${its.length ? `<span class="title">${fmtNum(t.kcal, 0)} kcal${tg.kcal ? ` <small>/ ${fmtNum(tg.kcal, 0)}</small>` : ""}, ${fmtNum(t.p, 0)} g proteína</span>
        <span class="meta">${esc(names)}</span>${tg.kcal ? bar(t.kcal / tg.kcal * 100, "var(--primary)") : ""}` : `<span class="title muted">Sin comidas apuntadas</span>`}</span></button>`;
  }).join("") + `</div>`;
  if (hasTpl) h += `<button class="btn soft" data-act="fillWeekTpl" style="margin-top:14px">Rellenar los días vacíos con mi semana tipo</button>`;
  else h += `<p class="hint">Si siempre comes parecido, crea tu semana tipo y rellena semanas enteras con un toque.</p>`;
  return h;
}

function viewTemplate() {
  const wd = S.ui.tplDay, items = templateOf(wd);
  let h = `<p class="lead">Lo que sueles comer cada día de la semana. Con esto rellenas días o semanas enteras y sacas la lista de la compra.</p>
    <div class="wd-chips">${DIAS.map((d, i) => `<button data-act="tplDay" data-v="${i + 1}" aria-pressed="${wd === i + 1}">${d.slice(0, 2)}${templateOf(i + 1).length ? "<i></i>" : ""}</button>`).join("")}</div>
    <h2 class="tpl-title">${DIAS[wd - 1]}</h2>`;
  h += macroBars(totalsOf(items), (() => { const tg = dietTargets(keyOf(addDays(weekStart(new Date()), wd - 1))); return tg.missing?.length ? null : tg; })());
  h += SLOTS.map(([s, l]) => mealSlot(l, items.filter(i => i.slot === s), totalsOf(items.filter(i => i.slot === s)), `data-act="addMeal" data-table="diet_template" data-wd="${wd}" data-slot="${s}"`, "editMealItem", "diet_template")).join("");
  if (items.length) h += `<button class="btn soft" data-act="copyTplDay" data-wd="${wd}" style="margin-top:14px">Copiar el ${esc(DIAS[wd - 1].toLowerCase())} a otros días</button>`;
  return h;
}

function shopRange() {
  const now = new Date(), r = S.ui.shopRange;
  if (r === "semana") { const a = weekStart(now); return [a, addDays(a, 6), "Esta semana"]; }
  if (r === "proxima") { const a = addDays(weekStart(now), 7); return [a, addDays(a, 6), "La semana que viene"]; }
  if (r === "mes") { const a = new Date(now.getFullYear(), now.getMonth(), 1); return [a, new Date(now.getFullYear(), now.getMonth() + 1, 0), "Este mes"]; }
  const a = new Date(now.getFullYear(), now.getMonth() + 1, 1); return [a, new Date(now.getFullYear(), now.getMonth() + 2, 0), "El mes que viene"];
}
function shoppingList() {
  const [a, b] = shopRange(), useTpl = S.ui.shopTpl !== false, agg = {};
  let daysTpl = 0;
  for (let d = new Date(a); d <= b; d = addDays(d, 1)) {
    const k = keyOf(d); let its = entriesOn(k);
    if (!its.length && useTpl) { its = templateOf(wd1(d)); if (its.length) daysTpl++; }
    its.forEach(i => agg[i.food_id] = (agg[i.food_id] || 0) + Number(i.grams));
  }
  return { items: Object.entries(agg).map(([id, g]) => ({ fd: byId("foods", id), g })).filter(x => x.fd), daysTpl };
}
function shopQty(fd, g) {
  if (fd.unit_g && ["unidad", "lata", "rebanada", "vaso"].includes(fd.unit_label)) { const n = Math.ceil(g / fd.unit_g - 0.05); return `${n} ${fd.unit_label === "unidad" ? (n === 1 ? "unidad" : "unidades") : fd.unit_label + (n === 1 ? "" : "s")}`; }
  if (g >= 1000) return `${fmtNum(g / 1000, 1)} kg`;
  return `${fmtNum(Math.ceil(g / 10) * 10, 0)} g`;
}
function viewShopping() {
  const [a, b, label] = shopRange(), { items, daysTpl } = shoppingList();
  const ckKey = "mihub-compra-" + keyOf(a) + "-" + keyOf(b);
  let checked = {}; try { checked = JSON.parse(localStorage.getItem(ckKey) || "{}"); } catch (_) {}
  S.ui.shopKey = ckKey;
  let h = `<div class="seg-scroll">${[["semana", "Esta semana"], ["proxima", "Próxima semana"], ["mes", "Este mes"], ["mesprox", "Mes que viene"]].map(([k, l]) =>
    `<button data-act="shopRange" data-v="${k}" aria-pressed="${S.ui.shopRange === k}">${l}</button>`).join("")}</div>
    <p class="lead">${esc(label)}: del ${esc(fmt(a, { day: "numeric", month: "long" }))} al ${esc(fmt(b, { day: "numeric", month: "long" }))}.${daysTpl ? ` Incluye tu semana tipo en ${plural(daysTpl, "día sin comidas apuntadas", "días sin comidas apuntadas")}.` : ""}</p>
    <div class="switch"><label for="shopTpl">Usar mi semana tipo en los días vacíos</label><input type="checkbox" id="shopTpl" data-ch="shopTpl" ${S.ui.shopTpl !== false ? "checked" : ""}></div>`;
  if (!items.length) return h + `<div class="empty">No hay comidas apuntadas en estas fechas. Apunta tus comidas o crea tu semana tipo.</div>`;
  FOOD_CATS.forEach(([c, cl]) => {
    const its = items.filter(x => x.fd.category === c).sort((p, q) => p.fd.name.localeCompare(q.fd.name, "es"));
    if (!its.length) return;
    h += `<div class="group-h">${esc(cl)}</div><div class="list">${its.map(x => `<label class="shop-row ${checked[x.fd.id] ? "done" : ""}">
      <input type="checkbox" data-ch="shopCheck" data-id="${x.fd.id}" ${checked[x.fd.id] ? "checked" : ""}><span class="fr-n">${esc(x.fd.name)}</span><span class="fr-q">${esc(shopQty(x.fd, x.g))}</span></label>`).join("")}</div>`;
  });
  return h + `<button class="btn primary" data-act="shareShop" style="margin-top:18px">Compartir o copiar la lista</button>
    <p class="hint">Las cantidades son la suma de lo que tienes planificado, redondeada hacia arriba. Los alimentos crudos (arroz, pasta…) se cuentan en crudo.</p>`;
}

function viewTargets() {
  const p = profile() || {}, tg = dietTargets(todayKey());
  let h = "";
  if (!p.sex || !p.height_cm || !p.birth_date) h += `<div class="callout soft-call"><div><b>Falta tu perfil</b><span>Altura, sexo y fecha de nacimiento.</span></div><button class="btn-sm primary" data-act="editProfile">Completar</button></div>`;
  if (!latestWith("weight_kg")) h += `<div class="callout soft-call"><div><b>Falta tu peso</b><span>Apunta una medición de la báscula en Salud.</span></div><button class="btn-sm primary" data-go="salud">Ir a Salud</button></div>`;
  h += `<div class="block"><h2>Tu objetivo</h2><div class="opt-list">${GOALS.map(g => `<button class="opt" data-act="setGoal" data-v="${g[0]}" aria-pressed="${(p.goal || "recomposicion") === g[0]}"><b>${g[1]}</b><span>${g[2]}</span></button>`).join("")}</div></div>
  <div class="block"><h2>Cuánto te mueves fuera del entreno</h2><div class="opt-list">${ACTIVITY.map(a => `<button class="opt" data-act="setActivity" data-v="${a[0]}" aria-pressed="${(p.activity || "ligero") === a[0]}"><b>${a[1]}</b><span>${a[2]}</span></button>`).join("")}</div>
    <p class="hint">El gimnasio y el pilates se suman aparte, según tu plan semanal de Entreno.</p></div>`;
  if (!tg.missing?.length && tg.kcal) {
    const days = DIAS.map((d, i) => { const k = keyOf(addDays(weekStart(new Date()), i)); return [d, dietTargets(k).kcal, schedOf(i + 1)]; });
    h += `<div class="block"><h2>Tus objetivos diarios</h2>
      <div class="money-grid"><div><span>Calorías (hoy)</span><b>${fmtNum(tg.kcal, 0)} kcal</b></div><div><span>Proteína</span><b>${fmtNum(tg.p, 0)} g</b></div>
      <div><span>Hidratos</span><b>${fmtNum(tg.c, 0)} g</b></div><div><span>Grasa</span><b>${fmtNum(tg.f, 0)} g</b></div></div>
      ${tg.bmr ? `<div class="calc-box">
        <div><span>Metabolismo basal</span><b>${fmtNum(tg.bmr, 0)} kcal</b></div>
        <div><span>Con tu movimiento diario (× ${fmtNum(tg.act[3], 2)})</span><b>${fmtNum(tg.tdeeBase, 0)} kcal</b></div>
        <div><span>Ajuste por objetivo (${esc(tg.goal[1].toLowerCase())})</span><b>${tg.goal[3] === 1 ? "sin ajuste" : (tg.goal[3] > 1 ? "+" : "−") + fmtNum(Math.abs(1 - tg.goal[3]) * 100, 0) + " %"}</b></div>
        <div><span>Proteína</span><b>${fmtNum(tg.goal[4], 1)} g por kg de peso</b></div>
      </div>` : ""}
      <div class="list" style="margin-top:12px">${days.map(([d, kc, sc]) => `<div class="acc-line two"><span>${d}${sc.length ? ` <small>${esc(sc.map(s => s.kind === "gym" ? "gym" : s.kind).join(" + "))}</small>` : ""}</span><b>${fmtNum(kc, 0)} kcal</b></div>`).join("")}</div>
    </div>`;
  }
  h += `<div class="block"><h2>Ajustes manuales</h2><p class="hint" style="margin:0 0 10px">Si una nutricionista te ha dado cifras concretas, ponlas aquí y se usarán en lugar del cálculo.</p>
    <button class="btn soft" data-act="editOverrides">${p.kcal_override || p.protein_override ? "Editar mis cifras" : "Poner mis propias cifras"}</button></div>
    <p class="hint">Cálculo orientativo: metabolismo basal según tu báscula (o fórmula de Mifflin-St Jeor), por tu nivel de movimiento, más el gasto estimado de cada entreno. No sustituye el consejo de un dietista-nutricionista. Ajusta según cómo evolucionen tu peso y tus medidas.</p>`;
  return h;
}

function viewFoods() {
  const q = (S.ui.foodQ || "").toLowerCase();
  const list = foodsSorted().filter(f => !q || f.name.toLowerCase().includes(q));
  let h = `<input class="input" id="foodQ" data-ch="foodQ" placeholder="Buscar alimento" value="${esc(S.ui.foodQ || "")}" autocomplete="off" style="margin-bottom:6px">
    <p class="hint" style="margin:0 0 10px">Valores por 100 g. Los que vienen de serie son orientativos: puedes corregirlos con la etiqueta de tu producto.</p>`;
  FOOD_CATS.forEach(([c, cl]) => {
    const its = list.filter(f => f.category === c); if (!its.length) return;
    h += `<div class="group-h">${esc(cl)}</div><div class="list">${its.map(f => `<button class="row" data-act="editFood" data-id="${f.id}">
      <span class="body"><span class="title">${f.favorite ? "★ " : ""}${esc(f.name)}</span><span class="meta">${fmtNum(f.kcal, 0)} kcal, ${fmtNum(f.protein)} P, ${fmtNum(f.carbs)} H, ${fmtNum(f.fat)} G</span></span></button>`).join("")}</div>`;
  });
  return h || `<div class="empty">No hay alimentos con ese nombre.</div>`;
}

/* =====================================================================
   Acciones
   ===================================================================== */
ACT.dietWeek = (el, d) => { S.ui.dietWeek = keyOf(addDays(fromKey(S.ui.dietWeek), +d.v)); render(); };
ACT.tplDay = (el, d) => { S.ui.tplDay = +d.v; render(); };
ACT.shopRange = (el, d) => { S.ui.shopRange = d.v; render(); };
CH.shopTpl = el => { S.ui.shopTpl = el.checked; render(); };
CH.shopCheck = el => {
  let c = {}; try { c = JSON.parse(localStorage.getItem(S.ui.shopKey) || "{}"); } catch (_) {}
  if (el.checked) c[el.dataset.id] = 1; else delete c[el.dataset.id];
  try { localStorage.setItem(S.ui.shopKey, JSON.stringify(c)); } catch (_) {}
  el.closest(".shop-row").classList.toggle("done", el.checked);
};
CH.foodQ = el => { S.ui.foodQ = el.value; render(); };
ACT.shareShop = async () => {
  const [, , label] = shopRange(), { items } = shoppingList();
  let txt = `Lista de la compra (${label.toLowerCase()})\n`;
  FOOD_CATS.forEach(([c, cl]) => { const its = items.filter(x => x.fd.category === c); if (its.length) txt += `\n${cl}\n` + its.map(x => `- ${x.fd.name}: ${shopQty(x.fd, x.g)}`).join("\n") + "\n"; });
  try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (x) { if (x.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(txt); toast("Lista copiada"); } catch (_) { toast("No se ha podido copiar la lista", true); }
};

ACT.setGoal = async (el, d) => { try { await saveProfile({ goal: d.v }); render(); } catch (x) { toast(errMsg(x), true); } };
ACT.setActivity = async (el, d) => { try { await saveProfile({ activity: d.v }); render(); } catch (x) { toast(errMsg(x), true); } };
ACT.editOverrides = () => {
  const p = profile() || {};
  formSheet("Mis cifras", `<div class="two-eq">${field("Calorías (kcal)", numInp("ovK", fmtIn(p.kcal_override), "auto"), "ovK")}${field("Proteína (g)", numInp("ovP", fmtIn(p.protein_override), "auto"), "ovP")}</div>
    <div class="two-eq">${field("Hidratos (g)", numInp("ovC", fmtIn(p.carbs_override), "auto"), "ovC")}${field("Grasa (g)", numInp("ovF", fmtIn(p.fat_override), "auto"), "ovF")}</div>
    <p class="hint">Deja en blanco lo que quieras que se siga calculando.</p>`, {
    onSubmit: async root => { await saveProfile({ kcal_override: num(val(root, "ovK")), protein_override: num(val(root, "ovP")), carbs_override: num(val(root, "ovC")), fat_override: num(val(root, "ovF")) }); toast("Guardado"); }
  });
};

/* ---------- Añadir y editar alimentos en comidas o plantilla ---------- */
ACT.addMeal = (el, d) => addFoodFlow(d.table, d.table === "meal_entries" ? { date: d.date, slot: d.slot } : { weekday: +d.wd, slot: d.slot });
function addFoodFlow(table, base) { pickFood(fid => openGrams(table, null, { ...base, food_id: fid })); }
ACT.editMealItem = (el, d) => { const it = byId(d.table, d.id); if (it) openGrams(d.table, it, it); };

function openGrams(table, item, base) {
  const fd = byId("foods", base.food_id); if (!fd) return;
  const g0 = item ? Number(item.grams) : (fd.unit_g || 100);
  formSheet(fd.name, `
    ${field("Momento", sel("gSlot", SLOTS, base.slot), "gSlot")}
    <div class="two-eq">${field("Cantidad (g)", numInp("gG", fmtIn(g0)), "gG")}${fd.unit_g ? field(`Nº de ${fd.unit_label || "unidades"} (${fmtNum(fd.unit_g, 0)} g)`, numInp("gU", fmtIn(g0 / fd.unit_g)), "gU") : ""}</div>
    <div class="nut-preview" id="gPrev"></div>`, {
    submit: item ? "Guardar" : "Añadir",
    mount: root => {
      const G = $("#gG", root), U = $("#gU", root), prev = $("#gPrev", root);
      const upd = () => { const n = nutr(fd, num(G.value) || 0); prev.textContent = `${fmtNum(n.kcal, 0)} kcal, ${fmtNum(n.p)} g proteína, ${fmtNum(n.c)} g hidratos, ${fmtNum(n.f)} g grasa`; };
      G.addEventListener("input", () => { if (U) U.value = fmtIn((num(G.value) || 0) / fd.unit_g); upd(); });
      U && U.addEventListener("input", () => { G.value = fmtIn(Math.round((num(U.value) || 0) * fd.unit_g)); upd(); });
      upd(); if (!item) setTimeout(() => { G.focus(); G.select(); }, 280);
    },
    onSubmit: async root => {
      const g = num(val(root, "gG")); if (!g || g <= 0) return "Escribe la cantidad en gramos.";
      const slot = val(root, "gSlot");
      if (item) { await save(table, { grams: g, slot }, item.id); return; }
      const sibl = table === "meal_entries" ? entriesOn(base.date) : templateOf(base.weekday);
      await save(table, { ...base, slot, grams: g, position: sibl.length });
      toast("Añadido");
    },
    onDelete: item ? () => remove(table, item.id) : null, deleteLabel: "Quitar"
  });
}

function pickFood(cb) {
  let q = "", cat = "";
  const recentIds = [...new Set([...S.d.meal_entries].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => e.food_id))].slice(0, 8);
  const listHtml = () => {
    let all = foodsSorted().filter(f => (!cat || f.category === cat) && (!q || f.name.toLowerCase().includes(q)));
    if (q) { const st = all.filter(f => f.name.toLowerCase().split(/\s+/).some(w => w.startsWith(q))); return st.concat(all.filter(f => !st.includes(f))).map(f => `<button class="pick" data-pick="${f.id}">${esc(f.name)}<small>${esc(catName(f.category))}, ${fmtNum(f.kcal, 0)} kcal / 100 g</small></button>`).join("") || `<div class="empty">No encuentro ese alimento. Puedes crearlo abajo con los datos de la etiqueta.</div>`; }
    let h = "";
    if (!q && !cat && recentIds.length) {
      const rec = recentIds.map(id => byId("foods", id)).filter(Boolean);
      h += `<div class="group-h">Recientes</div>` + rec.map(f => `<button class="pick" data-pick="${f.id}">${esc(f.name)}</button>`).join("");
    }
    let cur = "";
    all.forEach(f => { const g = f.favorite && !cat && !q ? "Favoritos" : catName(f.category);
      if (g !== cur) { cur = g; h += `<div class="group-h">${esc(g)}</div>`; }
      h += `<button class="pick" data-pick="${f.id}">${esc(f.name)}<small>${fmtNum(f.kcal, 0)} kcal / 100 g</small></button>`; });
    return h || `<div class="empty">No encuentro ese alimento. Puedes crearlo abajo con los datos de la etiqueta.</div>`;
  };
  openSheet(`${sheetHead("Elegir alimento")}
    <input class="input" id="pfQ" placeholder="Buscar alimento" autocomplete="off" style="margin-bottom:10px">
    <div class="mfilter">${[["", "Todos"], ...FOOD_CATS].map(([c, l]) => `<button type="button" data-c="${c}" aria-pressed="${c === ""}">${esc(c ? l.split(",")[0] : l)}</button>`).join("")}</div>
    <div id="pfList">${listHtml()}</div>
    <button class="btn soft" id="pfNew" style="margin-top:12px">Crear alimento nuevo</button>`, root => {
    const upd = () => $("#pfList", root).innerHTML = listHtml();
    $("#pfQ", root).addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); upd(); });
    bindSeg(root, "[data-c]", b => { cat = b.dataset.c; upd(); });
    $("#pfList", root).addEventListener("click", e => { const b = e.target.closest("[data-pick]"); if (b) { const id = b.dataset.pick; closeSheet(); setTimeout(() => cb(id), 280); } });
    $("#pfNew", root).addEventListener("click", () => openFood(null, q, cb));
  });
}

ACT.editFood = (el, d) => openFood(byId("foods", d.id));
function openFood(f, name, cb) {
  formSheet(f ? "Editar alimento" : "Nuevo alimento", `
    ${field("Nombre", inp("fdN", f?.name ?? name ?? "", 'maxlength="80"'), "fdN")}
    ${field("Tipo", sel("fdC", FOOD_CATS, f?.category || "otros"), "fdC")}
    <div class="form-sec">Por cada 100 g (mira la etiqueta)</div>
    <div class="two-eq">${field("Calorías (kcal)", numInp("fdK", fmtIn(f?.kcal)), "fdK")}${field("Proteína (g)", numInp("fdP", fmtIn(f?.protein)), "fdP")}</div>
    <div class="two-eq">${field("Hidratos (g)", numInp("fdH", fmtIn(f?.carbs)), "fdH")}${field("Grasa (g)", numInp("fdG", fmtIn(f?.fat)), "fdG")}</div>
    ${field("Fibra (g)", numInp("fdF", fmtIn(f?.fiber), "opcional"), "fdF")}
    <div class="form-sec">Unidad (opcional)</div>
    <div class="two-eq">${field("Nombre de la unidad", inp("fdU", f?.unit_label || "", 'placeholder="unidad, rebanada…"'), "fdU")}${field("Gramos por unidad", numInp("fdUG", fmtIn(f?.unit_g)), "fdUG")}</div>
    <div class="switch"><label for="fdFav">Favorito (sale el primero al buscar)</label><input type="checkbox" id="fdFav" ${f?.favorite ? "checked" : ""}></div>`, {
    onSubmit: async root => {
      const n = val(root, "fdN"); if (!n) return "Ponle nombre al alimento.";
      const k = num(val(root, "fdK")); if (k === null || k < 0 || k > 950) return "Escribe las calorías por 100 g.";
      const row = { name: n, category: val(root, "fdC"), kcal: k, protein: num(val(root, "fdP")) || 0, carbs: num(val(root, "fdH")) || 0, fat: num(val(root, "fdG")) || 0,
        fiber: num(val(root, "fdF")) || 0, unit_label: val(root, "fdU") || null, unit_g: num(val(root, "fdUG")), favorite: $("#fdFav", root).checked };
      if (row.protein + row.carbs + row.fat > 101) return "Proteína, hidratos y grasa no pueden sumar más de 100 g.";
      const saved = await save("foods", row, f?.id); toast("Alimento guardado");
      if (cb) setTimeout(() => cb(saved.id));
    },
    onDelete: f ? () => remove("foods", f.id) : null, deleteLabel: "Eliminar alimento (también de tus comidas)"
  });
}

/* ---------- Copiar días y plantilla ---------- */
ACT.fillFromTpl = async (el, d) => {
  const tpl = templateOf(wd1(fromKey(d.to)));
  try { await insertMany("meal_entries", tpl.map(t => ({ date: d.to, slot: t.slot, food_id: t.food_id, grams: t.grams, position: t.position }))); render(); toast("Día rellenado"); }
  catch (x) { toast(errMsg(x), true); }
};
ACT.fillWeekTpl = async () => {
  const ws = fromKey(S.ui.dietWeek), rows = [];
  for (let i = 0; i < 7; i++) {
    const k = keyOf(addDays(ws, i)); if (entriesOn(k).length) continue;
    templateOf(i + 1).forEach(t => rows.push({ date: k, slot: t.slot, food_id: t.food_id, grams: t.grams, position: t.position }));
  }
  if (!rows.length) return toast("No hay días vacíos que rellenar");
  try { await insertMany("meal_entries", rows); render(); toast("Semana rellenada"); } catch (x) { toast(errMsg(x), true); }
};
ACT.copyDay = (el, d) => {
  const src = entriesOn(d.date);
  formSheet("Copiar este día", `${field("Desde", `<input type="date" class="input" id="cdA" value="${keyOf(addDays(fromKey(d.date), 1))}">`, "cdA")}
    ${field("Hasta", `<input type="date" class="input" id="cdB" value="${keyOf(addDays(fromKey(d.date), 1))}">`, "cdB")}
    <div class="switch"><label for="cdRep">Sustituir lo que ya haya apuntado esos días</label><input type="checkbox" id="cdRep"></div>`, {
    submit: "Copiar",
    onSubmit: async root => {
      const a = val(root, "cdA"), b = val(root, "cdB") || a; if (!a || b < a) return "Revisa las fechas.";
      if ((fromKey(b) - fromKey(a)) / 864e5 > 62) return "Copia como máximo dos meses de una vez.";
      const rep = $("#cdRep", root).checked, rows = [], del = [];
      for (let x = fromKey(a); x <= fromKey(b); x = addDays(x, 1)) {
        const k = keyOf(x); if (k === d.date) continue;
        const ex = entriesOn(k); if (ex.length && !rep) continue;
        del.push(...ex.map(e => e.id));
        src.forEach(s => rows.push({ date: k, slot: s.slot, food_id: s.food_id, grams: s.grams, position: s.position }));
      }
      if (!rows.length) return "Esos días ya tienen comidas. Marca la opción de sustituir si quieres reemplazarlas.";
      await removeIds("meal_entries", del); await insertMany("meal_entries", rows); toast("Día copiado");
    }
  });
};
ACT.copyTplDay = (el, d) => {
  const wd = +d.wd, src = templateOf(wd);
  formSheet(`Copiar el ${DIAS[wd - 1].toLowerCase()}`, `<p class="lead">Elige a qué días copiarlo. Lo que tengan esos días se sustituirá.</p>
    <div class="wd-chips multi">${DIAS.map((x, i) => i + 1 === wd ? "" : `<button type="button" data-cw="${i + 1}" aria-pressed="false">${x.slice(0, 2)}</button>`).join("")}</div>
    <button type="button" class="link-btn" id="cwAll">Seleccionar todos</button>`, {
    submit: "Copiar",
    mount: root => {
      $$("[data-cw]", root).forEach(b => b.addEventListener("click", () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true")));
      $("#cwAll", root).addEventListener("click", () => $$("[data-cw]", root).forEach(b => b.setAttribute("aria-pressed", "true")));
    },
    onSubmit: async root => {
      const targets = $$("[data-cw]", root).filter(b => b.getAttribute("aria-pressed") === "true").map(b => +b.dataset.cw);
      if (!targets.length) return "Elige al menos un día.";
      await removeIds("diet_template", S.d.diet_template.filter(t => targets.includes(t.weekday)).map(t => t.id));
      await insertMany("diet_template", targets.flatMap(w => src.map(s => ({ weekday: w, slot: s.slot, food_id: s.food_id, grams: s.grams, position: s.position }))));
      toast("Copiado");
    }
  });
};

/* Resumen para la página de inicio */
function dietTodaySummary() {
  const k = todayKey(), t = totalsOf(entriesOn(k)), tg = dietTargets(k);
  return { t, tg: tg.missing?.length ? null : tg, has: entriesOn(k).length > 0 };
}
