const express = require('express');
const cors = require('cors');
const sql = require('./src/db');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==================
//  RUTAS DE GASTOS
// ==================

app.get('/gastos', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM gastos ORDER BY fecha DESC`;
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/gastos', async (req, res) => {
    const { descripcion, monto, categoria } = req.body;
    if (!descripcion || !monto || !categoria) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
        await sql`INSERT INTO gastos (descripcion, monto, categoria) VALUES (${descripcion}, ${parseFloat(monto)}, ${categoria})`;
        res.status(201).json({ mensaje: 'Gasto guardado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/gastos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql`DELETE FROM gastos WHERE id = ${id}`;
        res.json({ mensaje: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================
//  RUTAS DE INGRESOS
// ==================

app.get('/ingresos', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM ingresos ORDER BY fecha DESC`;
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/ingresos', async (req, res) => {
    const { descripcion, monto, categoria } = req.body;
    if (!descripcion || !monto || !categoria) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
        await sql`INSERT INTO ingresos (descripcion, monto, categoria) VALUES (${descripcion}, ${parseFloat(monto)}, ${categoria})`;
        res.status(201).json({ mensaje: 'Ingreso guardado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/ingresos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql`DELETE FROM ingresos WHERE id = ${id}`;
        res.json({ mensaje: 'Ingreso eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================
//  RESUMEN / BALANCE
// ==================

app.get('/resumen', async (req, res) => {
    try {
        const [{ total_gastos }] = await sql`SELECT COALESCE(SUM(monto), 0) AS total_gastos FROM gastos`;
        const [{ total_ingresos }] = await sql`SELECT COALESCE(SUM(monto), 0) AS total_ingresos FROM ingresos`;
        res.json({
            total_gastos: parseFloat(total_gastos),
            total_ingresos: parseFloat(total_ingresos),
            balance: parseFloat(total_ingresos) - parseFloat(total_gastos)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));