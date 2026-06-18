import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { LeagueManager } from "./components/LeagueManager";
import { MatchList } from "./components/MatchList";
import { Ranking } from "./components/Ranking";
import { HeaderUsuario } from "./components/HeaderUsuario";
import { Auth } from "./components/Auth";
import type { Session } from "@supabase/supabase-js";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"jogos" | "ranking">("jogos");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Auth />;

  return (
    <main className="app-container">
      <HeaderUsuario usuarioId={session.user.id} />

      {!selectedLeagueId ? (
        <LeagueManager
          userId={session.user.id}
          onSelectLeague={setSelectedLeagueId}
        />
      ) : (
        <>
          <header className="liga-header">
            <button
              className="btn-back"
              onClick={() => setSelectedLeagueId(null)}
            >
              ← Ligas
            </button>
            <h2 className="tab-title">
              {activeTab === "jogos" ? "Partidas" : "Ranking"}
            </h2>
          </header>

          {activeTab === "jogos" ? (
            <MatchList leagueId={selectedLeagueId} />
          ) : (
            <Ranking ligaId={selectedLeagueId} onSelectUser={() => {}} />
          )}

          <nav className="bottom-nav">
            <button
              className={activeTab === "jogos" ? "active" : ""}
              onClick={() => setActiveTab("jogos")}
            >
              Jogos
            </button>
            <button
              className={activeTab === "ranking" ? "active" : ""}
              onClick={() => setActiveTab("ranking")}
            >
              Ranking
            </button>
          </nav>
        </>
      )}
    </main>
  );
}

export default App;
