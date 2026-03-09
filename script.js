const API = "https://migestor-production.up.railway.app/api";

// ══════════════════════════════════════
//  AUTH HELPERS
// ══════════════════════════════════════
function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// ══════════════════════════════════════
//  TOAST
// ══════════════════════════════════════
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.classList.remove("show"); }, 2800);
}

// ══════════════════════════════════════
//  SIDEBAR MOBILE
// ══════════════════════════════════════
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const hamburger = document.getElementById("hamburger");
  const isOpen = sidebar.classList.contains("open");
  if (isOpen) {
    sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("visible");
    if (hamburger) hamburger.classList.remove("active");
  } else {
    sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("visible");
    if (hamburger) hamburger.classList.add("active");
  }
}

document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburger");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (sidebar && sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
    sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("visible");
    if (hamburger) hamburger.classList.remove("active");
  }
});

// ══════════════════════════════════════
//  MODAL CONFIRMACIÓN
// ══════════════════════════════════════
let _modalCallback = null;

function showModal(mensaje, onConfirm) {
  document.getElementById("modal-msg").textContent = mensaje;
  _modalCallback = onConfirm;
  document.getElementById("modal-overlay").classList.add("visible");
}

function modalConfirm() {
  document.getElementById("modal-overlay").classList.remove("visible");
  if (_modalCallback) _modalCallback();
  _modalCallback = null;
}

function modalCancel() {
  document.getElementById("modal-overlay").classList.remove("visible");
  _modalCallback = null;
}

// ══════════════════════════════════════
//  INIT
// ══════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("auth_token");
  const authOverlay = document.getElementById("auth-overlay");
  const app = document.getElementById("app");

  if (!token) {
    authOverlay.style.display = "flex";
    app.style.display = "none";
  } else {
    authOverlay.style.display = "none";
    app.style.display = "flex";
    setUserInfo();
    initApp();
  }
});

function setUserInfo() {
  try {
    const token = localStorage.getItem("auth_token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.email ? payload.email.split("@")[0] : `Usuario #${payload.userId}`;
    const nameEl = document.getElementById("sidebar-name");
    const avatarEl = document.getElementById("sidebar-avatar");
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  } catch (e) { }
}

// Login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("login-error");
  const btn = e.target.querySelector("button[type=submit]");

  btn.textContent = "Entrando...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      window.location.reload();
    } else {
      errorMsg.style.display = "block";
      btn.textContent = "Entrar";
      btn.disabled = false;
    }
  } catch (err) {
    errorMsg.textContent = "Error de conexión con el servidor";
    errorMsg.style.display = "block";
    btn.textContent = "Entrar";
    btn.disabled = false;
  }
});

function logout() {
  localStorage.removeItem("auth_token");
  window.location.reload();
}

// ══════════════════════════════════════
//  TABS
// ══════════════════════════════════════
const PAGE_TITLES = {
  dashboard: "Dashboard",
  gastos: "Gastos",
  ingresos: "Ingresos",
  metas: "Metas de ahorro",
  presupuestos: "Presupuestos",
  graficos: "Análisis"
};

function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = PAGE_TITLES[tab] || tab;
  // Close sidebar on mobile
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const hamburger = document.getElementById("hamburger");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("visible");
  if (hamburger) hamburger.classList.remove("active");

  if (tab === "graficos") loadGraficos();
  if (tab === "dashboard") loadDashboard();
}

// ══════════════════════════════════════
//  RESUMEN (topbar pills)
// ══════════════════════════════════════
async function loadResumen() {
  try {
    const res = await fetch(`${API}/resumen`, { headers: authHeaders() });
    const data = await res.json();
    const ingresos = parseFloat(data.total_ingresos);
    const gastos = parseFloat(data.total_gastos);
    const balance = parseFloat(data.balance);

    // Topbar pills
    document.getElementById("top-ingresos").textContent = `$${ingresos.toFixed(2)}`;
    document.getElementById("top-gastos").textContent = `$${gastos.toFixed(2)}`;
    const topBal = document.getElementById("top-balance");
    topBal.textContent = `${balance < 0 ? "-" : ""}$${Math.abs(balance).toFixed(2)}`;

    // Dashboard cards
    document.getElementById("dash-ingresos").textContent = `$${ingresos.toFixed(2)}`;
    document.getElementById("dash-gastos").textContent = `$${gastos.toFixed(2)}`;

    const dashBal = document.getElementById("dash-balance");
    dashBal.textContent = `${balance < 0 ? "-" : ""}$${Math.abs(balance).toFixed(2)}`;
    dashBal.className = `sc-value ${balance >= 0 ? "positive" : "negative"}`;

    const ahorroEl = document.getElementById("dash-ahorro");
    const ahorroPct = ingresos > 0 ? ((balance / ingresos) * 100).toFixed(1) : "0";
    ahorroEl.textContent = `${ahorroPct}%`;
    ahorroEl.className = `sc-value ${parseFloat(ahorroPct) >= 0 ? "positive" : "negative"}`;

  } catch (error) {
    console.error("Error cargando resumen:", error);
  }
}

// ══════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════
let dashChartEvolucion = null;

async function loadDashboard() {
  await loadResumen();
  await loadDashRecent();
  await loadDashChart();
}

async function loadDashRecent() {
  try {
    const [resG, resI] = await Promise.all([
      fetch(`${API}/gastos`, { headers: authHeaders() }),
      fetch(`${API}/ingresos`, { headers: authHeaders() })
    ]);
    const gastos = await resG.json();
    const ingresos = await resI.json();

    // Combine, tag and sort by date desc, take 8
    const combined = [
      ...gastos.map(g => ({ ...g, _tipo: "expense" })),
      ...ingresos.map(i => ({ ...i, _tipo: "income" }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);

    const list = document.getElementById("dash-recent");
    if (!combined.length) {
      list.innerHTML = '<li class="empty-state">No hay movimientos aún. ¡Añade el primero!</li>';
      return;
    }
    list.innerHTML = combined.map(tx => `
      <li>
        <div class="tx-icon">${CAT_ICONS[tx.categoria] || (tx._tipo === "income" ? "💰" : "📦")}</div>
        <div class="tx-info">
          <strong>${tx.descripcion}</strong>
          <small>${tx.categoria} · ${new Date(tx.fecha).toLocaleDateString("es-ES")}</small>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${tx._tipo === "expense" ? "expense" : "income"}">
            ${tx._tipo === "expense" ? "-" : "+"}$${parseFloat(tx.monto).toFixed(2)}
          </span>
        </div>
      </li>
    `).join("");
  } catch (error) {
    console.error("Error cargando dashboard reciente:", error);
  }
}

async function loadDashChart() {
  try {
    const res = await fetch(`${API}/graficos`, { headers: authHeaders() });
    const data = await res.json();

    if (dashChartEvolucion) dashChartEvolucion.destroy();
    dashChartEvolucion = new Chart(
      document.getElementById("dash-chart-evolucion").getContext("2d"),
      buildBarChartConfig(data.evolucionMensual)
    );
  } catch (error) {
    console.error("Error cargando chart dashboard:", error);
  }
}

// ══════════════════════════════════════
//  CAT ICONS
// ══════════════════════════════════════
const CAT_ICONS = {
  Comida: "🍔", Transporte: "🚗", Ocio: "🎬", Renta: "🏠", Salud: "💊",
  Educación: "📚", Ropa: "👕", Suscripciones: "📱", Otros: "📦",
  Salario: "💼", Freelance: "💻", Inversión: "📈", Regalo: "🎁",
  Bono: "⭐", Alquiler: "🏘️"
};

// ══════════════════════════════════════
//  GASTOS
// ══════════════════════════════════════
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Guardando...";
  btn.disabled = true;
  const data = {
    descripcion: document.getElementById("desc").value,
    monto: parseFloat(document.getElementById("amount").value),
    categoria: document.getElementById("cat").value,
  };
  try {
    const res = await fetch(`${API}/gastos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      e.target.reset();
      loadExpenses();
      loadResumen();
      showToast("✅ Gasto añadido correctamente");
    } else {
      const err = await res.json();
      showToast("Error: " + err.error, "error");
    }
  } catch (error) {
    showToast("No se pudo conectar con el servidor.", "error");
  } finally {
    btn.textContent = "+ Añadir gasto";
    btn.disabled = false;
  }
});

async function loadExpenses() {
  try {
    const res = await fetch(`${API}/gastos`, { headers: authHeaders() });
    const gastos = await res.json();
    const list = document.getElementById("expenses-list");
    if (!gastos.length) {
      list.innerHTML = '<li class="empty-state">No hay gastos registrados aún</li>';
      return;
    }
    list.innerHTML = gastos.map(g => `
      <li>
        <div class="tx-icon">${CAT_ICONS[g.categoria] || "📦"}</div>
        <div class="tx-info">
          <strong>${g.descripcion}</strong>
          <small>${g.categoria} · ${new Date(g.fecha).toLocaleDateString("es-ES")}</small>
        </div>
        <div class="tx-right">
          <span class="tx-amount expense">-$${parseFloat(g.monto).toFixed(2)}</span>
          <button type="button" class="btn-delete" onclick="deleteGasto(${g.id})" title="Eliminar">✕</button>
        </div>
      </li>
    `).join("");
  } catch (error) {
    console.error("Error cargando gastos:", error);
  }
}

async function deleteGasto(id) {
  showModal("¿Eliminar este gasto?", async () => {
    try {
      await fetch(`${API}/gastos/${id}`, { method: "DELETE", headers: authHeaders() });
      loadExpenses();
      loadResumen();
      showToast("🗑️ Gasto eliminado");
    } catch (error) {
      showToast("Error al eliminar el gasto.", "error");
    }
  });
}

// ══════════════════════════════════════
//  INGRESOS
// ══════════════════════════════════════
document.getElementById("income-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Guardando...";
  btn.disabled = true;
  const data = {
    descripcion: document.getElementById("inc-desc").value,
    monto: parseFloat(document.getElementById("inc-amount").value),
    categoria: document.getElementById("inc-cat").value,
  };
  try {
    const res = await fetch(`${API}/ingresos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      e.target.reset();
      loadIncome();
      loadResumen();
      showToast("✅ Ingreso añadido correctamente");
    } else {
      const err = await res.json();
      showToast("Error: " + err.error, "error");
    }
  } catch (error) {
    showToast("No se pudo conectar con el servidor.", "error");
  } finally {
    btn.textContent = "+ Añadir ingreso";
    btn.disabled = false;
  }
});

async function loadIncome() {
  try {
    const res = await fetch(`${API}/ingresos`, { headers: authHeaders() });
    const ingresos = await res.json();
    const list = document.getElementById("income-list");
    if (!ingresos.length) {
      list.innerHTML = '<li class="empty-state">No hay ingresos registrados aún</li>';
      return;
    }
    list.innerHTML = ingresos.map(g => `
      <li>
        <div class="tx-icon">${CAT_ICONS[g.categoria] || "💰"}</div>
        <div class="tx-info">
          <strong>${g.descripcion}</strong>
          <small>${g.categoria} · ${new Date(g.fecha).toLocaleDateString("es-ES")}</small>
        </div>
        <div class="tx-right">
          <span class="tx-amount income">+$${parseFloat(g.monto).toFixed(2)}</span>
          <button type="button" class="btn-delete" onclick="deleteIngreso(${g.id})" title="Eliminar">✕</button>
        </div>
      </li>
    `).join("");
  } catch (error) {
    console.error("Error cargando ingresos:", error);
  }
}

async function deleteIngreso(id) {
  showModal("¿Eliminar este ingreso?", async () => {
    try {
      await fetch(`${API}/ingresos/${id}`, { method: "DELETE", headers: authHeaders() });
      loadIncome();
      loadResumen();
      showToast("🗑️ Ingreso eliminado");
    } catch (error) {
      showToast("Error al eliminar el ingreso.", "error");
    }
  });
}

// ══════════════════════════════════════
//  METAS
// ══════════════════════════════════════
document.getElementById("meta-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Creando...";
  btn.disabled = true;
  const data = {
    nombre: document.getElementById("meta-nombre").value,
    monto_objetivo: parseFloat(document.getElementById("meta-objetivo").value),
    monto_actual: parseFloat(document.getElementById("meta-inicial").value || 0),
  };
  try {
    const res = await fetch(`${API}/metas`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      e.target.reset();
      loadMetas();
      showToast("🎯 Meta creada correctamente");
    } else {
      const err = await res.json();
      showToast("Error: " + err.error, "error");
    }
  } catch (error) {
    showToast("No se pudo conectar con el servidor.", "error");
  } finally {
    btn.textContent = "🎯 Crear meta";
    btn.disabled = false;
  }
});

async function loadMetas() {
  try {
    const res = await fetch(`${API}/metas`, { headers: authHeaders() });
    const metas = await res.json();
    const container = document.getElementById("metas-list");
    if (!metas || !metas.length) {
      container.innerHTML = '<p class="vacio-metas">No tienes metas creadas aún</p>';
      return;
    }
    container.innerHTML = metas.map(m => {
      const objetivo = parseFloat(m.monto_objetivo);
      const actual = parseFloat(m.monto_actual);
      const pct = Math.min((actual / objetivo) * 100, 100).toFixed(1);
      const completada = actual >= objetivo;
      return `
        <div class="meta-card ${completada ? "meta-completada" : ""}">
          <div class="meta-header">
            <span class="meta-nombre">${completada ? "✅" : "🎯"} ${m.nombre}</span>
            <button type="button" class="btn-delete" onclick="deleteMeta(${m.id})" title="Eliminar">✕</button>
          </div>
          <div class="meta-montos">
            <span>$${actual.toFixed(2)} <small>de $${objetivo.toFixed(2)}</small></span>
            <span class="meta-pct">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${completada ? "progress-done" : ""}" style="width: ${pct}%"></div>
          </div>
          ${completada
          ? '<p class="meta-logro">¡Meta alcanzada! 🎉</p>'
          : `<div class="meta-abonar">
                <input type="number" id="abono-${m.id}" placeholder="Abonar $" step="0.01" min="0.01" />
                <button onclick="abonarMeta(${m.id})">Abonar</button>
               </div>`
        }
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Error cargando metas:", error);
  }
}

async function abonarMeta(id) {
  const input = document.getElementById(`abono-${id}`);
  const monto = parseFloat(input.value);
  if (!monto || monto <= 0) { showToast("Introduce un monto válido.", "error"); return; }
  try {
    const res = await fetch(`${API}/metas/${id}/abonar`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ monto }),
    });
    if (res.ok) {
      loadMetas();
      showToast("💰 Abono registrado");
    } else {
      const err = await res.json();
      showToast("Error: " + err.error, "error");
    }
  } catch (error) {
    showToast("No se pudo conectar con el servidor.", "error");
  }
}

async function deleteMeta(id) {
  showModal("¿Eliminar esta meta de ahorro?", async () => {
    try {
      await fetch(`${API}/metas/${id}`, { method: "DELETE", headers: authHeaders() });
      loadMetas();
      showToast("🗑️ Meta eliminada");
    } catch (error) {
      showToast("Error al eliminar la meta.", "error");
    }
  });
}

// ══════════════════════════════════════
//  PRESUPUESTOS
// ══════════════════════════════════════
const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.getElementById("presupuesto-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Guardando...";
  btn.disabled = true;
  const data = {
    categoria: document.getElementById("pres-categoria").value,
    limite: parseFloat(document.getElementById("pres-limite").value),
  };
  try {
    const res = await fetch(`${API}/presupuestos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      e.target.reset();
      loadPresupuestos();
      showToast("✅ Presupuesto guardado");
    } else {
      const err = await res.json();
      showToast("Error: " + err.error, "error");
    }
  } catch (error) {
    showToast("No se pudo conectar con el servidor.", "error");
  } finally {
    btn.textContent = "Guardar presupuesto";
    btn.disabled = false;
  }
});

async function loadPresupuestos() {
  const now = new Date();
  const mesLabel = document.getElementById("pres-mes");
  if (mesLabel) mesLabel.textContent = `${MESES_ES[now.getMonth()]} ${now.getFullYear()}`;

  try {
    const res = await fetch(`${API}/presupuestos`, { headers: authHeaders() });
    const data = await res.json();
    const container = document.getElementById("presupuestos-list");
    if (!container) return;

    if (!data.length) {
      container.innerHTML = '<p class="pres-empty">No hay presupuestos definidos aún.<br>Añade uno para empezar a controlar tus categorías.</p>';
      return;
    }

    container.innerHTML = data.map(p => {
      const gastado = parseFloat(p.gastado_mes) || 0;
      const limite = parseFloat(p.limite);
      const pct = Math.min((gastado / limite) * 100, 100).toFixed(0);
      const estado = pct >= 100 ? "danger" : pct >= 75 ? "warning" : "ok";
      const icon = CAT_ICONS[p.categoria] || "📦";
      return `
        <div class="presupuesto-item">
          <div class="pres-header">
            <div class="pres-cat">
              <div class="pres-cat-icon">${icon}</div>
              ${p.categoria}
            </div>
            <div class="pres-amounts">
              <span class="pres-gastado">$${gastado.toFixed(2)}</span>
              <span class="pres-limite-txt"> / $${limite.toFixed(2)}</span>
            </div>
          </div>
          <div class="pres-bar-wrap">
            <div class="pres-bar">
              <div class="pres-bar-fill ${estado}" style="width:${pct}%"></div>
            </div>
            <span class="pres-pct ${estado}">${pct}%</span>
          </div>
          <div class="pres-actions">
            <button type="button" class="btn-delete" onclick="deletePresupuesto(${p.id})" title="Eliminar">✕ Eliminar</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Error cargando presupuestos:", error);
  }
}

async function deletePresupuesto(id) {
  showModal("¿Eliminar este presupuesto?", async () => {
    try {
      await fetch(`${API}/presupuestos/${id}`, { method: "DELETE", headers: authHeaders() });
      loadPresupuestos();
      showToast("🗑️ Presupuesto eliminado");
    } catch (error) {
      showToast("Error al eliminar el presupuesto.", "error");
    }
  });
}

// ══════════════════════════════════════
//  GRÁFICOS
// ══════════════════════════════════════
let chartGastosCat = null, chartIngresosCat = null, chartEvolucion = null;

const CHART_COLORS = [
  "#6366f1", "#10b981", "#0ea5e9", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
];

function buildBarChartConfig(evolucionMensual) {
  return {
    type: "bar",
    data: {
      labels: evolucionMensual.map(r => r.label),
      datasets: [
        {
          label: "Ingresos",
          data: evolucionMensual.map(r => r.total_ingresos),
          backgroundColor: "rgba(16,185,129,0.7)",
          borderColor: "#10b981",
          borderWidth: 1, borderRadius: 6
        },
        {
          label: "Gastos",
          data: evolucionMensual.map(r => r.total_gastos),
          backgroundColor: "rgba(239,68,68,0.65)",
          borderColor: "#ef4444",
          borderWidth: 1, borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { color: "#94a3b8", font: { family: "Inter, sans-serif", size: 11 }, boxWidth: 12 } },
        tooltip: { backgroundColor: "#111827", titleColor: "#f1f5f9", bodyColor: "#94a3b8", callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}` } }
      },
      scales: {
        x: { ticks: { color: "#475569", font: { family: "Inter, sans-serif", size: 11 } }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { beginAtZero: true, ticks: { color: "#475569", font: { family: "Inter, sans-serif", size: 11 }, callback: v => `$${v}` }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  };
}

async function loadGraficos() {
  try {
    const res = await fetch(`${API}/graficos`, { headers: authHeaders() });
    const data = await res.json();

    const donutOptions = {
      plugins: {
        legend: { position: "bottom", labels: { color: "#94a3b8", font: { family: "Inter, sans-serif", size: 11 }, boxWidth: 12, padding: 16 } },
        tooltip: { backgroundColor: "#111827", titleColor: "#f1f5f9", bodyColor: "#94a3b8", callbacks: { label: ctx => ` $${ctx.parsed.toFixed(2)}` } }
      }
    };

    if (chartGastosCat) chartGastosCat.destroy();
    chartGastosCat = new Chart(document.getElementById("chart-gastos-cat").getContext("2d"), {
      type: "doughnut",
      data: {
        labels: data.gastosPorCategoria.map(r => r.categoria),
        datasets: [{ data: data.gastosPorCategoria.map(r => r.total), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: "#111827" }]
      },
      options: donutOptions
    });

    if (chartIngresosCat) chartIngresosCat.destroy();
    chartIngresosCat = new Chart(document.getElementById("chart-ingresos-cat").getContext("2d"), {
      type: "doughnut",
      data: {
        labels: data.ingresosPorCategoria.map(r => r.categoria),
        datasets: [{ data: data.ingresosPorCategoria.map(r => r.total), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: "#111827" }]
      },
      options: donutOptions
    });

    if (chartEvolucion) chartEvolucion.destroy();
    chartEvolucion = new Chart(
      document.getElementById("chart-evolucion").getContext("2d"),
      buildBarChartConfig(data.evolucionMensual)
    );
  } catch (error) {
    console.error("Error cargando gráficos:", error);
  }
}

// ══════════════════════════════════════
//  INIT APP
// ══════════════════════════════════════
function initApp() {
  loadExpenses();
  loadIncome();
  loadMetas();
  loadPresupuestos();
  loadDashboard();
}