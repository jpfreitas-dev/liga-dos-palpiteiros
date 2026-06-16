import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { Auth } from "./components/Auth";
import { MatchList } from "./components/MatchList";
import type { Session } from "@supabase/supabase-js";

function App() {
  const [session, setSession] = useState<Session | null>(null);

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
        <main style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h1>Painel de Palpites</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                backgroundColor: "#de350b",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
              }}
            >
              Sair
            </button>
          </header>
          <MatchList userId={session.user.id} />
        </main>
      )}
    </div>
  );
}

export default App;
