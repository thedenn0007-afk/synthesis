/**
 * Initialize the SQLite database
 * Run: npm run db:init
 * Or: node scripts/init-db.js
 */
const path = require('path')
const fs   = require('fs')

const DB_DIR  = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'synaptic_local.db')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

try {
  const Database = require('better-sqlite3')
  const db = new Database(DB_PATH)
  // Use MEMORY journal mode — safe on all filesystems (incl. network/virtual mounts).
  // For production on a dedicated server, you can switch to WAL for better concurrency.
  db.pragma('journal_mode = MEMORY')
  db.pragma('foreign_keys = ON')
  console.log('✅ SQLite database initialised at:', DB_PATH)
  console.log('   Tables are created automatically on first server start.')
  db.close()
} catch (err) {
  console.error('❌ Failed to initialise database:', err.message)
  console.error('   Make sure to run: npm install')
  process.exit(1)
}
