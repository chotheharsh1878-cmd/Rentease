/**
 * RentEase Database Initializer
 * Reads database.sql and seed.sql to automatically create schema and populate initial data.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function initializeDatabase() {
  console.log('🔄 Connecting to MySQL server on', `${config.host}:${config.port}...`);
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL server.');

    // 1. Run database.sql
    const schemaFile = path.join(__dirname, 'database.sql');
    if (fs.existsSync(schemaFile)) {
      console.log('📦 Executing database.sql schema...');
      const schemaSql = fs.readFileSync(schemaFile, 'utf8');
      await connection.query(schemaSql);
      console.log('✅ Schema created successfully!');
    } else {
      console.warn('⚠️ database.sql not found at', schemaFile);
    }

    // 2. Run seed.sql
    const seedFile = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedFile)) {
      console.log('🌱 Executing seed.sql with realistic demo data...');
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Seed data inserted successfully!');
    } else {
      console.warn('⚠️ seed.sql not found at', seedFile);
    }

    console.log('🎉 RentEase MySQL database setup is COMPLETE!');
    console.log('   Database name: rentease');
    console.log('   Ready for server boot.');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n👉 Tips: Make sure MySQL server is running on localhost:3306.');
      console.error('   In Windows, you can start MySQL from Windows Services or XAMPP / WampServer / MySQL Workbench.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n👉 Tips: Check DB_USER and DB_PASSWORD in rentease/server/.env file.');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();

