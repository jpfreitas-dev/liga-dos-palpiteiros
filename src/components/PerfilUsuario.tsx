import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import type { UserProfile, Prediction, Match } from "../types/database";
import "./PerfilUsuario.css";

const getScoreStyle = (points: number) => {
  if (points === 7) return "border-green";
  if (points === 4) return "border-blue";
  if (points === 2) return "border-yellow";
  if (points === 1) return "border-orange";
  return "border-red";
};

interface HistoryItem extends Prediction {
  partidas: Match;
}

interface DashboardData extends UserProfile {
  totalGames: number;
  exactMatches: number;
  exactAccuracy: number;
  winnerAccuracy: number;
  generalAccuracy: number;
  averagePoints: string;
  streak: number;
  history: HistoryItem[];
}

export function PerfilUsuario({
  usuarioId,
  onClose,
}: {
  usuarioId: string;
  onClose: () => void;
}) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchFullStats() {
      const { data: user } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", usuarioId)
        .single();

      if (!user) return;

      const { data: predictions } = await supabase
        .from("palpites")
        .select(
          `
          id,
          usuario_id,
          partida_id,
          pontos_ganhos, 
          detalhe_pontuacao, 
          palpite_a, 
          palpite_b, 
          partidas(id, time_a, time_b, placar_a, placar_b, data_inicio, sigla_mandante, sigla_visitante, emblema_mandante, emblema_visitante, status)
        `,
        )
        .eq("usuario_id", usuarioId);

      const finishedPredictions = (predictions || []).filter(
        (p: any) => p.partidas?.status === "FINISHED",
      ) as unknown as HistoryItem[];

      finishedPredictions.sort((a, b) => {
        return (
          new Date(b.partidas.data_inicio).getTime() -
          new Date(a.partidas.data_inicio).getTime()
        );
      });

      const totalGames = finishedPredictions.length;
      const exactMatches = finishedPredictions.filter(
        (p) => p.pontos_ganhos === 7,
      ).length;
      const winnerMatches = finishedPredictions.filter(
        (p) => p.pontos_ganhos === 4,
      ).length;
      const scoredMatches = finishedPredictions.filter(
        (p) => (p.pontos_ganhos ?? 0) > 0,
      ).length;

      let currentStreak = 0;
      for (const p of finishedPredictions) {
        if ((p.pontos_ganhos ?? 0) > 0) currentStreak++;
        else break;
      }

      setDashboardData({
        ...(user as UserProfile),
        totalGames,
        exactMatches,
        history: finishedPredictions,
        exactAccuracy:
          totalGames > 0 ? Math.round((exactMatches / totalGames) * 100) : 0,
        winnerAccuracy:
          totalGames > 0 ? Math.round((winnerMatches / totalGames) * 100) : 0,
        generalAccuracy:
          totalGames > 0 ? Math.round((scoredMatches / totalGames) * 100) : 0,
        averagePoints:
          totalGames > 0
            ? (
                finishedPredictions.reduce(
                  (acc, curr) => acc + (curr.pontos_ganhos ?? 0),
                  0,
                ) / totalGames
              ).toFixed(1)
            : "0.0",
        streak: currentStreak,
      });
    }
    fetchFullStats();
  }, [usuarioId]);

  if (!dashboardData)
    return <div className="loading">Carregando Dashboard...</div>;

  return (
    <div className="perfil-container">
      <button
        className="btn-voltar"
        onClick={onClose}
        style={{
          display: "flex", // Adicionado flex para alinhar ícone
          alignItems: "center",
          gap: "0.1rem",
          background: "transparent",
          border: "none",
          color: "var(--primary)",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "1rem",
          padding: 0,
          marginBottom: "1.5rem", // Mantém separação
        }}
      >
        <img
          src="src/assets/arrow-back.svg"
          alt="Voltar"
          style={{
            width: "1.25rem",
            height: "1.25rem",
            marginBottom: "0.1rem",
          }}
        />
        <span>Voltar</span>
      </button>

      <div className="hero-stats">
        <h2>{dashboardData.username}</h2>
        <div className="streak-badge">
          🔥 Sequência pontuando: {dashboardData.streak} jogos
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <strong>{dashboardData.pontuacao_total}</strong>Pontos Totais
        </div>
        <div className="stat-card">
          <strong>{dashboardData.averagePoints}</strong>Média/Jogo
        </div>
        <div className="stat-card">
          <strong>{dashboardData.exactAccuracy}%</strong>Cravadas
        </div>
        <div className="stat-card">
          <strong>{dashboardData.winnerAccuracy}%</strong>Vencedores
        </div>
        <div className="stat-card full">
          <strong>{dashboardData.generalAccuracy}%</strong>Precisão Geral
        </div>
      </div>

      <div
        className={`historico-section ${isExpanded ? "expanded" : "collapsed"}`}
      >
        <button
          className="btn-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Ocultar Histórico" : "Ver Histórico Completo"}
        </button>

        {isExpanded && (
          <div className="historico-lista">
            {dashboardData.history.map((h, i) => {
              const siglaA =
                h.partidas.sigla_mandante ||
                h.partidas.time_a.substring(0, 3).toUpperCase();
              const siglaB =
                h.partidas.sigla_visitante ||
                h.partidas.time_b.substring(0, 3).toUpperCase();

              const textoPontuacao =
                (h.pontos_ganhos ?? 0) > 0
                  ? `${h.detalhe_pontuacao}`
                  : h.detalhe_pontuacao;

              return (
                <div
                  key={i}
                  className={`history-card ${getScoreStyle(h.pontos_ganhos ?? 0)}`}
                >
                  <div className="hist-info">
                    <span className="hist-data">
                      {new Date(h.partidas.data_inicio).toLocaleDateString()}
                    </span>
                    <span className="hist-pontos">{h.pontos_ganhos} pts</span>
                  </div>
                  <div className="hist-match-box">
                    <div className="team-container">
                      {h.partidas.emblema_mandante && (
                        <img
                          src={h.partidas.emblema_mandante}
                          alt={siglaA}
                          className="hist-flag"
                        />
                      )}
                      <span className="team-tag">{siglaA}</span>
                    </div>

                    <span className="score-palpite">
                      {h.palpite_a} - {h.palpite_b}
                    </span>

                    <div className="team-container">
                      {h.partidas.emblema_visitante && (
                        <img
                          src={h.partidas.emblema_visitante}
                          alt={siglaB}
                          className="hist-flag"
                        />
                      )}
                      <span className="team-tag">{siglaB}</span>
                    </div>
                  </div>
                  <div className="hist-footer">{textoPontuacao}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
