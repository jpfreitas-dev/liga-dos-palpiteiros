import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Trophy, Target, TrendingUp } from "lucide-react";
import type { UserProfile } from "../types/database";
import "./Ranking.css";

interface UserStats extends UserProfile {
  totalPredictions: number;
  exactMatches: number;
  accuracy: number;
}

export const Ranking: React.FC<{
  tournamentId: string;
  days: number;
  onSelectUser: (id: string) => void;
}> = ({ tournamentId, days, onSelectUser }) => {
  const [usersData, setUsersData] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setIsLoading(true);

      try {
        let data: any[] | null = [];

        // Se 'days' for 999, usamos a View Geral, caso contrário, chamamos a RPC
        if (days === 999) {
          const { data: viewData } = await supabase
            .from("view_ranking_geral")
            .select("*");
          data = viewData;
        } else {
          const { data: rpcData } = await supabase.rpc("get_ranking_filtrado", {
            p_dias: days,
          });
          data = rpcData;
        }

        if (data) {
          // Nota: Como a view e RPC retornam dados agregados prontos,
          // adaptamos para o seu tipo UserStats atual
          const formattedData = data.map((item: any) => ({
            id: item.usuario_id,
            username: item.username,
            pontuacao_total: item.total_pontos || 0,
            totalPredictions: item.total_palpites || 0,
            exactMatches: 0, // Campos adicionais podem ser agregados no SQL se desejar
            accuracy: 0,
          }));
          setUsersData(formattedData);
        }
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankingData();
  }, [days, tournamentId]); // Reage aos filtros globais

  if (isLoading)
    return <div className="loading-state">Calculando posições...</div>;

  return (
    <div className="ranking-container">
      <header className="ranking-header">
        <Trophy color="#FFD700" size={32} />
      </header>

      <div className="ranking-list">
        {usersData.map((user, index) => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={`ranking-item ${index === 0 ? "podium-first" : ""}`}
          >
            <div className="rank-number">{index + 1}º</div>
            <div className="avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <div className="user-analytics">
                <span className="stat-tag">
                  <Target size={14} /> <span>{user.accuracy}%</span>
                  <span className="label-text"> precisão</span>
                </span>
                <span className="stat-tag">
                  <TrendingUp size={14} /> <span>{user.exactMatches}</span>
                  <span className="label-text"> cravadas</span>
                </span>
              </div>
            </div>
            <div className="user-score">
              <span className="points">{user.pontuacao_total}</span>
              <span className="points-label">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
