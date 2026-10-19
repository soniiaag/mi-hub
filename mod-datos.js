"use strict";
/* =====================================================================
   Datos personales: documentos, coche, emergencias y caducidades
   ===================================================================== */
const ALERT_DAYS = 60;
const PRESETS = [
  { kind: "dni", cat: "Documentos", label: "DNI", num: "Número de DNI", exp: "Fecha de caducidad", secret: true },
  { kind: "pasaporte", cat: "Documentos", label: "Pasaporte", num: "Número de pasaporte", exp: "Fecha de caducidad", secret: true },
  { kind: "carnet", cat: "Documentos", label: "Carnet de conducir", num: "Número", exp: "Fecha de caducidad", secret: true },
  { kind: "tsi", cat: "Documentos", label: "Tarjeta sanitaria", num: "Código (CIP)", exp: "Fecha de caducidad", secret: true },
  { kind: "nss", cat: "Documentos", label: "Nº de la Seguridad Social", num: "Número", secret: true },
  { kind: "matricula", cat: "Coche", label: "Matrícula", num: "Matrícula", notes: "Marca y modelo" },
  { kind: "itv", cat: "Coche", label: "ITV", exp: "Fecha de la próxima ITV" },
  { kind: "seguro_coche", cat: "Coche", label: "Seguro del coche", num: "Compañía y nº de póliza", exp: "Fecha de renovación" },
  { kind: "grupo_sanguineo", cat: "Salud y emergencias", label: "Grupo sanguíneo", num: "Grupo (por ejemplo, A+)" },
  { kind: "emergencia", cat: "Salud y emergencias", label: "Contacto de emergencia", num: "Nombre y teléfono" }
];
const presetOf = k => PRESETS.find(p => p.kind === k);
const itemOf = kind => S.d.personal_items.find(x => x.kind === kind);
const daysTo = k => Math.round((fromKey(k) - startOfDay(new Date())) / 864e5);
S.ui.reveal = {};

function expiringItems() {
  return S.d.personal_items.filter(x => x.expires_on && daysTo(x.expires_on) <= ALERT_DAYS)
    .sort((a, b) => a.expires_on.localeCompare(b.expires_on));
}
function expiryText(x) {
  const n = daysTo(x.expires_on), d = esc(fmt(fromKey(x.expires_on), { day: "numeric", month: "long", year: "numeric" }));
  const verb = x.kind === "itv" ? "toca" : x.kind === "seguro_coche" ? "se renueva" : "caduca";
  if (n < 0) return `<span class="exp bad">${x.kind === "itv" ? "Pasada" : "Caducado"} desde el ${d}</span>`;
  if (n === 0) return `<span class="exp bad">${cap(verb)} hoy</span>`;
  return `<span class="exp ${n <= ALERT_DAYS ? "warn" : ""}">${cap(verb)} el ${d}${n <= ALERT_DAYS ? `, faltan ${plural(n, "día", "días")}` : ""}</span>`;
}
const mask = v => !v ? "" : v.length <= 4 ? "••••" : "•".repeat(Math.min(8, v.length - 4)) + v.slice(-4);

/* =====================================================================
   Vista
   ===================================================================== */
MOD.datos = {
  render() {
    const alerts = expiringItems();
    let h = modHead("Mis datos");
    if (alerts.length) h += `<div class="alert-box">${alerts.map(x => `<div><b>${esc(x.label)}</b>${expiryText(x)}</div>`).join("")}</div>`;
    const cats = [...new Set([...PRESETS.map(p => p.cat), ...S.d.personal_items.filter(x => !presetOf(x.kind)).map(x => x.category || "Otros")])];
    cats.forEach(c => {
      const pres = PRESETS.filter(p => p.cat === c);
      const custom = S.d.personal_items.filter(x => !presetOf(x.kind) && (x.category || "Otros") === c).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
      h += `<div class="block"><h2>${esc(c)}</h2><div class="list">`;
      pres.forEach(p => h += dataRow(itemOf(p.kind), p));
      custom.forEach(x => h += dataRow(x, null));
      h += `</div></div>`;
    });
    h += `<p class="hint">Guárdalo con cabeza: no apuntes aquí contraseñas, PIN ni números completos de tarjeta. Los números de documentos se muestran ocultos hasta que tocas el ojo.</p>`;
    return h;
  },
  fab: () => ({ label: "Añadir otro dato", fn: () => openData(null, null) })
};
function dataRow(x, p) {
  const label = p ? p.label : x.label, secret = p?.secret || false, shown = S.ui.reveal[x?.id];
  if (!x || (!x.value && !x.expires_on && !x.notes)) {
    return `<button class="row data-row empty-data" data-act="editData" data-kind="${p ? p.kind : ""}" data-id="${x?.id || ""}">
      <span class="body"><span class="title">${esc(label)}</span><span class="meta">Sin rellenar</span></span><span class="add-mini">Añadir</span></button>`;
  }
  return `<div class="data-row">
    <button class="dr-main" data-act="editData" data-kind="${p ? p.kind : ""}" data-id="${x.id}">
      <span class="title">${esc(label)}</span>
      ${x.value ? `<span class="dv">${esc(secret && !shown ? mask(x.value) : x.value)}</span>` : ""}
      ${x.notes ? `<span class="meta">${esc(x.notes)}</span>` : ""}
      ${x.expires_on ? expiryText(x) : ""}
    </button>
    <div class="dr-tools">
      ${x.value && secret ? `<button class="icon-xs" data-act="revealData" data-id="${x.id}" aria-label="${shown ? "Ocultar" : "Mostrar"} ${esc(label)}">${shown ? "🙈" : "👁"}</button>` : ""}
      ${x.value ? `<button class="icon-xs" data-act="copyData" data-id="${x.id}" aria-label="Copiar ${esc(label)}">⧉</button>` : ""}
    </div>
  </div>`;
}

/* =====================================================================
   Acciones
   ===================================================================== */
ACT.revealData = (el, d) => { S.ui.reveal[d.id] = !S.ui.reveal[d.id]; render(); };
ACT.copyData = async (el, d) => {
  const x = byId("personal_items", d.id);
  try { await navigator.clipboard.writeText(x.value); toast("Copiado"); } catch (_) { toast("No se ha podido copiar", true); }
};
ACT.editData = (el, d) => openData(d.id ? byId("personal_items", d.id) : null, d.kind ? presetOf(d.kind) : null);

function openData(x, p) {
  const custom = !p;
  formSheet(p ? p.label : (x ? x.label : "Nuevo dato"), `
    ${custom ? field("Nombre", inp("pdL", x?.label || "", 'placeholder="Por ejemplo: Abono de transporte" maxlength="60"'), "pdL") +
      field("Sección", `<input class="input" id="pdC" list="pdCats" value="${esc(x?.category || "Otros")}" maxlength="40"><datalist id="pdCats">${[...new Set([...PRESETS.map(q => q.cat), "Otros", ...S.d.personal_items.map(q => q.category).filter(Boolean)])].map(c => `<option value="${esc(c)}">`).join("")}</datalist>`, "pdC") : ""}
    ${!p || p.num ? field(p?.num || "Dato", inp("pdV", x?.value || "", 'autocomplete="off" autocapitalize="characters"'), "pdV") : ""}
    ${!p || p.exp ? field(p?.exp || "Fecha de caducidad (opcional)", `<input type="date" class="input" id="pdE" value="${esc(x?.expires_on || "")}">`, "pdE") : ""}
    ${field(p?.notes || "Notas", area("pdN", x?.notes), "pdN")}
    ${!p || p.exp ? `<p class="hint">Al guardar una fecha, se añaden solos a tu calendario de Mi Hub dos avisos: ${ALERT_DAYS} días antes y el mismo día. Además, verás el aviso en la página de inicio.</p>` : ""}`, {
    onSubmit: async root => {
      const row = { value: $("#pdV", root) ? (val(root, "pdV") || null) : null, expires_on: $("#pdE", root) ? (val(root, "pdE") || null) : null, notes: val(root, "pdN") || null };
      if (custom) { row.label = val(root, "pdL"); row.category = val(root, "pdC") || "Otros"; if (!row.label) return "Ponle un nombre."; }
      else { row.kind = p.kind; row.label = p.label; row.category = p.cat; }
      const saved = await save("personal_items", row, x?.id);
      if (!x || x.expires_on !== saved.expires_on || x.label !== saved.label) await syncReminders(saved);
      toast(saved.expires_on && (!x || x.expires_on !== saved.expires_on) ? "Guardado y aviso añadido al calendario" : "Guardado");
    },
    onDelete: x ? async () => { await clearReminders(x.id); await remove("personal_items", x.id); } : null, deleteLabel: custom ? "Eliminar" : "Borrar este dato"
  });
}

/* ---------- Recordatorios ---------- */
function reminderDates(x) {
  const exp = fromKey(x.expires_on), warn = addDays(exp, -ALERT_DAYS), today = startOfDay(new Date());
  const out = [];
  if (warn > today) out.push([warn, `faltan ${ALERT_DAYS} días`]);
  if (exp >= today) out.push([exp, x.kind === "itv" ? "hoy toca la ITV" : x.kind === "seguro_coche" ? "hoy se renueva" : "caduca hoy"]);
  return out;
}
async function clearReminders(itemId) {
  await removeIds("events", S.d.events.filter(e => e.source === "doc:" + itemId).map(e => e.id));
}
/* Mantiene en el calendario de Mi Hub los avisos de cada documento */
async function syncReminders(x) {
  await clearReminders(x.id);
  if (!x.expires_on) return;
  const rows = reminderDates(x).map(([d, what]) => ({ title: `${x.label}: ${what}`, all_day: true, start_at: startOfDay(d).toISOString(),
    end_at: endOfDay(d).toISOString(), color: "coral", recur: "none", source: "doc:" + x.id }));
  await insertMany("events", rows);
}
