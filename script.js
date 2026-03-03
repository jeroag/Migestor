// CORRECCIÓN: Se añade el protocolo https:// y el prefijo /api para coincidir con el servidor
const API = 'https://migestor-production.up.railway.app/api'; 

// ==================
//  PESTAÑAS
// ==================
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
}

// ==================
//  RESUMEN
// ==================
async function loadResumen() {
    try {
        const res = await fetch(`${API}/resumen`);
        const data = await res.json();

        document.getElementById('total-ingresos').textContent = `$${data.total_ingresos.toFixed(2)}`;
        document.getElementById('total-gastos').textContent = `$${data.total_gastos.toFixed(2)}`;

        const balanceEl = document.getElementById('balance');
        balanceEl.textContent = `$${data.balance.toFixed(2)}`;
        balanceEl.className = data.balance >= 0 ? 'positivo' : 'negativo';
    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

// ==================
//  GASTOS
// ==================
document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        descripcion: document.getElementById('desc').value,
        monto: parseFloat(document.getElementById('amount').value),
        categoria: document.getElementById('cat').value
    };
    try {
        const res = await fetch(`${API}/gastos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            e.target.reset();
            loadExpenses();
            loadResumen();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        alert('No se pudo conectar con el servidor.');
    }
});

async function loadExpenses() {
    try {
        const res = await fetch(`${API}/gastos`);
        const gastos = await res.json();
        const list = document.getElementById('expenses-list');
        if (gastos.length === 0) {
            list.innerHTML = '<li class="vacio">No hay gastos registrados</li>';
            return;
        }
        list.innerHTML = gastos.map(g => `
            <li>
                <div class="item-info">
                    <strong>${g.descripcion}</strong>
                    <small>${g.categoria} · ${new Date(g.fecha).toLocaleDateString('es-ES')}</small>
                </div>
                <div class="item-right">
                    <span class="monto-gasto">-$${parseFloat(g.monto).toFixed(2)}</span>
                    <button class="btn-delete" onclick="deleteGasto(${g.id})">🗑️</button>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error cargando gastos:', error);
        alert('Error cargando gastos.');
    }
}

async function deleteGasto(id) {
    if(!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
        await fetch(`${API}/gastos/${id}`, { method: 'DELETE' });
        loadExpenses();
        loadResumen();
    } catch (error) {
        alert('Error al eliminar el gasto.');
    }
}

// ==================
//  INGRESOS
// ==================
document.getElementById('income-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        descripcion: document.getElementById('inc-desc').value,
        monto: parseFloat(document.getElementById('inc-amount').value),
        categoria: document.getElementById('inc-cat').value
    };
    try {
        const res = await fetch(`${API}/ingresos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            e.target.reset();
            loadIncome();
            loadResumen();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        alert('No se pudo conectar con el servidor.');
    }
});

async function loadIncome() {
    try {
        const res = await fetch(`${API}/ingresos`);
        const ingresos = await res.json();
        const list = document.getElementById('income-list');
        if (!ingresos || ingresos.length === 0) {
            list.innerHTML = '<li class="vacio">No hay ingresos registrados</li>';
            return;
        }
        list.innerHTML = ingresos.map(i => `
            <li>
                <div class="item-info">
                    <strong>${i.descripcion}</strong>
                    <small>${i.categoria} · ${new Date(i.fecha).toLocaleDateString('es-ES')}</small>
                </div>
                <div class="item-right">
                    <span class="monto-ingreso">+$${parseFloat(i.monto).toFixed(2)}</span>
                    <button class="btn-delete" onclick="deleteIngreso(${i.id})">🗑️</button>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error cargando ingresos:', error);
        alert('Error cargando ingresos.');
    }
}

async function deleteIngreso(id) {
    if(!confirm('¿Estás seguro de eliminar este ingreso?')) return;
    try {
        await fetch(`${API}/ingresos/${id}`, { method: 'DELETE' });
        loadIncome();
        loadResumen();
    } catch (error) {
        alert('Error al eliminar el ingreso.');
    }
}

// ==================
//  INICIO
// ==================
// Se ejecutan las funciones de carga al iniciar la página
loadExpenses();
loadIncome();
loadResumen();