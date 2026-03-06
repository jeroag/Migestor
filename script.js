const API = "https://migestor-production.up.railway.app/api";

// ==================
//  HELPER AUTH
// ==================
function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// ==================
//  MODAL
// ==================
let _modalCallback = null;
// Al inicio del script.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("auth_token");
  const authOverlay = document.getElementById("auth-overlay");

  if (!token) {
    document.body.classList.add("not-logged-in");
    authOverlay.style.display = "flex";
  } else {
    document.body.classList.remove("not-logged-in");
    authOverlay.style.display = "none";
    initApp(); // Función que carga tus datos actuales
  }
});

// Lógica del formulario de Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("login-error");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      window.location.reload(); // Recargamos para mostrar la app
    } else {
      errorMsg.style.display = "block";
    }
  } catch (err) {
    console.error("Error login:", err);
    alert("Error de conexión con el servidor");
  }
});

// Función para cerrar sesión (puedes poner un botón en el header)
function logout() {
  localStorage.removeItem("auth_token");
  window.location.reload();
}

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


// Chart instances
let chartGastosCat = null;
let chartIngresosCat = null;
let chartEvolucion = null;

// ==================
//  PESTAÑAS
// ==================
function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add("active");
  if (tab === "graficos") loadGraficos();
}

// ==================
//  RESUMEN
// ==================
async function loadResumen() {
  try {
    const res = await fetch(`${API}/resumen`, { headers: authHeaders() });
    const data = await res.json();
    document.getElementById("total-ingresos").textContent = `$${data.total_ingresos.toFixed(2)}`;
    document.getElementById("total-gastos").textContent = `$${data.total_gastos.toFixed(2)}`;
    const balanceEl = document.getElementById("balance");
    balanceEl.textContent = `$${data.balance.toFixed(2)}`;
    balanceEl.className = data.balance >= 0 ? "resumen-value orange" : "resumen-value red";
    const hb = document.getElementById("hb-balance");
    if (hb) hb.textContent = `BALANCE ${data.balance >= 0 ? "▲" : "▼"} $${Math.abs(data.balance).toFixed(2)}`;
  } catch (error) {
    console.error("Error cargando resumen:", error);
  }
}

// ==================
//  GASTOS
// ==================
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
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
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }
});

async function loadExpenses() {
  try {
    const res = await fetch(`${API}/gastos`, { headers: authHeaders() });
    const gastos = await res.json();
    const list = document.getElementById("expenses-list");
    if (gastos.length === 0) {
      list.innerHTML = '<li class="vacio">No hay gastos registrados</li>';
      return;
    }
    list.innerHTML = gastos.map((g) => `
      <li>
        <div class="item-info">
          <strong>${g.descripcion}</strong>
          <small>${g.categoria} · ${new Date(g.fecha).toLocaleDateString("es-ES")}</small>
        </div>
        <div class="item-right">
          <span class="monto-gasto">-$${parseFloat(g.monto).toFixed(2)}</span>
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
    } catch (error) {
      alert("Error al eliminar el gasto.");
    }
  });
}

// ==================
//  INGRESOS
// ==================
document.getElementById("income-form").addEventListener("submit", async (e) => {
  e.preventDefault();
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
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }
});

async function loadIncome() {
  try {
    const res = await fetch(`${API}/ingresos`, { headers: authHeaders() });
    const ingresos = await res.json();
    const list = document.getElementById("income-list");
    if (!ingresos || ingresos.length === 0) {
      list.innerHTML = '<li class="vacio">No hay ingresos registrados</li>';
      return;
    }
    list.innerHTML = ingresos.map((i) => `
      <li>
        <div class="item-info">
          <strong>${i.descripcion}</strong>
          <small>${i.categoria} · ${new Date(i.fecha).toLocaleDateString("es-ES")}</small>
        </div>
        <div class="item-right">
          <span class="monto-ingreso">+$${parseFloat(i.monto).toFixed(2)}</span>
          <button type="button" class="btn-delete" onclick="deleteIngreso(${i.id})" title="Eliminar">✕</button>
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
    } catch (error) {
      alert("Error al eliminar el ingreso.");
    }
  });
}

// ========================
//  METAS DE AHORRO
// ========================
document.getElementById("meta-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    nombre: document.getElementById("meta-nombre").value,
    monto_objetivo: parseFloat(document.getElementById("meta-objetivo").value),
    monto_actual: parseFloat(document.getElementById("meta-inicial").value) || 0,
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
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }
});

async function loadMetas() {
  try {
    const res = await fetch(`${API}/metas`, { headers: authHeaders() });
    const metas = await res.json();
    const container = document.getElementById("metas-list");
    if (!metas || metas.length === 0) {
      container.innerHTML = '<p class="vacio-metas">No tienes metas creadas aún</p>';
      return;
    }
    container.innerHTML = metas.map((m) => {
      const objetivo = parseFloat(m.monto_objetivo);
      const actual = parseFloat(m.monto_actual);
      const pct = Math.min((actual / objetivo) * 100, 100).toFixed(1);
      const completada = actual >= objetivo;
      return `
        <div class="meta-card ${completada ? 'meta-completada' : ''}">
          <div class="meta-header">
            <span class="meta-nombre">${completada ? '✅' : '🎯'} ${m.nombre}</span>
            <button type="button" class="btn-delete" onclick="deleteMeta(${m.id})" title="Eliminar">✕</button>
          </div>
          <div class="meta-montos">
            <span>$${actual.toFixed(2)} <small>de $${objetivo.toFixed(2)}</small></span>
            <span class="meta-pct">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${completada ? 'progress-done' : ''}" style="width: ${pct}%"></div>
          </div>
          ${completada
            ? '<p class="meta-logro">¡Meta alcanzada! 🎉</p>'
            : `<div class="meta-abonar">
                <input type="number" id="abono-${m.id}" placeholder="Abonar $" step="0.01" min="0.01" />
                <button onclick="abonarMeta(${m.id})">💰 Abonar</button>
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
  if (!monto || monto <= 0) {
    alert("Introduce un monto válido.");
    return;
  }
  try {
    const res = await fetch(`${API}/metas/${id}/abonar`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ monto }),
    });
    if (res.ok) {
      loadMetas();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }
}

async function deleteMeta(id) {
  showModal("¿Eliminar esta meta de ahorro?", async () => {
    try {
      await fetch(`${API}/metas/${id}`, { method: "DELETE", headers: authHeaders() });
      loadMetas();
    } catch (error) {
      alert("Error al eliminar la meta.");
    }
  });
}

// ==================
//  GRÁFICOS
// ==================
const COLORS = [
  "#E8921A","#38BDF8","#4ADE80","#F87171",
  "#A78BFA","#FBBF24","#FFB347","#67e8f9","#86efac"
];

function destroyChart(instance) {
  if (instance) instance.destroy();
}

async function loadGraficos() {
  try {
    const res = await fetch(`${API}/graficos`, { headers: authHeaders() });
    const data = await res.json();

    // --- Gastos por categoría (Doughnut) ---
    destroyChart(chartGastosCat);
    const ctxG = document.getElementById("chart-gastos-cat").getContext("2d");
    chartGastosCat = new Chart(ctxG, {
      type: "doughnut",
      data: {
        labels: data.gastosPorCategoria.map(r => r.categoria),
        datasets: [{
          data: data.gastosPorCategoria.map(r => r.total),
          backgroundColor: COLORS,
          borderWidth: 2,
          borderColor: "#fff"
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#C8D8E8", font: { family: "'Share Tech Mono', monospace", size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: "#14181F",
            borderColor: "#3A4A5C",
            borderWidth: 1,
            titleColor: "#E8F0F8",
            bodyColor: "#C8D8E8",
            callbacks: { label: (ctx) => ` $${ctx.parsed.toFixed(2)}` }
          }
        }
      }
    });

    // --- Ingresos por categoría (Doughnut) ---
    destroyChart(chartIngresosCat);
    const ctxI = document.getElementById("chart-ingresos-cat").getContext("2d");
    chartIngresosCat = new Chart(ctxI, {
      type: "doughnut",
      data: {
        labels: data.ingresosPorCategoria.map(r => r.categoria),
        datasets: [{
          data: data.ingresosPorCategoria.map(r => r.total),
          backgroundColor: COLORS,
          borderWidth: 2,
          borderColor: "#fff"
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#C8D8E8", font: { family: "'Share Tech Mono', monospace", size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: "#14181F",
            borderColor: "#3A4A5C",
            borderWidth: 1,
            titleColor: "#E8F0F8",
            bodyColor: "#C8D8E8",
            callbacks: { label: (ctx) => ` $${ctx.parsed.toFixed(2)}` }
          }
        }
      }
    });

    // --- Evolución mensual (Bar) ---
    destroyChart(chartEvolucion);
    const ctxE = document.getElementById("chart-evolucion").getContext("2d");
    chartEvolucion = new Chart(ctxE, {
      type: "bar",
      data: {
        labels: data.evolucionMensual.map(r => r.label),
        datasets: [
          {
            label: "Ingresos",
            data: data.evolucionMensual.map(r => r.total_ingresos),
            backgroundColor: "rgba(74,222,128,0.7)",
            borderColor: "#4ADE80",
            borderWidth: 1,
            borderRadius: 0
          },
          {
            label: "Gastos",
            data: data.evolucionMensual.map(r => r.total_gastos),
            backgroundColor: "rgba(248,113,113,0.7)",
            borderColor: "#F87171",
            borderWidth: 1,
            borderRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: "#C8D8E8", font: { family: "'Share Tech Mono', monospace", size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: "#14181F",
            borderColor: "#3A4A5C",
            borderWidth: 1,
            titleColor: "#E8F0F8",
            bodyColor: "#C8D8E8",
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}` }
          }
        },
        scales: {
          x: { ticks: { color: "#6A7A8A", font: { family: "'Share Tech Mono', monospace", size: 10 } }, grid: { color: "rgba(42,50,64,0.5)" } },
          y: { beginAtZero: true, ticks: { color: "#6A7A8A", font: { family: "'Share Tech Mono', monospace", size: 10 }, callback: (v) => `$${v}` }, grid: { color: "rgba(42,50,64,0.5)" } }
        }
      }
    });

  } catch (error) {
    console.error("Error cargando gráficos:", error);
  }
}

function renderPresupuestos(presupuestos, gastos) {
  const container = document.getElementById('presupuestos-list');
  container.innerHTML = presupuestos.map(p => {
    const gastado = gastos.filter(g => g.categoria === p.categoria)
                          .reduce((acc, curr) => acc + curr.monto, 0);
    const porcentaje = Math.min((gastado / p.monto_limite) * 100, 100);
    const color = porcentaje > 90 ? 'var(--red)' : 'var(--accent)';

    return `
      <div class="budget-item">
        <span>${p.categoria}</span>
        <div class="progress-bar-bg">
          <div class="progress-fill" style="width: ${porcentaje}%; background: ${color}"></div>
        </div>
        <small>$${gastado} / $${p.monto_limite}</small>
      </div>
    `;
  }).join('');
}

// ==================
//  INICIO
// ==================
loadExpenses();
loadIncome();
loadResumen();
loadMetas();