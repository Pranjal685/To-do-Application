import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;
import prisma from './prisma/client.js';

// Legacy pool connection (for migration period - can be removed later)
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Export both during migration period
export { pool };
export { prisma };
export default prisma; 