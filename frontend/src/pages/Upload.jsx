import { useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Upload({ setResult, email, setEmail }) {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) {
      setFile(f);
      setError("");
    } else {
      setError("Please upload a PDF or DOCX file.");
    }
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please upload your resume.");
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_role", jobRole);
    formData.append("job_description", jobDescription);
    formData.append("email", email);

    try {
      const res = await fetch(`${API}/analyze`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(res.status === 402
          ? "🔒 Free limit reached! Upgrade to continue analyzing."
          : json.detail || "Something went wrong.");
        return;
      }
      setResult(json);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="hero">
        <h1>Is your resume<br /><span className="accent">ATS-ready?</span></h1>
        <p>Upload your resume and get an instant AI-powered score, keyword analysis, and actionable feedback — free.</p>
      </div>

      <div className="card upload-card">
        {/* Dropzone */}
        <div
          className={`dropzone ${dragOver ? "drag-active" : ""} ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <div className="drop-hint">
              <span className="drop-icon">☁️</span>
              <p>Drop your resume here or <strong>click to browse</strong></p>
              <p className="drop-sub">PDF or DOCX · Max 5MB</p>
            </div>
          )}
        </div>

        {/* Email + Role row */}
        <div className="form-row">
          <div className="form-group">
            <label>Your Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Job Role</label>
            <input type="text" placeholder="e.g. Software Engineer" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
          </div>
        </div>

        {/* JD textarea — the new killer feature */}
        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Paste Job Description
            <span className="badge-new">NEW</span>
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              — optional but gives you a match score for this specific job
            </span>
          </label>
          <textarea
            placeholder="Paste the full job description here... We'll tell you exactly how well your resume matches this role, which keywords you're missing, and what to fix."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <span className="loading-text"><span className="spinner" />Analyzing your resume...</span>
          ) : (
            jobDescription.trim() ? "Analyze & Match to Job →" : "Analyze My Resume →"
          )}
        </button>

        <p className="free-note">✅ First analysis is completely free</p>
      </div>

      <div className="features">
        {[
          { icon: "🎯", title: "ATS Score", desc: "See exactly how recruiters' systems rate you" },
          { icon: "🔗", title: "JD Match Score", desc: "Paste any job post — get a match % instantly" },
          { icon: "🔑", title: "Missing Keywords", desc: "Know exactly what words to add for the role" },
        ].map((f) => (
          <div className="feature-card" key={f.title}>
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}