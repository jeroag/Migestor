require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require' // Esto es fundamental para Supabase
});

module.exports = sql;
