const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false,      // Esto evita errores de protocolo con el Pooler de Supabase
  connect_timeout: 30  // Da más tiempo para la conexión inicial
});

module.exports = sql;