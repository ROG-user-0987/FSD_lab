// db.js — SQLite connection, table creation and small helpers.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Connection ----------
// The whole database lives in one file next to this script.
const db = new Database(path.join(__dirname, 'voiseguard.db'));
db.pragma('journal_mode = WAL'); // better read/write concurrency

// ---------- Tables ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    call_sid         TEXT UNIQUE,                         -- Exotel call ID (NULL for manual uploads)
    phone_number     TEXT NOT NULL,                       -- number exactly as received
    phone_key        TEXT NOT NULL,                       -- last 10 digits, used to match contacts
    caller_name      TEXT NOT NULL DEFAULT 'Unknown Caller',
    call_time        TEXT NOT NULL,                       -- ISO 8601 UTC
    duration_seconds INTEGER,
    call_status      TEXT,                                -- completed / no-answer / busy ...
    recording_url    TEXT,                                -- Exotel's original recording link
    audio_path       TEXT,                                -- file name inside uploads/
    audio_status     TEXT NOT NULL DEFAULT 'none',        -- none / pending / saved / failed
    source           TEXT NOT NULL DEFAULT 'exotel',      -- exotel / manual
    created_at       TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_calls_call_time ON calls (call_time DESC);

  -- Exotel does not send caller names, so names come from this table.
  CREATE TABLE IF NOT EXISTS contacts (
    phone_key    TEXT PRIMARY KEY,                        -- last 10 digits
    phone_number TEXT NOT NULL,
    name         TEXT NOT NULL
  );
`);

// ---------- Helpers ----------

// "+91 98765 43210", "09876543210", "9876543210" → "9876543210"
export function phoneKey(number) {
  return String(number ?? '').replace(/\D/g, '').slice(-10);
}

// Name saved in contacts for this number, or "Unknown Caller".
const findContact = db.prepare('SELECT name FROM contacts WHERE phone_key = ?');
export function lookupName(number) {
  return findContact.get(phoneKey(number))?.name ?? 'Unknown Caller';
}

export default db;
