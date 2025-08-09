import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default async function runMigrations(pool) {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();
    for (const file of sqlFiles) {
      const full = path.join(migrationsDir, file);
      const sql = await fs.readFile(full, 'utf8');
      if (sql.trim().length === 0) continue;
      await pool.query(sql);
      console.log(`[migrate] applied ${file}`);
    }
  } catch (err) {
    // If directory missing, skip silently (non-disruptive)
    if (err.code === 'ENOENT') {
      console.log('[migrate] no migrations directory, skipping');
      return;
    }
    console.error('[migrate] error', err);
    throw err;
  }
}


