import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Auth } from "./components/Auth";
import { MatchList } from "./components/MatchList";
import { Ranking } from "./components/Ranking";
import { HeaderUsuario } from "./components/HeaderUsuario";
import { PerfilUsuario } from "./components/PerfilUsuario";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"jogos" | "ranking">("jogos");
  const [perfilSelecionado, setPerfilSelecionado] = useState<string | null>(
    null,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

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
            onOpenProfile={(id) => setPerfilSelecionado(id)}
          />

          {perfilSelecionado ? (
            <PerfilUsuario
              usuarioId={perfilSelecionado}
              onClose={() => setPerfilSelecionado(null)}
            />
          ) : (
            <>
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2rem",
                }}
              >
                <h1>{activeTab === "jogos" ? "Meus palpites" : "Ranking"}</h1>
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    backgroundColor: "var(--error)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontWeight: "bold",
                  }}
                >
                  Sair
                </button>
              </header>

              {activeTab === "jogos" ? (
                <MatchList userId={session.user.id} />
              ) : (
                <Ranking onSelectUser={(id) => setPerfilSelecionado(id)} />
              )}

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
                    padding: "0.5rem",
                    transition: "color 0.2s ease",
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
                    padding: "0.5rem",
                    transition: "color 0.2s ease",
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
