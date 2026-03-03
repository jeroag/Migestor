const postgres = require('postgres');
require('dotenv').config();

// Extraemos la URL de la variable de entorno
const connectionString = process.env.DATABASE_URL;

const sql = postgres(connectionString, {
  ssl: 'require', // OBLIGATORIO para Supabase en producción
  connect_timeout: 30, // Da un poco más de margen para conectar
});

module.exports = sql;