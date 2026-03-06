const express = require("express");
const cors = require("cors");
const sql = require("./src/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- MIDDLEWARE JWT ---
// Ahora req.user.userId está disponible en todas las rutas protegidas
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ==================
//  LOGIN (pública)
// ==================

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { nombre: user.nombre } });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  } catch (error) {
    console.error("Error en POST /api/login:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================
//  RUTAS DE GASTOS
// ==================

app.get("/api/gastos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const rows = await sql`
      SELECT * FROM gastos
      WHERE usuario_id = ${userId}
      ORDER BY fecha DESC
    `;
    res.json(rows);
  } catch (error) {
    console.error("Error en GET /api/gastos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gastos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { descripcion, monto, categoria } = req.body;
  if (!descripcion || !monto || !categoria) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    await sql`
      INSERT INTO gastos (descripcion, monto, categoria, usuario_id)
      VALUES (${descripcion}, ${parseFloat(monto)}, ${categoria}, ${userId})
    `;
    res.status(201).json({ mensaje: "Gasto guardado" });
  } catch (error) {
    console.error("Error en POST /api/gastos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/gastos/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    // El WHERE usuario_id evita que alguien borre datos ajenos
    await sql`DELETE FROM gastos WHERE id = ${id} AND usuario_id = ${userId}`;
    res.json({ mensaje: "Gasto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================
//  RUTAS DE INGRESOS
// ==================

app.get("/api/ingresos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const rows = await sql`
      SELECT * FROM ingresos
      WHERE usuario_id = ${userId}
      ORDER BY fecha DESC
    `;
    res.json(rows);
  } catch (error) {
    console.error("Error en GET /api/ingresos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ingresos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { descripcion, monto, categoria } = req.body;
  if (!descripcion || !monto || !categoria) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    await sql`
      INSERT INTO ingresos (descripcion, monto, categoria, usuario_id)
      VALUES (${descripcion}, ${parseFloat(monto)}, ${categoria}, ${userId})
    `;
    res.status(201).json({ mensaje: "Ingreso guardado" });
  } catch (error) {
    console.error("Error en POST /api/ingresos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/ingresos/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    await sql`DELETE FROM ingresos WHERE id = ${id} AND usuario_id = ${userId}`;
    res.json({ mensaje: "Ingreso eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================
//  RESUMEN / BALANCE
// ==================

app.get("/api/resumen", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [{ total_gastos }] = await sql`
      SELECT COALESCE(SUM(monto), 0) AS total_gastos
      FROM gastos
      WHERE usuario_id = ${userId}
    `;
    const [{ total_ingresos }] = await sql`
      SELECT COALESCE(SUM(monto), 0) AS total_ingresos
      FROM ingresos
      WHERE usuario_id = ${userId}
    `;
    res.json({
      total_gastos: parseFloat(total_gastos),
      total_ingresos: parseFloat(total_ingresos),
      balance: parseFloat(total_ingresos) - parseFloat(total_gastos),
    });
  } catch (error) {
    console.error("Error en GET /api/resumen:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================
//  DATOS PARA GRÁFICOS
// ==================

app.get("/api/graficos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const gastosPorCategoria = await sql`
      SELECT categoria, COALESCE(SUM(monto), 0) AS total
      FROM gastos
      WHERE usuario_id = ${userId}
      GROUP BY categoria
      ORDER BY total DESC
    `;

    const ingresosPorCategoria = await sql`
      SELECT categoria, COALESCE(SUM(monto), 0) AS total
      FROM ingresos
      WHERE usuario_id = ${userId}
      GROUP BY categoria
      ORDER BY total DESC
    `;

    const evolucionMensual = await sql`
      SELECT
        TO_CHAR(mes, 'Mon YY') AS label,
        COALESCE(g.total_gastos, 0) AS total_gastos,
        COALESCE(i.total_ingresos, 0) AS total_ingresos
      FROM (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '5 months'),
          date_trunc('month', NOW()),
          '1 month'
        ) AS mes
      ) meses
      LEFT JOIN (
        SELECT date_trunc('month', fecha) AS mes, SUM(monto) AS total_gastos
        FROM gastos WHERE usuario_id = ${userId} GROUP BY 1
      ) g USING (mes)
      LEFT JOIN (
        SELECT date_trunc('month', fecha) AS mes, SUM(monto) AS total_ingresos
        FROM ingresos WHERE usuario_id = ${userId} GROUP BY 1
      ) i USING (mes)
      ORDER BY mes
    `;

    res.json({
      gastosPorCategoria: gastosPorCategoria.map(r => ({
        categoria: r.categoria,
        total: parseFloat(r.total)
      })),
      ingresosPorCategoria: ingresosPorCategoria.map(r => ({
        categoria: r.categoria,
        total: parseFloat(r.total)
      })),
      evolucionMensual: evolucionMensual.map(r => ({
        label: r.label,
        total_gastos: parseFloat(r.total_gastos),
        total_ingresos: parseFloat(r.total_ingresos)
      }))
    });
  } catch (error) {
    console.error("Error en GET /api/graficos:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================
//  RUTAS DE METAS DE AHORRO
// ========================

app.get("/api/metas", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    const rows = await sql`
      SELECT * FROM metas
      WHERE usuario_id = ${userId}
      ORDER BY fecha_creacion DESC
    `;
    res.json(rows);
  } catch (error) {
    console.error("Error en GET /api/metas:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/metas", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { nombre, monto_objetivo, monto_actual } = req.body;
  if (!nombre || !monto_objetivo) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    await sql`
      INSERT INTO metas (nombre, monto_objetivo, monto_actual, usuario_id)
      VALUES (${nombre}, ${parseFloat(monto_objetivo)}, ${parseFloat(monto_actual || 0)}, ${userId})
    `;
    res.status(201).json({ mensaje: "Meta creada" });
  } catch (error) {
    console.error("Error en POST /api/metas:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/metas/:id/abonar", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { monto } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: "Monto inválido" });
  }
  try {
    await sql`
      UPDATE metas
      SET monto_actual = monto_actual + ${parseFloat(monto)}
      WHERE id = ${id} AND usuario_id = ${userId}
    `;
    res.json({ mensaje: "Abono registrado" });
  } catch (error) {
    console.error("Error en PATCH /api/metas/:id/abonar:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/metas/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    await sql`DELETE FROM metas WHERE id = ${id} AND usuario_id = ${userId}`;
    res.json({ mensaje: "Meta eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================
//  RUTAS DE PRESUPUESTOS
// ==========================

app.get("/api/presupuestos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();
  try {
    // Devuelve cada presupuesto junto con lo gastado en el mes actual
    const rows = await sql`
      SELECT
        p.id,
        p.categoria,
        p.limite,
        COALESCE(SUM(g.monto), 0) AS gastado_mes
      FROM presupuestos p
      LEFT JOIN gastos g
        ON g.categoria = p.categoria
        AND g.usuario_id = p.usuario_id
        AND EXTRACT(MONTH FROM g.fecha) = ${mes}
        AND EXTRACT(YEAR  FROM g.fecha) = ${anio}
      WHERE p.usuario_id = ${userId}
      GROUP BY p.id, p.categoria, p.limite
      ORDER BY p.categoria ASC
    `;
    res.json(rows.map(r => ({
      id: r.id,
      categoria: r.categoria,
      limite: parseFloat(r.limite),
      gastado_mes: parseFloat(r.gastado_mes)
    })));
  } catch (error) {
    console.error("Error en GET /api/presupuestos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/presupuestos", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { categoria, limite } = req.body;
  if (!categoria || !limite) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    // Si ya existe un presupuesto para esa categoría, lo actualiza
    await sql`
      INSERT INTO presupuestos (usuario_id, categoria, limite)
      VALUES (${userId}, ${categoria}, ${parseFloat(limite)})
      ON CONFLICT (usuario_id, categoria)
      DO UPDATE SET limite = ${parseFloat(limite)}
    `;
    res.status(201).json({ mensaje: "Presupuesto guardado" });
  } catch (error) {
    console.error("Error en POST /api/presupuestos:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/presupuestos/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    await sql`DELETE FROM presupuestos WHERE id = ${id} AND usuario_id = ${userId}`;
    res.json({ mensaje: "Presupuesto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PUERTO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});