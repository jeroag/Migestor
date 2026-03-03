const sql = require('./src/db');
sql`SELECT 1`
  .then(() => console.log('Conexion OK'))
  .catch(e => console.error('Error:', e.message));
