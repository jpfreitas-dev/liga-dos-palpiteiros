import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Auth } from "./components/Auth";
import { MatchList } from "./components/MatchList";
import { Ranking } from "./components/Ranking";
import { HeaderUsuario } from "./components/HeaderUsuario";
import { PerfilUsuario } from "./components/PerfilUsuario";
import { TournamentSelection } from "./components/TournamentSelection";
import { FilterBar } from "./components/FilterBar";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"jogos" | "ranking">("jogos");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    null,
  );
  // Novo estado para filtros globais de tempo
  const [daysFilter, setDaysFilter] = useState<number>(999);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <main
          style={{
            padding: "1rem",
            maxWidth: "40rem",
            margin: "0 auto",
            paddingTop: "5rem",
            paddingBottom: "5rem",
          }}
        >
          <HeaderUsuario
            usuarioId={session.user.id}
            onOpenProfile={setSelectedProfileId}
          />

          {selectedProfileId ? (
            <PerfilUsuario
              usuarioId={selectedProfileId}
              onClose={() => setSelectedProfileId(null)}
            />
          ) : !activeTournamentId ? (
            <TournamentSelection
              onSelect={setActiveTournamentId}
              onLogout={() => supabase.auth.signOut()}
            />
          ) : (
            <>
              <header style={{ marginBottom: "2rem" }}>
                <button
                  className="btn-voltar"
                  onClick={() => setActiveTournamentId(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: 0,
                    marginBottom: "1rem",
                  }}
                >
                  <img
                    src="src/assets/arrow-back.svg"
                    alt="Voltar"
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                  <span>Voltar</span>
                </button>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                  {activeTab === "jogos" ? "Meus palpites" : "Ranking"}
                </h2>
              </header>

              {activeTab === "ranking" && (
                <FilterBar onDaysChange={setDaysFilter} />
              )}

              {activeTab === "jogos" ? (
                <MatchList
                  userId={session.user.id}
                  tournamentId={activeTournamentId}
                />
              ) : (
                <Ranking
                  tournamentId={activeTournamentId}
                  days={daysFilter}
                  onSelectUser={setSelectedProfileId}
                />
              )}

              {/* Navegação inferior mantida */}
              <nav
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--surface)",
                  display: "flex",
                  justifyContent: "space-around",
                  padding: "1rem",
                  borderTop: "0.0625rem solid #333333",
                  boxShadow: "0 -0.125rem 0.625rem rgba(0,0,0,0.3)",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => setActiveTab("jogos")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: activeTab === "jogos" ? "bold" : "normal",
                    color:
                      activeTab === "jogos"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Jogos
                </button>
                <button
                  onClick={() => setActiveTab("ranking")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: activeTab === "ranking" ? "bold" : "normal",
                    color:
                      activeTab === "ranking"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Ranking
                </button>
              </nav>
            </>
          )}
        </main>
      )}
    </div>
  );
}
export default App;
