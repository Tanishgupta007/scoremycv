import { useState } from "react";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import "./index.css";

export default function App() {
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");

  return (
    <div className="app">
      <header>
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span>ResumeAI</span>
        </div>
        <p className="tagline">ATS Score · Instant · Free to Try</p>
      </header>

      <main>
        {!result ? (
          <Upload setResult={setResult} email={email} setEmail={setEmail} />
        ) : (
          <Results result={result} email={email} onReset={() => setResult(null)} />
        )}
      </main>

      <footer>
        <p>© 2025 ResumeAI · Built for job seekers everywhere</p>
      </footer>
    </div>
  );
}
