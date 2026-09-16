import React from "react";
import { useState } from "react";
import "./app.css";

function App() {
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("WAITING");
  const [analyzing, setAnalyzing] = useState(false);

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

  return (
    <div className="app">

      <nav className="navbar">
        <h2>◉ VOISE<span>GUARD</span></h2>
        <div className="online">● SYSTEM ONLINE</div>
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
            <p>CALLS ANALYZED</p>
            <h2>1,284</h2>
          </div>

          <div className="card danger">
            <p>SCAMS DETECTED</p>
            <h2>327</h2>
          </div>

          <div className="card safe">
            <p>SAFE CALLS</p>
            <h2>957</h2>
          </div>

          <div className="card">
            <p>ACCURACY</p>
            <h2>94.8%</h2>
          </div>

        </section>

        <section className="analysis">

          <div className="panel">

            <div className="panel-header">
              <h2>Call Analyzer</h2>
              <span>LIVE</span>
            </div>

            <div className="caller">
              <div className="avatar">👤</div>

              <div>
                <h3>+91 98765 43210</h3>
                <p>Unknown Caller</p>
              </div>
            </div>

            <p className="audio-title">VOICE SIGNAL</p>

            <div className="wave">
              {Array.from({ length: 35 }).map((_, i) => (
                <i key={i}></i>
              ))}
            </div>

            <button onClick={analyzeCall} disabled={analyzing}>
              {analyzing ? "ANALYZING..." : "ANALYZE CALL"}
            </button>

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

          <div className="activity-row">
            <span>+91 98452 11234</span>
            <span>Scam probability: 91%</span>
            <b>HIGH RISK</b>
          </div>

          <div className="activity-row">
            <span>+91 99887 66554</span>
            <span>Scam probability: 12%</span>
            <em>SAFE</em>
          </div>

          <div className="activity-row">
            <span>+91 91234 56789</span>
            <span>Scam probability: 76%</span>
            <b>HIGH RISK</b>
          </div>

        </section>

      </main>
    </div>
  );
}

export default App;