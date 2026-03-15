import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_yourkey";

const verdictColor = { Strong: "#22c55e", Good: "#3b82f6", "Needs Work": "#f59e0b", Weak: "#ef4444" };

function ScoreRing({ score, size = 130 }) {
  const r = 54, c = 2 * Math.PI * r;
  const fill = (score / 100) * c;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="score-center">
        <span className="score-num" style={{ color }}>{score}</span>
        <span className="score-label">/100</span>
      </div>
    </div>
  );
}

function Bar({ label, value }) {
  const color = value >= 75 ? "#22c55e" : value >= 50 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${value}%`, background: color }} /></div>
      <span className="bar-val">{value}</span>
    </div>
  );
}

export default function Results({ result, email, onReset }) {
  const [paid, setPaid] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const d = result.data;
  const jd = d.jd_match;

  const handleUpgrade = async () => {
    try {
      const orderRes = await fetch(`${API}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 29900 }),
      });
      const { order_id, amount } = await orderRes.json();

      const options = {
        key: RAZORPAY_KEY,
        amount,
        currency: "INR",
        name: "ScoreMyCV",
        description: "Unlimited Resume Scans",
        order_id,
        handler: function(response) {
          console.log("Payment handler fired", response);
          setPaid(true);
          setPaymentPending(false);
        },
        modal: {
          ondismiss: function() {
            setPaymentPending(true);
          }
        },
        prefill: { email },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Could not open payment. Please try again.");
    }
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <h2>Your Resume Report</h2>
        <button className="btn-outline" onClick={onReset}>← Analyze Another</button>
      </div>

      <div className="results-grid">

        <div className="card score-card">
          <ScoreRing score={d.ats_score} />
          <div className="verdict" style={{ color: verdictColor[d.verdict] }}>{d.verdict}</div>
          <p className="summary-text">{d.summary}</p>
        </div>

        {jd && jd.match_score !== null ? (
          <div className="card score-card jd-match-card">
            <div className="jd-match-badge">JD Match</div>
            <ScoreRing score={jd.match_score} />
            <p className="summary-text">{jd.recommendation}</p>
            {jd.matched_keywords?.length > 0 && (
              <div style={{ width: "100%" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Keywords matched</p>
                <div className="keyword-chips">
                  {jd.matched_keywords.map((k, i) => <span className="chip chip-green" key={i}>{k}</span>)}
                </div>
              </div>
            )}
            {jd.missing_from_jd?.length > 0 && (
              <div style={{ width: "100%", marginTop: "12px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Missing from JD</p>
                <div className="keyword-chips">
                  {jd.missing_from_jd.map((k, i) => <span className="chip chip-red" key={i}>{k}</span>)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card score-card jd-hint-card">
            <div className="jd-match-badge">JD Match</div>
            <div style={{ fontSize: "40px", margin: "16px 0" }}>🎯</div>
            <p className="summary-text">Paste a job description on the upload screen to get a match score for this specific role!</p>
          </div>
        )}

        <div className="card">
          <h3>Section Breakdown</h3>
          {Object.entries(d.section_scores).map(([k, v]) => (
            <Bar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
          ))}
        </div>

        <div className="card">
          <h3>✅ Strengths</h3>
          <ul className="list green">{d.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>

        <div className="card">
          <h3>🔧 Improvements</h3>
          <ul className="list amber">{d.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>

        <div className="card keywords-card">
          <h3>🔑 Missing Keywords</h3>
          <div className="keyword-chips">
            {d.missing_keywords.map((k, i) => <span className="chip" key={i}>{k}</span>)}
          </div>
        </div>

        {paid ? (
          <div className="card upgrade-card" style={{ borderColor: "rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.05)" }}>
            <h3>✅ Premium Active!</h3>
            <p>You have unlimited scans. Analyze as many resumes as you want!</p>
            <button className="btn-primary" onClick={onReset}
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", maxWidth: 280, margin: "0 auto" }}>
              Analyze Another Resume →
            </button>
          </div>
        ) : paymentPending ? (
          <div className="card upgrade-card" style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.05)" }}>
            <h3>⏳ Payment Completed?</h3>
            <p>If your payment was successful, click the button below to activate your premium access.</p>
            <button className="btn-primary" onClick={() => setPaid(true)}
              style={{ maxWidth: 280, margin: "0 auto 12px" }}>
              ✅ Yes, Activate Premium
            </button>
            <button className="btn-outline" onClick={() => setPaymentPending(false)}
              style={{ width: "100%", maxWidth: 280, margin: "0 auto" }}>
              No, Try Again
            </button>
          </div>
        ) : (
          <div className="card upgrade-card">
            <h3>🚀 Unlock Unlimited Scans</h3>
            <p>Upgrade for ₹299/month to analyze unlimited resumes and get JD match scores for every job you apply to.</p>
            <button className="btn-primary" onClick={handleUpgrade}
              style={{ maxWidth: 280, margin: "0 auto" }}>
              Upgrade — ₹299/month
            </button>
          </div>
        )}

      </div>
    </div>
  );
}