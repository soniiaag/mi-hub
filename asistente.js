"use strict";
/* =====================================================================
   Asistente: entiende lo que le pides y crea eventos, tareas, gastos…
   Con clave de Gemini usa IA; sin clave, un modo básico sin conexión.
   Siempre pide confirmación antes de guardar nada.
   ===================================================================== */
const AI_KEY = "mihub-ai-key", AI_MODEL = "mihub-ai-model", AI_DEFAULT_MODEL = "gemini-flash-lite-latest";
const AI_FALLBACKS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
const aiKey = () => { try { return localStorage.getItem(AI_KEY) || ""; } catch (_) { return ""; } };
const aiModel = () => { try { return localStorage.getItem(AI_MODEL) || AI_DEFAULT_MODEL; } catch (_) { return AI_DEFAULT_MODEL; } };
const AI = { msgs: [], history: [], busy: false, pending: {}, attach: [] };

/* ---------- Acciones que puede hacer ---------- */
const RECUR_ES = { none: "", daily: "cada día", weekly: "cada semana", monthly: "cada mes", yearly: "cada año" };
const PRIO_ES = { alta: 1, normal: 2, baja: 3 };
const findCat = name => name ? S.d.event_categories.find(c => c.name.toLowerCase() === String(name).toLowerCase()) : null;
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const isTime = s => /^\d{1,2}:\d{2}$/.test(s || "");
const t2 = s => s.length === 4 ? "0" + s : s;

const ACTIONS = {
  crear_evento: {
    write: true,
    describe: a => [`Evento: ${a.titulo}`, `${a.fecha ? cap(fmt(fromKey(a.fecha), { weekday: "long", day: "numeric", month: "long" })) : "sin fecha"}${a.todo_el_dia || !a.hora_inicio ? ", todo el día" : `, ${a.hora_inicio}${a.hora_fin ? "–" + a.hora_fin : ""}`}`,
      [a.categoria && findCat(a.categoria)?.name, a.ubicacion, RECUR_ES[a.repetir || "none"]].filter(Boolean).join(", ")].filter(Boolean),
    async run(a) {
      if (!a.titulo || !isDate(a.fecha)) throw new Error("Falta el título o la fecha");
      const all = !!a.todo_el_dia || !isTime(a.hora_inicio);
      let start, end;
      if (all) { start = startOfDay(fromKey(a.fecha)); end = endOfDay(fromKey(a.fecha_fin && isDate(a.fecha_fin) ? a.fecha_fin : a.fecha)); }
      else { start = new Date(`${a.fecha}T${t2(a.hora_inicio)}`); end = isTime(a.hora_fin) ? new Date(`${a.fecha}T${t2(a.hora_fin)}`) : new Date(start.getTime() + 3600e3); if (end < start) end = new Date(start.getTime() + 3600e3); }
      const cat = findCat(a.categoria);
      const e = await save("events", { title: a.titulo, all_day: all, start_at: start.toISOString(), end_at: end.toISOString(), color: cat?.color || "verde", category_id: cat?.id || null,
        location: a.ubicacion || null, notes: a.notas || null, recur: RECUR_ES[a.repetir] !== undefined ? a.repetir || "none" : "none" });
      return { ok: true, id: e.id };
    }
  },
  crear_tarea: {
    write: true,
    describe: a => [`Tarea: ${a.titulo}`, [a.fecha_limite && isDate(a.fecha_limite) ? "para " + niceDate(a.fecha_limite).toLowerCase() : "sin fecha", a.prioridad && a.prioridad !== "normal" ? "prioridad " + a.prioridad : "", a.lista].filter(Boolean).join(", ")],
    async run(a) {
      if (!a.titulo) throw new Error("Falta el título");
      const t = await save("tasks", { title: a.titulo, due_date: isDate(a.fecha_limite) ? a.fecha_limite : null, priority: PRIO_ES[a.prioridad] || 2, list: a.lista || "Personal" });
      return { ok: true, id: t.id };
    }
  },
  completar_tarea: {
    write: true,
    describe: a => { const t = matchTask(a.texto); return [t ? `Marcar como hecha: ${t.title}` : `No encuentro ninguna tarea pendiente con "${a.texto}"`]; },
    async run(a) {
      const t = matchTask(a.texto); if (!t) throw new Error("No hay ninguna tarea pendiente que coincida");
      await save("tasks", { done: true, completed_at: new Date().toISOString() }, t.id); return { ok: true, tarea: t.title };
    }
  },
  apuntar_movimiento: {
    write: true,
    describe: a => [`${a.tipo === "ingreso" ? "Ingreso" : "Gasto"}: ${eur(Number(a.importe) || 0)}`, [a.categoria, a.descripcion, a.fecha && isDate(a.fecha) ? niceDate(a.fecha).toLowerCase() : "hoy"].filter(Boolean).join(", ")],
    async run(a) {
      const amount = Number(a.importe); if (!amount || amount <= 0) throw new Error("Importe no válido");
      await save("fin_transactions", { kind: a.tipo === "ingreso" ? "ingreso" : "gasto", amount: Math.round(amount * 100) / 100, category: a.categoria || (a.tipo === "ingreso" ? "Otros ingresos" : "Otros"),
        description: a.descripcion || null, date: isDate(a.fecha) ? a.fecha : todayKey() });
      return { ok: true };
    }
  },
  marcar_comidas: {
    write: true,
    describe: a => [`Marcar como comido: ${(SLOTS.find(s => s[0] === a.momento) || [0, a.momento || "todo el día"])[1].toLowerCase()}`, isDate(a.fecha) ? niceDate(a.fecha) : "Hoy"],
    async run(a) {
      const k = isDate(a.fecha) ? a.fecha : todayKey();
      await materialize(k);
      const its = entriesOn(k).filter(i => !i.eaten && (!a.momento || i.slot === a.momento));
      await Promise.all(its.map(i => save("meal_entries", { eaten: true }, i.id)));
      return { ok: true, marcadas: its.length };
    }
  },
  actualizar_saldo: {
    write: true,
    describe: a => { const acc = findAccount(a.cuenta), prev = acc ? balanceOf(acc) : null;
      return [`Actualizar saldo: ${acc?.name || a.cuenta}`, `${eur(Number(a.importe) || 0)}${prev !== null ? ` (antes ${eur(prev)})` : ""}`, acc ? "" : "No encuentro esa cuenta en Finanzas"].filter(Boolean); },
    async run(a) {
      const acc = findAccount(a.cuenta); if (!acc) throw new Error("No existe esa cuenta. Créala antes en Finanzas → Cuentas");
      const v = Number(a.importe); if (!Number.isFinite(v)) throw new Error("Importe no válido");
      await save("fin_balances", { account_id: acc.id, amount: Math.round(v * 100) / 100, date: isDate(a.fecha) ? a.fecha : todayKey() });
      return { ok: true, cuenta: acc.name };
    }
  },
  consultar_agenda: {
    write: false,
    async run(a) {
      const from = isDate(a.desde) ? a.desde : todayKey(), to = isDate(a.hasta) ? a.hasta : from, days = [];
      for (let d = fromKey(from), n = 0; d <= fromKey(to) && n < 31; d = addDays(d, 1), n++) {
        const k = keyOf(d);
        days.push({ fecha: k, eventos: eventsOn(k).map(e => ({ titulo: e.title, hora: e.all_day ? "todo el día" : timeOf(new Date(e.start_at)), festivo: !!e.holiday })),
          tareas: S.d.tasks.filter(t => !t.done && t.due_date === k).map(t => t.title),
          entreno: schedOf(wd1(d)).map(p => p.kind === "gym" ? (byId("fit_routines", p.routine_id)?.name || "Gimnasio") : p.kind === "pilates" ? `Pilates ${hhmm(p.time)}` : (p.label || "Actividad")) });
      }
      return { dias: days, tareas_vencidas: S.d.tasks.filter(t => !t.done && t.due_date && t.due_date < todayKey()).map(t => t.title) };
    }
  }
};
function findAccount(name) {
  const n = String(name || "").toLowerCase().trim(), accs = accountsSorted(); if (!n) return null;
  return accs.find(a => a.name.toLowerCase() === n) || accs.find(a => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase())) || null;
}
function matchTask(q) {
  const s = String(q || "").toLowerCase().trim(); if (!s) return null;
  const p = S.d.tasks.filter(t => !t.done);
  return p.find(t => t.title.toLowerCase() === s) || p.find(t => t.title.toLowerCase().includes(s)) || p.find(t => s.split(/\s+/).filter(w => w.length > 3).every(w => t.title.toLowerCase().includes(w))) || null;
}

/* ---------- Gemini ---------- */
const S_ = (type, description, extra = {}) => ({ type, description, ...extra });
const FN_BASE = [
  { name: "crear_evento", description: "Crea un evento en el calendario de Mi Hub.", parameters: { type: "OBJECT", required: ["titulo", "fecha"], properties: {
    titulo: S_("STRING", "Título corto del evento"), fecha: S_("STRING", "Fecha de inicio, formato AAAA-MM-DD"), fecha_fin: S_("STRING", "Fecha de fin si dura varios días, AAAA-MM-DD"),
    hora_inicio: S_("STRING", "HH:MM en 24 h. Omitir si es todo el día"), hora_fin: S_("STRING", "HH:MM en 24 h"), todo_el_dia: S_("BOOLEAN", "true si no tiene hora"),
    categoria: S_("STRING", "Nombre exacto de una categoría existente, si encaja"), ubicacion: S_("STRING", "Lugar"), notas: S_("STRING", "Notas"),
    repetir: S_("STRING", "Repetición", { enum: ["none", "daily", "weekly", "monthly", "yearly"] }) } } },
  { name: "crear_tarea", description: "Crea una tarea pendiente.", parameters: { type: "OBJECT", required: ["titulo"], properties: {
    titulo: S_("STRING", "Texto de la tarea"), fecha_limite: S_("STRING", "AAAA-MM-DD, opcional"), prioridad: S_("STRING", "Prioridad", { enum: ["alta", "normal", "baja"] }), lista: S_("STRING", "Lista, por ejemplo Personal o Trabajo") } } },
  { name: "completar_tarea", description: "Marca como hecha una tarea pendiente buscándola por su texto.", parameters: { type: "OBJECT", required: ["texto"], properties: { texto: S_("STRING", "Parte del título de la tarea") } } },
  { name: "apuntar_movimiento", description: "Apunta un gasto o un ingreso en Finanzas.", parameters: { type: "OBJECT", required: ["importe", "tipo"], properties: {
    importe: S_("NUMBER", "Importe en euros, positivo"), tipo: S_("STRING", "gasto o ingreso", { enum: ["gasto", "ingreso"] }), categoria: S_("STRING", "Una de las categorías de gasto o ingreso"),
    descripcion: S_("STRING", "Descripción breve"), fecha: S_("STRING", "AAAA-MM-DD, por defecto hoy") } } },
  { name: "marcar_comidas", description: "Marca como comidas las comidas planificadas de un momento del día (o de todo el día).", parameters: { type: "OBJECT", properties: {
    fecha: S_("STRING", "AAAA-MM-DD, por defecto hoy"), momento: S_("STRING", "Momento del día; vacío para todo el día", { enum: ["desayuno", "comida", "merienda", "cena", "snacks"] }) } } },
  { name: "consultar_agenda", description: "Devuelve eventos, tareas, entrenos y festivos entre dos fechas. Úsala para responder preguntas sobre qué tiene la usuaria.", parameters: { type: "OBJECT", properties: {
    desde: S_("STRING", "AAAA-MM-DD"), hasta: S_("STRING", "AAAA-MM-DD") } } }
];
function fnDecls() {
  const accs = accountsSorted().map(a => a.name);
  if (!accs.length) return FN_BASE;
  return [...FN_BASE, { name: "actualizar_saldo", description: "Actualiza el saldo total de una cuenta en Finanzas (por ejemplo, leído de una captura de la app del banco o del bróker).", parameters: { type: "OBJECT", required: ["cuenta", "importe"], properties: {
    cuenta: S_("STRING", "Cuenta a actualizar", { enum: accs }), importe: S_("NUMBER", "Saldo o valor total de la cuenta en euros"), fecha: S_("STRING", "AAAA-MM-DD, por defecto hoy") } } }];
}
function sysPrompt() {
  const now = new Date();
  return `Eres el asistente de "Mi Hub", una app personal de organización. Respondes siempre en español, de forma breve y amable.
Hoy es ${fmt(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} (${todayKey()}), son las ${timeOf(now)}, zona horaria de España.
Cuando te pidan crear, apuntar, marcar o completar algo, llama a la función correspondiente (una llamada por cada cosa). Calcula las fechas exactas tú (por ejemplo, "el viernes" es el próximo viernes; si hoy es viernes, es hoy). Si no dicen hora, crea el evento de todo el día. No inventes datos que no te han dado.
La app pedirá confirmación a la usuaria antes de guardar; no le preguntes "¿lo creo?", llama directamente a la función.
Para preguntas sobre su agenda, usa consultar_agenda. Si te piden algo que la app no puede hacer, dilo con sencillez.
Categorías de eventos: ${S.d.event_categories.map(c => c.name).join(", ") || "ninguna"}.
Listas de tareas: ${[...new Set(["Personal", "Trabajo", ...S.d.tasks.map(t => t.list)])].join(", ")}.
Categorías de gasto: ${CATS.map(c => c[0]).join(", ")}. De ingreso: ${INCOME_CATS.map(c => c[0]).join(", ")}.
Cuentas en Finanzas: ${accountsSorted().map(a => `${a.name} (saldo actual ${eur(balanceOf(a))})`).join(", ") || "ninguna"}.
Si te envían capturas de la app de un banco o bróker (BBVA, MyInvestor, Trade Republic…), identifica de qué entidad es cada una y llama a actualizar_saldo con el valor TOTAL de la cuenta (saldo disponible o valor total de la cartera, no la rentabilidad ni lo invertido). Si no encaja con ninguna cuenta o no se lee bien el importe, dilo.
Si te envían un mensaje de voz, haz lo que se pide en él como si lo hubieran escrito. Tus respuestas pueden leerse en voz alta: escribe frases naturales, sin listas ni símbolos.`;
}
/* Si un modelo está saturado (503) o sin cuota, prueba con los demás antes de rendirse */
async function gemini(contents, opts = {}) {
  const models = [...new Set([aiModel(), ...AI_FALLBACKS])];
  let lastErr;
  for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return await geminiOnce(contents, m, opts); }
      catch (e) {
        lastErr = e;
        if (e.status !== 503 && e.status !== 429 && e.status !== 404) throw e;
        if (e.status === 503 && attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
        break;
      }
    }
  }
  throw lastErr;
}
async function geminiOnce(contents, model, opts = {}) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": aiKey() },
    body: JSON.stringify(opts.json
      ? { systemInstruction: { parts: [{ text: opts.system || "Responde solo con JSON válido." }] }, contents, generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }
      : { systemInstruction: { parts: [{ text: sysPrompt() }] }, contents, tools: [{ functionDeclarations: fnDecls() }], generationConfig: { temperature: 0.2 } })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({})), m = e.error?.message || "";
    const fail = msg => Object.assign(new Error(msg), { status: r.status });
    if (r.status === 429) throw fail("Has llegado al límite gratuito de la IA por ahora. Espera un rato y vuelve a intentarlo, o usa el modo básico.");
    if (r.status === 503) throw fail("Los servidores de Google están saturados ahora mismo. Inténtalo en unos minutos; mientras, puedes quitar la clave en Ajustes y usar el modo básico.");
    if (r.status === 400 && /API key/i.test(m)) throw fail("La clave de Gemini no es válida. Revísala en Ajustes.");
    if (r.status === 403) throw fail("Google ha rechazado la clave. Revisa que esté bien copiada en Ajustes.");
    if (r.status === 404) throw fail(`El modelo "${model}" ya no existe. Cambia el modelo en Ajustes.`);
    throw fail(m || "Error " + r.status);
  }
  const j = await r.json();
  const c = j.candidates?.[0]?.content;
  if (!c) throw new Error(j.promptFeedback?.blockReason ? "La IA no ha querido responder a eso." : "La IA no ha devuelto respuesta.");
  return c;
}

/* ---------- Modo básico (sin IA) ---------- */
const WD_ES = { lunes: 1, martes: 2, "miércoles": 3, miercoles: 3, jueves: 4, viernes: 5, "sábado": 6, sabado: 6, domingo: 7 };
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const KW_CAT = [[/restaurante|cena fuera|comida fuera|bar\b|caf[eé]|brunch/, "Restaurantes"], [/s[uú]per|mercadona|lidl|carrefour|bonpreu|condis|aldi|compra/, "Supermercado"],
  [/ropa|zara|mango|zapatos|camiseta/, "Ropa"], [/skincare|crema|s[eé]rum|sephora|cosm[eé]tic/, "Skincare"], [/gasolina|gasoil|di[eé]sel|repsol/, "Gasolina"],
  [/taxi|metro|bus|tren|uber|cabify|parking|peaje/, "Transporte"], [/cine|concierto|ocio|entradas/, "Ocio"], [/vuelo|hotel|viaje|airbnb/, "Viajes"],
  [/regalo/, "Regalos"], [/farmacia|m[eé]dico|dentista/, "Salud"], [/netflix|spotify|suscripci/, "Suscripciones"], [/casa|hogar|ikea/, "Hogar"]];
function parseDate(t) {
  const now = new Date(); let d = null, m;
  if (/pasado mañana/.test(t)) d = addDays(now, 2);
  else if (/\bmañana\b/.test(t)) d = addDays(now, 1);
  else if (/\bhoy\b/.test(t)) d = now;
  else if ((m = t.match(/dentro de (\d+) d[ií]as?/))) d = addDays(now, +m[1]);
  else if ((m = t.match(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?: de (\d{4}))?/))) {
    const y = m[3] ? +m[3] : now.getFullYear(); d = new Date(y, MONTHS_ES.indexOf(m[2]), +m[1]); if (!m[3] && d < startOfDay(now)) d.setFullYear(y + 1);
  } else if ((m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    let y = m[3] ? +m[3] : now.getFullYear(); if (y < 100) y += 2000; d = new Date(y, +m[2] - 1, +m[1]); if (!m[3] && d < startOfDay(now)) d.setFullYear(y + 1);
  } else if ((m = t.match(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/))) {
    const target = WD_ES[m[1]], cur = wd1(now); let diff = (target - cur + 7) % 7; if (/pr[oó]ximo|que viene/.test(t) && diff === 0) diff = 7; d = addDays(now, diff);
  }
  return d ? keyOf(d) : null;
}
function parseTime(t) {
  const m = t.match(/\ba las (\d{1,2})(?:[:.h](\d{2}))?(?:\s*(?:h|horas))?(?:\s*de la (mañana|tarde|noche))?/) || t.match(/\b(\d{1,2})[:h](\d{2})\b/);
  if (!m) return null;
  let h = +m[1]; const mi = m[2] ? +m[2] : 0, part = m[3];
  if ((part === "tarde" || part === "noche") && h < 12) h += 12;
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
}
function cleanTitle(t) {
  return t.replace(/^(añ[aá]de(me)?|apunta(me)?|crea(me)?|pon(me)?|recu[eé]rdame|a[ñn]adir|nuevo|nueva)\s+/i, "")
    .replace(/^(un |una |el |la )?(evento|cita|tarea|recordatorio|gasto|ingreso)\s*(de |para |:)?\s*/i, "")
    .replace(/\b(pasado mañana|mañana|hoy|dentro de \d+ d[ií]as?)\b/gi, "")
    .replace(/\b(el |este |el pr[oó]ximo |pr[oó]ximo )?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)( que viene)?\b/gi, "")
    .replace(/\b(el )?\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)( de \d{4})?/gi, "")
    .replace(/\b(el )?\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, "")
    .replace(/\ba las \d{1,2}([:.h]\d{2})?(\s*(h|horas))?(\s*de la (mañana|tarde|noche))?/gi, "")
    .replace(/\s+(en el calendario|al calendario|en tareas)\b/gi, "").replace(/\s{2,}/g, " ").replace(/^[\s,.:-]+|[\s,.:-]+$/g, "");
}
function basicParse(text) {
  const t = text.toLowerCase().trim();
  if (/qu[eé] tengo|mi agenda|qu[eé] hay/.test(t)) { const k = parseDate(t) || todayKey(); return { name: "consultar_agenda", args: { desde: k, hasta: k } }; }
  const amt = t.match(/(\d+(?:[.,]\d{1,2})?)\s*(€|euros?)/) || (/(gasto|gast[eé]|pagu[eé]|ingreso|cobr[eé])/.test(t) && t.match(/(\d+(?:[.,]\d{1,2})?)/));
  if (amt && /(gasto|gast[eé]|pagu[eé]|me he gastado|ingreso|cobr[eé]|€|euro)/.test(t)) {
    const income = /ingreso|cobr[eé]|n[oó]mina/.test(t), cat = income ? (/n[oó]mina/.test(t) ? "Nómina" : "Otros ingresos") : (KW_CAT.find(([re]) => re.test(t)) || [0, "Otros"])[1];
    const desc = cleanTitle(text.replace(amt[0], "")).replace(/^(he gastado|me he gastado|gast[eé]|pagu[eé]|en|de)\s+/i, "");
    return { name: "apuntar_movimiento", args: { importe: num(amt[1]), tipo: income ? "ingreso" : "gasto", categoria: cat, descripcion: desc || null, fecha: parseDate(t) || todayKey() } };
  }
  if (/^(he hecho|ya he hecho|marca como hecha|complet[ae]|termin[eé])/.test(t)) return { name: "completar_tarea", args: { texto: cleanTitle(text.replace(/^(he hecho|ya he hecho|marca como hecha( la tarea)?|completa(r)?|termin[eé])\s*/i, "")) } };
  const date = parseDate(t), time = parseTime(t), title = cleanTitle(text);
  if (!title) return null;
  const isTask = /tarea|recu[eé]rdame|pendiente|tengo que/.test(t) && !/evento|cita/.test(t);
  if (isTask || (!date && !time)) return { name: "crear_tarea", args: { titulo: cap(title.replace(/^tengo que\s+/i, "")), fecha_limite: date } };
  const cat = /cumple/.test(t) ? "Cumpleaños" : /viaje|vuelo/.test(t) ? "Viaje" : /trabajo|reuni[oó]n/.test(t) ? "Trabajo" : null;
  return { name: "crear_evento", args: { titulo: cap(title), fecha: date || todayKey(), hora_inicio: time, todo_el_dia: !time, categoria: findCat(cat)?.name, repetir: /cumple/.test(t) ? "yearly" : "none" } };
}

/* ---------- Interfaz ---------- */
function openAssistant() {
  const p = $("#aiPanel");
  p.classList.remove("hidden"); requestAnimationFrame(() => p.classList.add("on"));
  if (!AI.msgs.length) AI.msgs.push({ who: "bot", text: aiKey() ? "¡Hola! Dime qué quieres que haga. Por ejemplo: «Añade cena con Marta el viernes a las 21:00» o «¿Qué tengo mañana?»."
    : "¡Hola! Estoy en modo básico (sin IA). Entiendo órdenes sencillas como «Añade dentista el 12 de noviembre a las 10», «Tarea: llamar al banco mañana» o «Gasto 23,50 restaurante». Para que entienda cualquier frase, añade tu clave gratuita de Gemini en Ajustes." });
  drawAI(); setTimeout(() => $("#aiInput").focus(), 300);
}
window.openAssistant = openAssistant;
function closeAssistant() { const p = $("#aiPanel"); p.classList.remove("on"); setTimeout(() => p.classList.add("hidden"), 250); render(); }
function drawAI() {
  const box = $("#aiMsgs");
  box.innerHTML = AI.msgs.map((m, i) => {
    if (m.who === "card") return `<div class="ai-card ${m.state}"><b>${m.state === "done" ? "Hecho" : m.state === "cancel" ? "Cancelado" : m.state === "error" ? "No se ha podido hacer" : "¿Lo guardo?"}</b>
      ${m.lines.map(l => `<span>${esc(l)}</span>`).join("")}${m.err ? `<span class="ai-err">${esc(m.err)}</span>` : ""}
      ${m.state === "ask" ? `<div class="ai-card-btns"><button class="btn-sm primary" data-ai="ok" data-i="${i}">Guardar</button><button class="btn-sm" data-ai="no" data-i="${i}">Cancelar</button></div>` : ""}</div>`;
    if (m.who === "me") return `<div class="ai-msg me">${m.media?.length ? `<div class="ai-media">${m.media.map(x => x.thumb ? `<img src="${x.thumb}" alt="Captura adjunta">` : `<span class="ai-audio">🎤 Mensaje de voz${x.secs ? ` (${fmtDur(x.secs)})` : ""}</span>`).join("")}</div>` : ""}${m.text ? esc(m.text).replace(/\n/g, "<br>") : ""}</div>`;
    return `<div class="ai-msg bot">${esc(m.text).replace(/\n/g, "<br>")}${"speechSynthesis" in window ? `<button class="ai-say" data-say="${i}" aria-label="Leer en voz alta">🔊</button>` : ""}</div>`;
  }).join("") + (AI.busy ? `<div class="ai-msg bot typing"><i></i><i></i><i></i></div>` : "");
  box.scrollTop = box.scrollHeight;
  $("#aiMode").textContent = aiKey() ? "Con IA (Gemini)" : "Modo básico";
  $("#aiSend").disabled = AI.busy;
  $("#aiAttachList").innerHTML = AI.attach.map((x, i) => `<span class="ai-thumb"><img src="${x.thumb}" alt=""><button type="button" data-unattach="${i}" aria-label="Quitar imagen">×</button></span>`).join("");
  $("#aiAttachList").classList.toggle("hidden", !AI.attach.length);
  $("#aiSpeak").setAttribute("aria-pressed", ttsOn());
}
const fmtDur = s => `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}`;
function askConfirm(name, args) {
  return new Promise(resolve => {
    const lines = ACTIONS[name].describe(args);
    const i = AI.msgs.push({ who: "card", state: "ask", lines, name, args }) - 1;
    AI.pending[i] = resolve; drawAI();
  });
}
async function onCardClick(i, ok) {
  const m = AI.msgs[i], res = AI.pending[i]; if (!m || m.state !== "ask") return;
  delete AI.pending[i];
  if (!ok) { m.state = "cancel"; drawAI(); return res({ cancelado: true }); }
  try { const r = await ACTIONS[m.name].run(m.args); m.state = "done"; drawAI(); res(r); }
  catch (e) { m.state = "error"; m.err = errMsg(e).replace(/^No se ha guardado: /, ""); drawAI(); res({ error: m.err }); }
}
async function sendAI(text, media = []) {
  if ((!text.trim() && !media.length) || AI.busy) return;
  if (Object.keys(AI.pending).length) return toast("Primero guarda o cancela lo que tienes pendiente");
  if (media.length && !aiKey()) { AI.msgs.push({ who: "bot", text: "Para entender fotos y mensajes de voz necesito la IA. Añade tu clave gratuita de Gemini en Ajustes → Asistente con IA. Mientras, puedes dictar con el micrófono del teclado." }); drawAI(); return; }
  AI.msgs.push({ who: "me", text, media }); AI.busy = true; drawAI();
  const before = AI.msgs.length;
  try {
    if (!aiKey()) await basicTurn(text); else await geminiTurn(text, media);
  } catch (e) { AI.msgs.push({ who: "bot", text: e.message || "Ha habido un error." }); }
  AI.busy = false; drawAI();
  if (ttsOn()) { const said = AI.msgs.slice(before).filter(m => m.who === "bot").map(m => m.text).join(" "); if (said) speak(said); }
}
async function basicTurn(text) {
  const c = basicParse(text);
  if (!c) { AI.msgs.push({ who: "bot", text: "No lo he entendido. Prueba con algo como «Añade reunión el lunes a las 9» o «Gasto 12 € supermercado»." }); return; }
  if (!ACTIONS[c.name].write) { AI.msgs.push({ who: "bot", text: agendaText(await ACTIONS[c.name].run(c.args)) }); return; }
  AI.busy = false; drawAI();
  await askConfirm(c.name, c.args);
  AI.busy = true;
}
function agendaText(r) {
  return r.dias.map(d => {
    const parts = [...d.eventos.map(e => `${e.hora === "todo el día" ? "" : e.hora + " "}${e.titulo}${e.festivo ? " (festivo)" : ""}`), ...d.tareas.map(t => "Tarea: " + t), ...d.entreno.map(e => "Entreno: " + e)];
    return `${cap(niceDate(d.fecha))}: ${parts.length ? parts.join("; ") : "nada apuntado"}.`;
  }).join("\n") + (r.tareas_vencidas.length ? `\nTienes ${plural(r.tareas_vencidas.length, "tarea vencida", "tareas vencidas")}: ${r.tareas_vencidas.join(", ")}.` : "");
}
async function geminiTurn(text, media = []) {
  const parts = media.map(m => ({ inlineData: { mimeType: m.mime, data: m.data } }));
  const hint = media.some(m => m.mime.startsWith("audio")) ? "(Mensaje de voz adjunto.)" : media.length ? "(Capturas adjuntas.)" : "";
  parts.push({ text: [text, hint].filter(Boolean).join(" ") });
  AI.history.push({ role: "user", parts });
  try { await geminiLoop(); }
  finally {
    // no volver a enviar fotos ni audios en los siguientes mensajes
    AI.history.forEach(c => c.parts = (c.parts || []).map(p => p.inlineData ? { text: p.inlineData.mimeType.startsWith("audio") ? "[mensaje de voz]" : "[captura]" } : p));
  }
}
async function geminiLoop() {
  for (let step = 0; step < 6; step++) {
    const content = await gemini(AI.history.slice(-30));
    AI.history.push(content);
    const parts = content.parts || [], calls = parts.filter(p => p.functionCall).map(p => p.functionCall);
    const txt = parts.filter(p => p.text && !p.thought).map(p => p.text).join("").trim();
    if (txt) { AI.msgs.push({ who: "bot", text: txt }); drawAI(); }
    if (!calls.length) return;
    const responses = [];
    for (const c of calls) {
      const act = ACTIONS[c.name];
      let result;
      if (!act) result = { error: "Función desconocida" };
      else if (!act.write) { try { result = await act.run(c.args || {}); } catch (e) { result = { error: e.message }; } }
      else { AI.busy = false; drawAI(); result = await askConfirm(c.name, c.args || {}); AI.busy = true; drawAI(); }
      responses.push({ functionResponse: { name: c.name, response: result } });
    }
    AI.history.push({ role: "user", parts: responses });
  }
}

/* ---------- Eventos del panel ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("#aiClose").addEventListener("click", closeAssistant);
  $("#aiForm").addEventListener("submit", e => { e.preventDefault(); const v = $("#aiInput").value; $("#aiInput").value = ""; const media = AI.attach.splice(0); sendAI(v || (media.length ? "Actualiza mis saldos con estas capturas." : ""), media); });
  $("#aiMsgs").addEventListener("click", e => { const b = e.target.closest("[data-ai]"); if (b) onCardClick(+b.dataset.i, b.dataset.ai === "ok"); });
  $("#aiChips").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (b) { $("#aiInput").value = b.dataset.q; $("#aiInput").focus(); } });
  $("#aiNew").addEventListener("click", () => { AI.msgs = []; AI.history = []; AI.pending = {}; AI.attach = []; openAssistant(); });
  $("#aiAttachBtn").addEventListener("click", () => $("#aiFile").click());
  $("#aiFile").addEventListener("change", async e => {
    const files = [...e.target.files].slice(0, 4); e.target.value = "";
    for (const f of files) { try { AI.attach.push(await prepImage(f)); } catch (_) { toast("No he podido leer esa imagen", true); } }
    drawAI();
  });
  $("#aiAttachList").addEventListener("click", e => { const b = e.target.closest("[data-unattach]"); if (b) { AI.attach.splice(+b.dataset.unattach, 1); drawAI(); } });
  $("#aiMic").addEventListener("click", toggleRecording);
  $("#aiRecCancel").addEventListener("click", () => stopRecording(false));
  $("#aiSpeak").addEventListener("click", () => { const on = !ttsOn(); try { localStorage.setItem("mihub-ai-tts", on ? "1" : ""); } catch (_) {} if (on) speak("Te leeré las respuestas en voz alta."); else speechSynthesis.cancel(); drawAI(); });
  $("#aiMsgs").addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) speak(AI.msgs[+b.dataset.say]?.text || ""); });
});

/* ---------- Fotos: se reducen antes de enviarlas ---------- */
function prepImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL("image/jpeg", 0.85);
      const t = document.createElement("canvas"), tk = 120 / Math.max(c.width, c.height); t.width = c.width * tk; t.height = c.height * tk;
      t.getContext("2d").drawImage(c, 0, 0, t.width, t.height);
      URL.revokeObjectURL(url);
      resolve({ mime: "image/jpeg", data: data.split(",")[1], thumb: t.toDataURL("image/jpeg", 0.7) });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen")); };
    img.src = url;
  });
}

/* ---------- Voz: grabar, convertir a WAV y enviar ---------- */
let rec = null, recChunks = [], recStart = 0, recTimer = null, recStream = null;
async function toggleRecording() {
  if (rec) return stopRecording(true);
  if (AI.busy) return;
  if (!aiKey()) { AI.msgs.push({ who: "bot", text: "Para los mensajes de voz necesito la IA. Añade tu clave gratuita de Gemini en Ajustes. Mientras, puedes dictar con el micrófono del teclado." }); drawAI(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Tu navegador no permite grabar audio aquí. Usa el micrófono del teclado.", true);
  try { recStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (_) { return toast("No tengo permiso para usar el micrófono. Actívalo en Ajustes del iPhone → Safari → Micrófono.", true); }
  recChunks = []; rec = new MediaRecorder(recStream);
  rec.ondataavailable = e => e.data.size && recChunks.push(e.data);
  rec.start(); recStart = Date.now();
  $("#aiForm").classList.add("recording");
  recTimer = setInterval(() => { const s = (Date.now() - recStart) / 1000; $("#aiRecTime").textContent = fmtDur(s); if (s >= 120) stopRecording(true); }, 250);
}
function stopRecording(send) {
  if (!rec) return;
  const r = rec, secs = (Date.now() - recStart) / 1000; rec = null;
  clearInterval(recTimer); $("#aiForm").classList.remove("recording"); $("#aiRecTime").textContent = "0:00";
  r.onstop = async () => {
    recStream?.getTracks().forEach(t => t.stop()); recStream = null;
    if (!send) return;
    if (secs < 0.6) return toast("Mantén la grabación un poco más");
    const blob = new Blob(recChunks, { type: r.mimeType || "audio/mp4" });
    let media;
    try { media = await toWav16k(blob); } catch (_) { media = { mime: (blob.type || "audio/mp4").split(";")[0], data: await blobB64(blob) }; }
    sendAI($("#aiInput").value.trim(), [{ ...media, secs }]); $("#aiInput").value = "";
  };
  r.stop();
}
const blobB64 = b => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(",")[1]); f.onerror = rej; f.readAsDataURL(b); });
async function toWav16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
  const buf = await new Promise((res, rej) => { blob.arrayBuffer().then(ab => ac.decodeAudioData(ab, res, rej)).catch(rej); });
  ac.close && ac.close();
  const rate = 16000, len = Math.ceil(buf.duration * rate), off = new OfflineAudioContext(1, len, rate);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  const out = (await off.startRendering()).getChannelData(0);
  const dv = new DataView(new ArrayBuffer(44 + out.length * 2)), w = (o, t) => [...t].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); dv.setUint32(4, 36 + out.length * 2, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, out.length * 2, true);
  for (let i = 0; i < out.length; i++) { const v = Math.max(-1, Math.min(1, out[i])); dv.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
  return { mime: "audio/wav", data: await blobB64(new Blob([dv], { type: "audio/wav" })) };
}

/* ---------- Leer en voz alta ---------- */
const ttsOn = () => { try { return localStorage.getItem("mihub-ai-tts") === "1"; } catch (_) { return false; } };
function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/[*_#•]/g, ""));
  u.lang = "es-ES"; u.rate = 1.02;
  const v = speechSynthesis.getVoices().filter(x => x.lang?.toLowerCase().startsWith("es"));
  u.voice = v.find(x => /es-ES/i.test(x.lang) && /m[oó]nica|paulina|marisol|siri|premium|enhanced|mejorad/i.test(x.name)) || v.find(x => /es-ES/i.test(x.lang)) || v[0] || null;
  speechSynthesis.speak(u);
}

/* ---------- Categorizar con IA los gastos de Apple Pay por revisar ---------- */
let categorizing = false;
document.addEventListener("hub:loaded", async () => {
  if (categorizing || !aiKey() || S.needsMigration) return;
  const pend = S.d.fin_transactions.filter(t => t.needs_review && t.merchant).slice(0, 25);
  if (!pend.length) return;
  categorizing = true;
  try {
    const cats = CATS.map(c => c[0]);
    const prompt = `Categoriza estos pagos con tarjeta hechos en España. Para cada uno elige UNA categoría de esta lista: ${cats.join(", ")}.
Devuelve un JSON: [{"id": "...", "categoria": "..."}]. Si no tienes ni idea, usa "Otros".
${JSON.stringify(pend.map(t => ({ id: t.id, comercio: t.merchant, importe: Number(t.amount) })))}`;
    const c = await gemini([{ role: "user", parts: [{ text: prompt }] }], { json: true, system: "Eres un clasificador de gastos. Responde solo con JSON válido." });
    const txt = (c.parts || []).map(p => p.text || "").join("");
    const arr = JSON.parse(txt.replace(/```json|```/g, "").trim());
    let n = 0;
    for (const r of Array.isArray(arr) ? arr : []) {
      const t = byId("fin_transactions", r.id); if (!t || !cats.includes(r.categoria)) continue;
      await save("fin_transactions", { category: r.categoria, needs_review: false }, t.id);
      if (r.categoria !== "Otros") await learnMerchant(t.merchant, r.categoria);
      n++;
    }
    if (n) { toast(`${plural(n, "gasto de Apple Pay categorizado", "gastos de Apple Pay categorizados")} con IA`); render(); }
  } catch (_) { /* si falla, se reintentará la próxima vez */ } finally { categorizing = false; }
});

/* ---------- Ajustes de la IA ---------- */
ACT.aiSettings = () => {
  formSheet("Asistente con IA", `
    <p class="lead">Para que el asistente entienda cualquier frase usa Gemini, de Google, que tiene una cuota gratuita. Crea tu clave gratis en <b>aistudio.google.com</b> (botón "Get API key") y pégala aquí.</p>
    ${field("Clave de Gemini", `<input class="input" id="aiK" value="${esc(aiKey())}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="AIza…">`, "aiK")}
    ${field("Modelo", sel("aiM", [["gemini-flash-lite-latest", "Gemini Flash-Lite (recomendado)"], ["gemini-flash-latest", "Gemini Flash (más listo, más saturado)"],
      ...(AI_FALLBACKS.includes(aiModel()) ? [] : [[aiModel(), aiModel()]])], aiModel()), "aiM")}
    <p class="hint">La clave se guarda solo en este dispositivo. Flash-Lite es el que tiene más cuota gratuita y menos saturación, y para las tareas del asistente va sobrado. Si un modelo está saturado, la app prueba sola con el otro. Deja la clave vacía para usar el modo básico sin IA.</p>
    <p class="hint">Al usar la IA, lo que escribes al asistente y un resumen de tu agenda se envían a Google para procesarlos. No le cuentes datos sensibles.</p>`, {
    submit: "Guardar",
    onSubmit: async root => {
      const k = val(root, "aiK"), m = val(root, "aiM") || AI_DEFAULT_MODEL;
      try { k ? localStorage.setItem(AI_KEY, k) : localStorage.removeItem(AI_KEY); localStorage.setItem(AI_MODEL, m); } catch (_) { return "No se ha podido guardar en este dispositivo."; }
      AI.msgs = []; AI.history = []; toast(k ? "Clave guardada" : "Modo básico activado");
    }
  });
};
