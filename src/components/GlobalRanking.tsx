import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./Ranking.css"; // Reaproveita o mesmo CSS para manter o padrão visual

// Interface para o ranking geral do sistema
interface RankingGlobalData {
  usuario_id: string;
  username: string;
  total_pontos: number;
  total_palpites: number;
}

interface GlobalRankingProps {
  onSelectUser: (userId: string, username: string) => void;
}

export const GlobalRanking: React.FC<GlobalRankingProps> = ({
  onSelectUser,
}) => {
  const [rankingData, setRankingData] = useState<RankingGlobalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalRanking = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Chama a nova função global que criamos no banco de dados
        const { data, error: rpcError } =
          await supabase.rpc("get_ranking_global");

        if (rpcError) throw rpcError;

        if (data) {
          setRankingData(data as RankingGlobalData[]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar ranking global:", err);
        setError("Não foi possível carregar a classificação geral no momento.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalRanking();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-state" aria-live="polite">
        Calculando posições globais...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" role="alert">
        {error}
      </div>
    );
  }

  if (rankingData.length === 0) {
    return (
      <div className="empty-state">
        <p>Ainda não há usuários ou pontuações registradas no sistema.</p>
      </div>
    );
  }

  return (
    <section
      className="ranking-container"
      aria-labelledby="global-ranking-title"
    >
      <h2 id="global-ranking-title" className="sr-only">
        Classificação Geral
      </h2>

      <ol className="ranking-list">
        {rankingData.map((user, index) => {
          const positionClass =
            index === 0
              ? "gold"
              : index === 1
                ? "silver"
                : index === 2
                  ? "bronze"
                  : "";

          return (
            <li
              key={user.usuario_id}
              className={`ranking-item ${positionClass}`}
              onClick={() => onSelectUser(user.usuario_id, user.username)}
              tabIndex={0}
              role="button"
              aria-label={`${index + 1}º lugar geral: ${user.username} com ${user.total_pontos} pontos`}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  onSelectUser(user.usuario_id, user.username);
              }}
            >
              <div className="rank-position" aria-hidden="true">
                {index + 1}º
              </div>

              <div className="avatar" aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <span className="username">{user.username}</span>
                <span className="user-stats">
                  {user.total_palpites} palpites no total
                </span>
              </div>

              <div className="score-block">
                <span className="points">{user.total_pontos}</span>
                <span className="points-label">pts</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
