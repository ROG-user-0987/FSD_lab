import React from "react";
import { useState, useEffect } from "react";
import "./app.css";

// Backend from the backend/ folder (npm run dev inside backend/)
const API = "http://localhost:5000";

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// What to show for each audio_status from the backend
const AUDIO_LABELS = {
  saved: "RECORDED",
  pending: "DOWNLOADING",
  failed: "AUDIO FAILED",
  none: "NO AUDIO",
};

function App() {
  const [calls, setCalls] = useState([]);
  const [online, setOnline] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("WAITING");
  const [analyzing, setAnalyzing] = useState(false);

  const [form, setForm] = useState({ phone_number: "", caller_name: "" });
  const [file, setFile] = useState(null);
  const [contactName, setContactName] = useState("");
  const [message, setMessage] = useState("");

  async function loadCalls() {
    try {
      const res = await fetch(`${API}/api/calls`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCalls(await res.json());
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }

  // Load calls at start, then check for new ones every 5 seconds
  useEffect(() => {
    loadCalls();
    const timer = setInterval(loadCalls, 5000);
    return () => clearInterval(timer);
  }, []);

  // Selected call, or the newest one if nothing is selected
  const selected = calls.find((c) => c.id === selectedId) || calls[0];

  const recorded = calls.filter((c) => c.audio_status === "saved").length;
  const unknown = calls.filter((c) => c.caller_name === "Unknown Caller").length;

  function selectCall(id) {
    if (analyzing) return;
    setSelectedId(id);
    setScore(0);
    setStatus("WAITING");
    setContactName("");
  }

  // Simulated analysis (no real AI)
  function analyzeCall() {
    setAnalyzing(true);
    setStatus("ANALYZING");
    setScore(0);

    let value = 0;

    const timer = setInterval(() => {
      value += 10;
      setScore(value);

      if (value >= 90) {
        clearInterval(timer);
        setAnalyzing(false);
        setStatus("HIGH RISK");
      }
    }, 120);
  }

  // Manual upload: stands in for a call coming from Exotel
  async function uploadCall(e) {
    e.preventDefault();
    const formElement = e.target;

    const data = new FormData();
    data.append("phone_number", form.phone_number);
    if (form.caller_name) data.append("caller_name", form.caller_name);
    if (file) data.append("audio", file);

    try {
      const res = await fetch(`${API}/api/calls`, { method: "POST", body: data });
      const body = await res.json();
      if (!res.ok) return setMessage(body.error);

      setMessage("Call saved.");
      setForm({ phone_number: "", caller_name: "" });
      setFile(null);
      formElement.reset();
      await loadCalls();
      selectCall(body.id);
    } catch {
      setMessage("Backend is offline.");
    }
  }

  // Give an unknown number a name (also renames its earlier calls)
  async function saveContact() {
    if (!contactName.trim()) return;
    try {
      await fetch(`${API}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: selected.phone_number, name: contactName.trim() }),
      });
      setContactName("");
      loadCalls();
    } catch {
      setMessage("Backend is offline.");
    }
  }

  async function deleteCall() {
    if (!window.confirm(`Delete the call from ${selected.phone_number}?`)) return;
    try {
      await fetch(`${API}/api/calls/${selected.id}`, { method: "DELETE" });
      selectCall(null);
      loadCalls();
    } catch {
      setMessage("Backend is offline.");
    }
  }

  return (
    <div className="app">

      <nav className="navbar">
        <h2>◉ VOISE<span>GUARD</span></h2>
        <div className={online ? "online" : "offline"}>
          ● {online ? "SYSTEM ONLINE" : "BACKEND OFFLINE"}
        </div>
      </nav>

      <main>

        <section className="hero">
          <div>
            <p className="tag">AI SECURITY SYSTEM</p>

            <h1>
              Voice Scam
              <br />
              <span>Detection</span>
            </h1>

            <p className="description">
              Analyze suspicious calls and detect possible
              AI-generated or fraudulent voice patterns.
            </p>
          </div>

          <div className="ai-orb">
            <div>AI</div>
          </div>
        </section>

        <section className="stats">

          <div className="card">
            <p>CALLS RECEIVED</p>
            <h2>{calls.length}</h2>
          </div>

          <div className="card">
            <p>RECORDINGS SAVED</p>
            <h2>{recorded}</h2>
          </div>

          <div className="card safe">
            <p>KNOWN CALLERS</p>
            <h2>{calls.length - unknown}</h2>
          </div>

          <div className="card danger">
            <p>UNKNOWN CALLERS</p>
            <h2>{unknown}</h2>
          </div>

        </section>

        <section className="analysis">

          <div className="panel">

            <div className="panel-header">
              <h2>Call Analyzer</h2>
              <span>LIVE</span>
            </div>

            {selected ? (
              <>
                <div className="caller">
                  <div className="avatar">👤</div>

                  <div>
                    <h3>{selected.phone_number}</h3>
                    <p>{selected.caller_name} · {formatTime(selected.call_time)}</p>
                  </div>
                </div>

                {selected.caller_name === "Unknown Caller" && (
                  <div className="inline-form">
                    <input
                      placeholder="Save this number as..."
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                    <button className="small" onClick={saveContact}>SAVE NAME</button>
                  </div>
                )}

                <p className="audio-title">VOICE SIGNAL</p>

                <div className="wave">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <i key={i}></i>
                  ))}
                </div>

                {selected.audio_url ? (
                  <audio key={selected.id} controls src={`${API}${selected.audio_url}`} />
                ) : (
                  <p className="no-audio">{AUDIO_LABELS[selected.audio_status]}</p>
                )}

                <button onClick={analyzeCall} disabled={analyzing}>
                  {analyzing ? "ANALYZING..." : "ANALYZE CALL"}
                </button>

                <button className="delete" onClick={deleteCall} disabled={analyzing}>
                  DELETE CALL
                </button>
              </>
            ) : (
              <p className="empty">
                {online ? "No calls stored yet. Add a test call below." : "Start the backend: cd backend, npm run dev"}
              </p>
            )}

          </div>

          <div className="panel result">

            <h2>AI Analysis</h2>

            <div className="score">
              <div>
                <strong>{score}%</strong>
                <p>SCAM PROBABILITY</p>
              </div>
            </div>

            <h3 className={status === "HIGH RISK" ? "high-risk" : ""}>
              {status}
            </h3>

            <div className="warnings">
              <p>⚠ Synthetic voice pattern</p>
              <p>⚠ Urgency detected</p>
              <p>⚠ Financial request detected</p>
            </div>

          </div>

        </section>

        <section className="activity">

          <h2>Recent Activity</h2>

          {calls.length === 0 && <p className="empty">No calls yet.</p>}

          {calls.map((call) => (
            <div
              key={call.id}
              className={call.id === selected?.id ? "activity-row clickable selected" : "activity-row clickable"}
              onClick={() => selectCall(call.id)}
            >
              <span>{call.phone_number} · {call.caller_name}</span>
              <span>{formatTime(call.call_time)}</span>
              {call.audio_status === "saved" ? <em>RECORDED</em> : <b>{AUDIO_LABELS[call.audio_status]}</b>}
            </div>
          ))}

        </section>

        <section className="activity">

          <h2>Add Test Call</h2>

          <form className="upload-form" onSubmit={uploadCall}>
            <input
              placeholder="Phone number *"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              required
            />
            <input
              placeholder="Caller name (optional)"
              value={form.caller_name}
              onChange={(e) => setForm({ ...form, caller_name: e.target.value })}
            />
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            <button type="submit">SAVE CALL</button>
          </form>

          {message && <p className="message">{message}</p>}

        </section>

      </main>
    </div>
  );
}

export default App;
