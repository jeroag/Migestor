const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false // IMPORTANTE: Supabase Pooler requiere esto en 'false' a veces
});

module.exports = sql;