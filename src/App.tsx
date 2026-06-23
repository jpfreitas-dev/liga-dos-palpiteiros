import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import type { Session } from "@supabase/supabase-js";

// Componentes
import { Auth } from "./components/Auth";
import { GlobalMatches } from "./components/GlobalMatches";
import { HeaderUsuario } from "./components/HeaderUsuario";
import { LeagueManager } from "./components/LeagueManager";
import { MatchList } from "./components/MatchList";
import { Ranking } from "./components/Ranking";
import { GlobalRanking } from "./components/GlobalRanking"; // NOVO IMPORT
import { UserStats } from "./components/UserStats";

// Contextos e Layouts
import { ToastProvider } from "./contexts/ToastContext";
import { MainLayout } from "./layouts/MainLayout";
import "./App.css";

/* -------------------------------------------------------------------------- */
/* COMPONENTE AUXILIAR: Tela Interna da Liga                                  */
/* -------------------------------------------------------------------------- */
const LeagueView: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"jogos" | "ranking">("jogos");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!leagueId) return <Navigate to="/ligas" />;

  return (
    <div className="league-view-shell">
      <header className="liga-header">
        <button className="btn-back" onClick={() => navigate("/ligas")}>
          Voltar
        </button>
        <h2 className="tab-title">
          {activeTab === "jogos" ? "Partidas" : "Ranking"}
        </h2>
      </header>

      <div className="league-view-content">
        {activeTab === "jogos" ? (
          <MatchList leagueId={leagueId} />
        ) : (
          <Ranking
            ligaId={leagueId}
            onSelectUser={(id, name) => setSelectedUser({ id, name })}
          />
        )}
      </div>

      {selectedUser && (
        <UserStats
          userId={selectedUser.id}
          ligaId={leagueId}
          username={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
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
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* GERENCIADOR DE ROTAS                                                       */
/* -------------------------------------------------------------------------- */
const AppRoutes: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();
  // Estado para controlar o modal global de estatísticas
  const [selectedGlobalUser, setSelectedGlobalUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/ligas" replace />} />
          <Route
            path="ligas"
            element={
              <LeagueManager
                userId={userId}
                onSelectLeague={(id) => navigate(`/ligas/${id}`)}
              />
            }
          />
          <Route path="jogos" element={<GlobalMatches userId={userId} />} />
          <Route
            path="ranking-global"
            element={
              <GlobalRanking
                onSelectUser={(id, name) => setSelectedGlobalUser({ id, name })}
              />
            }
          />
        </Route>
        <Route path="/ligas/:leagueId" element={<LeagueView />} />
      </Routes>

      {/* Modal de Estatísticas Globais (acionado pela tela de ranking global) */}
      {selectedGlobalUser && (
        <UserStats
          userId={selectedGlobalUser.id}
          username={selectedGlobalUser.name}
          // ligaId omitido intencionalmente para buscar dados globais
          onClose={() => setSelectedGlobalUser(null)}
        />
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL (APP)                                                 */
/* -------------------------------------------------------------------------- */
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // Trava no modo de recuperação se o token for identificado
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      setIsRecovering(true);
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Passamos a prop isRecovering explícita para resolver o erro do TypeScript
  if (!session || isRecovering) return <Auth isRecovering={isRecovering} />;

  return (
    <ToastProvider>
      <Router>
        <main className="app-container">
          <HeaderUsuario usuarioId={session.user.id} />
          <AppRoutes userId={session.user.id} />
        </main>
      </Router>
    </ToastProvider>
  );
}

export default App;
