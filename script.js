const API = "https://migestor-production.up.railway.app/api";

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
    const res = await fetch(`${API}/resumen`);
    const data = await res.json();
    document.getElementById("total-ingresos").textContent = `$${data.total_ingresos.toFixed(2)}`;
    document.getElementById("total-gastos").textContent = `$${data.total_gastos.toFixed(2)}`;
    const balanceEl = document.getElementById("balance");
    balanceEl.textContent = `$${data.balance.toFixed(2)}`;
    balanceEl.className = data.balance >= 0 ? "positivo" : "negativo";
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
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API}/gastos`);
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
  if (!confirm("¿Eliminar este gasto?")) return;
  try {
    await fetch(`${API}/gastos/${id}`, { method: "DELETE" });
    loadExpenses();
    loadResumen();
  } catch (error) {
    alert("Error al eliminar el gasto.");
  }
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
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API}/ingresos`);
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
  if (!confirm("¿Eliminar este ingreso?")) return;
  try {
    await fetch(`${API}/ingresos/${id}`, { method: "DELETE" });
    loadIncome();
    loadResumen();
  } catch (error) {
    alert("Error al eliminar el ingreso.");
  }
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
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`${API}/metas`);
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
      headers: { "Content-Type": "application/json" },
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
  if (!confirm("¿Eliminar esta meta de ahorro?")) return;
  try {
    await fetch(`${API}/metas/${id}`, { method: "DELETE" });
    loadMetas();
  } catch (error) {
    alert("Error al eliminar la meta.");
  }
}

// ==================
//  GRÁFICOS
// ==================
const COLORS = [
  "#4e79a7","#f28e2b","#e15759","#76b7b2",
  "#59a14f","#edc948","#b07aa1","#ff9da7","#9c755f"
];

function destroyChart(instance) {
  if (instance) instance.destroy();
}

async function loadGraficos() {
  try {
    const res = await fetch(`${API}/graficos`);
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
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${ctx.parsed.toFixed(2)}`
            }
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
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${ctx.parsed.toFixed(2)}`
            }
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
            backgroundColor: "#59a14f",
            borderRadius: 4
          },
          {
            label: "Gastos",
            data: data.evolucionMensual.map(r => r.total_gastos),
            backgroundColor: "#e15759",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => `$${v}`
            }
          }
        }
      }
    });

  } catch (error) {
    console.error("Error cargando gráficos:", error);
  }
}

// ==================
//  INICIO
// ==================
loadExpenses();
loadIncome();
loadResumen();
loadMetas();