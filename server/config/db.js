/**
 * RentEase MySQL Database Connection Pool
 * Uses mysql2/promise for async/await queries and safe parameter binding.
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rentease',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
});

// Test connection on module load
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ [MySQL] Connected successfully to database: "${process.env.DB_NAME || 'rentease'}" on ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [MySQL Connection Error]:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.warn('⚠️ Database "rentease" does not exist yet! Run: npm run db:init inside server folder.');
    } else if (error.code === 'ECONNREFUSED') {
      console.warn('⚠️ Unable to reach MySQL server on port 3306. Please ensure MySQL service is started.');
    }
    return false;
  }
}

testConnection();

module.exports = {
  pool,
  testConnection
};

