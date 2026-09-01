import pool from './db.js';

async function migrate() {
  try {
    console.log('Starting non-destructive database migration...');
    await pool.query('BEGIN');
    
    // Add columns if they don't exist
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local';`);
    
    // Make password_hash nullable
    await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);
    
    await pool.query('COMMIT');
    console.log('Migration successful.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
