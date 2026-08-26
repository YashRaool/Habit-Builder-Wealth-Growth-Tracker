import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new PGlite('./pglite-data');

// Initialize schema on startup
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
await db.exec(schema);

export default db;
