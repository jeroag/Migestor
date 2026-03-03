const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false, // OBLIGATORIO para evitar el error "Tenant not found"
  connection: {
    application_name: 'migestor'
  }
});

module.exports = sql;