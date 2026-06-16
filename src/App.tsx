import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Auth } from "./components/Auth";
import { MatchList } from "./components/MatchList";
import { Ranking } from "./components/Ranking";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"jogos" | "ranking">("jogos");

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
            paddingBottom: "5rem",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h1>
              {activeTab === "jogos" ? "Painel de Palpites" : "Ranking Global"}
            </h1>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                backgroundColor: "#de350b",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                fontWeight: "bold",
              }}
            >
              Sair
            </button>
          </header>

          {activeTab === "jogos" ? (
            <MatchList userId={session.user.id} />
          ) : (
            <Ranking />
          )}

          <nav
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#ffffff",
              display: "flex",
              justifyContent: "space-around",
              padding: "1rem",
              borderTop: "0.0625rem solid #dfe1e6",
              boxShadow: "0 -0.125rem 0.625rem rgba(0,0,0,0.05)",
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
                color: activeTab === "jogos" ? "#0052cc" : "#5e6c84",
                cursor: "pointer",
                padding: "0.5rem",
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
                color: activeTab === "ranking" ? "#0052cc" : "#5e6c84",
                cursor: "pointer",
                padding: "0.5rem",
              }}
            >
              Ranking
            </button>
          </nav>
        </main>
      )}
    </div>
  );
}

export default App;
