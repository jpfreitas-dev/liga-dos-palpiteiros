import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Trophy, Target, TrendingUp } from "lucide-react";
import "./Ranking.css";

interface UserStats {
  id: string;
  username: string;
  avatar_url: string | null;
  status_message: string;
  pontuacao_total: number;
  total_palpites: number;
  acertos_exatos: number;
  precisao: number;
}

export const Ranking: React.FC<{ onSelectUser: (id: string) => void }> = ({
  onSelectUser,
}) => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    setLoading(true);
    const { data: profiles, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .order("pontuacao_total", { ascending: false });

    if (profileError || !profiles) return;

    const { data: palpites, error: palpiteError } = await supabase
      .from("palpites")
      .select("usuario_id, pontos_ganhos");

    if (palpiteError) return;

    const statsMap = profiles.map((user) => {
      const userPalpites = palpites.filter((p) => p.usuario_id === user.id);
      const total = userPalpites.length;
      const exatos = userPalpites.filter((p) => p.pontos_ganhos === 7).length;

      return {
        ...user,
        total_palpites: total,
        acertos_exatos: exatos,
        precisao: total > 0 ? Math.round((exatos / total) * 100) : 0,
      };
    });

    setUsers(statsMap);
    setLoading(false);
  };

  if (loading)
    return <div className="loading-state">Calculando posições...</div>;

  return (
    <div className="ranking-container">
      <header className="ranking-header">
        <Trophy color="#FFD700" size={32} />
      </header>

      <div className="ranking-list">
        {users.map((user, index) => (
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
                  <Target size={14} /> <span>{user.precisao}%</span>
                  <span className="label-text"> precisão</span>
                </span>
                <span className="stat-tag">
                  <TrendingUp size={14} /> <span>{user.acertos_exatos}</span>
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
