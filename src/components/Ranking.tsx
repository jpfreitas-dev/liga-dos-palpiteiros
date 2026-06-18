import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import type { RankingLigaData } from "../types/database";
import "./Ranking.css";

interface RankingProps {
  ligaId: string;
  onSelectUser: (userId: string) => void;
}

export const Ranking: React.FC<RankingProps> = ({ ligaId, onSelectUser }) => {
  const [rankingData, setRankingData] = useState<RankingLigaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_ranking_liga_filtrado",
          { p_liga_id: ligaId, p_dias: 999 }, // 999 puxa todo o histórico da liga
        );

        if (rpcError) throw rpcError;

        if (data) {
          // O banco já retorna ordenado, mas garantimos a tipagem
          setRankingData(data as RankingLigaData[]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar ranking:", err);
        setError("Não foi possível carregar a classificação no momento.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [ligaId]);

  if (isLoading) {
    return (
      <div className="loading-state" aria-live="polite">
        Calculando posições...
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
        <p>Ainda não há pontuações registradas nesta liga.</p>
      </div>
    );
  }

  return (
    <section className="ranking-container" aria-labelledby="ranking-title">
      <h2 id="ranking-title" className="sr-only">
        Classificação da Liga
      </h2>

      <ol className="ranking-list">
        {rankingData.map((user, index) => {
          // const isTopThree = index < 3;
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
              onClick={() => onSelectUser(user.usuario_id)}
              tabIndex={0}
              role="button"
              aria-label={`${index + 1}º lugar: ${user.username} com ${user.total_pontos} pontos`}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelectUser(user.usuario_id);
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
                  {user.total_palpites} palpites registrados
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
