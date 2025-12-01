const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'DESKTOP-GU60EVI\\SQLEXPRESS',
  database: 'GAS_',
  user: 'sa',
  password: '23L-0592',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed:', err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };