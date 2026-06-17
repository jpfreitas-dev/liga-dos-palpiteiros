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

export const Ranking: React.FC<{ onSelectUser: (id: string) => void }> = ({
  onSelectUser,
}) => {
  const [usersData, setUsersData] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async (isInitialLoad = true) => {
      if (isInitialLoad) setIsLoading(true);

      const { data: profiles, error: profileError } = await supabase
        .from("usuarios")
        .select("*")
        .order("pontuacao_total", { ascending: false });

      if (profileError || !profiles) return;

      const { data: predictions, error: predictionError } = await supabase.from(
        "palpites",
      ).select(`
          usuario_id, 
          pontos_ganhos,
          partidas!inner(status)
        `);

      if (predictionError) return;

      const statsMap = profiles.map((user) => {
        const finishedPredictions = predictions.filter(
          (p: any) =>
            p.usuario_id === user.id && p.partidas?.status === "FINISHED",
        );

        const totalFinished = finishedPredictions.length;
        const exacts = finishedPredictions.filter(
          (p) => p.pontos_ganhos === 7,
        ).length;
        const scored = finishedPredictions.filter(
          (p) => p.pontos_ganhos > 0,
        ).length;

        return {
          ...(user as UserProfile),
          totalPredictions: totalFinished,
          exactMatches: exacts,
          accuracy:
            totalFinished > 0 ? Math.round((scored / totalFinished) * 100) : 0,
        };
      });

      setUsersData(statsMap);
      if (isInitialLoad) setIsLoading(false);
    };

    fetchRankingData(true);

    const channel = supabase
      .channel("ranking_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "palpites" },
        () => fetchRankingData(false),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        () => fetchRankingData(false),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
