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
import { UserStats } from "./components/UserStats";

// Contextos e Layouts
import { ToastProvider } from "./contexts/ToastContext";
import { MainLayout } from "./layouts/MainLayout";
import "./App.css";

/* -------------------------------------------------------------------------- */
/* COMPONENTE AUXILIAR: Tela Interna da Liga                                  */
/* Extraímos a sua lógica de "dentro da liga" para funcionar com rotas        */
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
    <>
      <header className="liga-header">
        <button className="btn-back" onClick={() => navigate("/ligas")}>
          ← Ligas
        </button>
        <h2 className="tab-title">
          {activeTab === "jogos" ? "Partidas" : "Ranking"}
        </h2>
      </header>

      {activeTab === "jogos" ? (
        <MatchList leagueId={leagueId} />
      ) : (
        <Ranking
          ligaId={leagueId}
          onSelectUser={(id, name) => setSelectedUser({ id, name })}
        />
      )}

      {/* Modal de Estatísticas do Usuário */}
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
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* GERENCIADOR DE ROTAS                                                       */
/* Precisa estar dentro do <Router> para usar o hook useNavigate              */
/* -------------------------------------------------------------------------- */
const AppRoutes: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Rotas envelopadas pelo MainLayout (com a barra de navegação global) */}
      <Route path="/" element={<MainLayout />}>
        {/* Redireciona a raiz para a tela de ligas */}
        <Route index element={<Navigate to="/ligas" replace />} />

        <Route
          path="ligas"
          element={
            <LeagueManager
              userId={userId}
              // Ao clicar em "Acessar Liga", o Router muda a URL
              onSelectLeague={(id) => navigate(`/ligas/${id}`)}
            />
          }
        />

        <Route path="jogos" element={<GlobalMatches userId={userId} />} />
      </Route>

      {/* Rota fora do MainLayout para a visão interna da liga */}
      <Route path="/ligas/:leagueId" element={<LeagueView />} />
    </Routes>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL (APP)                                                 */
/* -------------------------------------------------------------------------- */
function App() {
  const [session, setSession] = useState<Session | null>(null);

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
    <ToastProvider>
      <Router>
        <main className="app-container">
          {/* HeaderUsuario fica fora das rotas para persistir no topo */}
          <HeaderUsuario usuarioId={session.user.id} />

          <AppRoutes userId={session.user.id} />
        </main>
      </Router>
    </ToastProvider>
  );
}

export default App;
