/**
 * Reset the SQLite database (DELETES ALL DATA)
 * Run: npm run db:reset
 */
const path = require('path')
const fs   = require('fs')

const DB_PATH = path.join(__dirname, '..', 'data', 'synaptic_local.db')

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH)
  console.log('🗑  Database deleted:', DB_PATH)
  console.log('   A fresh database will be created on next server start.')
} else {
  console.log('ℹ  No database found at:', DB_PATH)
}
