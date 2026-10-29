// server.js — VOISEGUARD backend.
// Stores every call received through Exotel (number, name, time, recording).
// NOTE: this server only STORES call data. It does not do any AI / scam detection.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import db, { phoneKey, lookupName } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// ---------- Config ----------
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY || '';
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN || '';

// Audio files live on disk here; the database only stores the file name.
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- App + middleware ----------
const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// ---------- Helpers ----------

// Exotel sends "YYYY-MM-DD HH:MM:SS" in IST. Convert to ISO 8601 UTC.
// Example: "2026-10-28 20:00:00" → "2026-10-28T14:30:00.000Z"
function toIsoTime(value) {
  if (value) {
    const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(String(value).trim());
    const date = match ? new Date(`${match[1]}T${match[2]}+05:30`) : new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString(); // missing or invalid → now
}

// Add the audio_url field the frontend uses to play the recording.
function withAudioUrl(call) {
  return { ...call, audio_url: call.audio_status === 'saved' ? `/api/calls/${call.id}/audio` : null };
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Prepared SQL statements ----------
const sql = {
  allCalls: db.prepare('SELECT * FROM calls ORDER BY call_time DESC'),
  callById: db.prepare('SELECT * FROM calls WHERE id = ?'),
  callBySid: db.prepare('SELECT * FROM calls WHERE call_sid = ?'),
  insertCall: db.prepare(`
    INSERT INTO calls (call_sid, phone_number, phone_key, caller_name, call_time,
                       duration_seconds, call_status, recording_url, audio_path, audio_status, source)
    VALUES (@call_sid, @phone_number, @phone_key, @caller_name, @call_time,
            @duration_seconds, @call_status, @recording_url, @audio_path, @audio_status, @source)
  `),
  // COALESCE keeps the old value when Exotel sends an empty field on a repeat hit.
  updateExotelCall: db.prepare(`
    UPDATE calls SET
      recording_url    = COALESCE(@recording_url, recording_url),
      call_status      = COALESCE(@call_status, call_status),
      duration_seconds = COALESCE(@duration_seconds, duration_seconds)
    WHERE call_sid = @call_sid
  `),
  setAudio: db.prepare('UPDATE calls SET audio_path = ?, audio_status = ? WHERE id = ?'),
  setAudioStatus: db.prepare('UPDATE calls SET audio_status = ? WHERE id = ?'),
  deleteCall: db.prepare('DELETE FROM calls WHERE id = ?'),

  allContacts: db.prepare('SELECT * FROM contacts ORDER BY name COLLATE NOCASE'),
  upsertContact: db.prepare(`
    INSERT INTO contacts (phone_key, phone_number, name) VALUES (?, ?, ?)
    ON CONFLICT(phone_key) DO UPDATE SET phone_number = excluded.phone_number, name = excluded.name
  `),
  contactByKey: db.prepare('SELECT * FROM contacts WHERE phone_key = ?'),
  nameEarlierCalls: db.prepare(
    "UPDATE calls SET caller_name = ? WHERE phone_key = ? AND caller_name = 'Unknown Caller'"
  ),
  deleteContact: db.prepare('DELETE FROM contacts WHERE phone_key = ?'),
};

// ---------- Recording download (runs in the background) ----------
// The recording may not be ready right after the call, so retry a few times.
async function downloadRecording(callId, recordingUrl) {
  const MAX_ATTEMPTS = 6;
  const WAIT_MS = 15_000;

  const headers = {};
  if (EXOTEL_API_KEY && EXOTEL_API_TOKEN) {
    const credentials = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(recordingUrl, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

      const ext = path.extname(new URL(recordingUrl).pathname) || '.mp3';
      const fileName = `call-${callId}${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, fileName), Buffer.from(await response.arrayBuffer()));

      sql.setAudio.run(fileName, 'saved', callId);
      console.log(`Recording for call ${callId} saved as ${fileName}`);
      return;
    } catch (err) {
      lastError = err;
      console.log(`Recording for call ${callId}: attempt ${attempt}/${MAX_ATTEMPTS} failed (${err.message})`);
      if (attempt < MAX_ATTEMPTS) await sleep(WAIT_MS);
    }
  }

  sql.setAudioStatus.run('failed', callId);
  console.error(`Recording for call ${callId} could not be downloaded: ${lastError?.message}`);
}

// ---------- Exotel webhook (Passthru applet, HTTP GET) ----------
app.get('/api/exotel/passthru', (req, res) => {
  const q = req.query;

  // 1) Simple shared-secret check so strangers can't add fake calls.
  if (WEBHOOK_TOKEN && q.token !== WEBHOOK_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  // 2) Required fields.
  const callSid = q.CallSid;
  const from = q.CallFrom || q.From;
  if (!callSid || !from) {
    return res.status(400).json({ error: 'CallSid and CallFrom are required' });
  }

  const details = {
    call_sid: callSid,
    recording_url: q.RecordingUrl || null,
    call_status: q.DialCallStatus || null,
    duration_seconds: toInt(q.DialCallDuration),
  };

  // 3) Insert the first time; on repeat hits only fill in new details.
  if (!sql.callBySid.get(callSid)) {
    sql.insertCall.run({
      ...details,
      phone_number: from,
      phone_key: phoneKey(from),
      caller_name: lookupName(from),
      call_time: toIsoTime(q.StartTime || q.Created),
      audio_path: null,
      audio_status: 'none',
      source: 'exotel',
    });
  } else {
    sql.updateExotelCall.run(details);
  }

  // 4) Answer Exotel right away.
  res.type('text/plain').send('OK');

  // 5) Then fetch the recording in the background (only once per call).
  const call = sql.callBySid.get(callSid);
  if (call.recording_url && call.audio_status === 'none') {
    sql.setAudioStatus.run('pending', call.id);
    downloadRecording(call.id, call.recording_url).catch((err) => {
      sql.setAudioStatus.run('failed', call.id);
      console.error(`Recording download crashed for call ${call.id}:`, err);
    });
  }
});

// ---------- Calls ----------
app.get('/api/calls', (req, res) => {
  res.json(sql.allCalls.all().map(withAudioUrl));
});

app.get('/api/calls/:id', (req, res) => {
  const call = sql.callById.get(req.params.id);
  if (!call) return res.status(404).json({ error: 'Call not found' });
  res.json(withAudioUrl(call));
});

// res.sendFile handles Range requests, so the <audio> player can seek.
app.get('/api/calls/:id/audio', (req, res) => {
  const call = sql.callById.get(req.params.id);
  if (!call || call.audio_status !== 'saved' || !call.audio_path) {
    return res.status(404).json({ error: 'Audio not found' });
  }
  res.sendFile(path.join(UPLOADS_DIR, call.audio_path));
});

// Manual upload — lets you test without Exotel.
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `manual-${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    const err = new Error('Only audio files are allowed');
    err.status = 400;
    cb(err);
  },
});

app.post('/api/calls', upload.single('audio'), (req, res) => {
  const { phone_number, caller_name, call_time } = req.body ?? {};

  if (!phone_number) {
    if (req.file) fs.rmSync(req.file.path, { force: true }); // don't keep orphan files
    return res.status(400).json({ error: 'phone_number is required' });
  }

  const result = sql.insertCall.run({
    call_sid: null,
    phone_number,
    phone_key: phoneKey(phone_number),
    caller_name: caller_name || lookupName(phone_number),
    call_time: toIsoTime(call_time),
    duration_seconds: null,
    call_status: null,
    recording_url: null,
    audio_path: req.file ? req.file.filename : null,
    audio_status: req.file ? 'saved' : 'none',
    source: 'manual',
  });

  res.status(201).json(withAudioUrl(sql.callById.get(result.lastInsertRowid)));
});

app.delete('/api/calls/:id', (req, res) => {
  const call = sql.callById.get(req.params.id);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  if (call.audio_path) fs.rmSync(path.join(UPLOADS_DIR, call.audio_path), { force: true });
  sql.deleteCall.run(call.id);
  res.json({ deleted: true, id: call.id });
});

// ---------- Contacts ----------
app.get('/api/contacts', (req, res) => {
  res.json(sql.allContacts.all());
});

app.post('/api/contacts', (req, res) => {
  const { phone_number, name } = req.body ?? {};
  if (!phone_number || !name) {
    return res.status(400).json({ error: 'phone_number and name are required' });
  }

  const key = phoneKey(phone_number);
  sql.upsertContact.run(key, phone_number, name);
  // Earlier calls from this number that had no name now get one.
  sql.nameEarlierCalls.run(name, key);

  res.status(201).json(sql.contactByKey.get(key));
});

app.delete('/api/contacts/:phone', (req, res) => {
  const result = sql.deleteContact.run(phoneKey(req.params.phone));
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ deleted: true });
});

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------- Error handler (must be last) ----------
app.use((err, req, res, next) => {
  const status = err instanceof multer.MulterError || err.status === 400 ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message || 'Server error' });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`VOISEGUARD backend running on http://localhost:${PORT}`);
});
