import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import Login from "./pages/Login";
import "./index.css";

export default function App() {
  const [result, setResult] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setResult(null);
  };

  if (loading) return (
    <div className="app">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    </div>
  );

  return (
    <div className="app">
      <header>
        <div className="logo">
          <span className="logo-icon">🎯</span>
          <span>ScoreMyCV</span>
        </div>
        {session ? (
          <div className="header-right">
            <span className="user-email">{session.user.email}</span>
            <button className="btn-outline btn-sm" onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <p className="tagline">ATS Score · Instant · Free to Try</p>
        )}
      </header>

      <main>
        {!session ? (
          <Login />
        ) : !result ? (
          <Upload setResult={setResult} email={session.user.email} session={session} />
        ) : (
          <Results result={result} email={session.user.email} onReset={() => setResult(null)} />
        )}
      </main>

      <footer>
        <p>© 2025 ScoreMyCV · Built for job seekers everywhere</p>
      </footer>
    </div>
  );
}
