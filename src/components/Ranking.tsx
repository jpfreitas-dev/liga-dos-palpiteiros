import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Trophy, Target, TrendingUp, MessageCircle } from "lucide-react";
import "./Ranking.css";

interface UserStats {
  id: string;
  username: string;
  avatar_url: string;
  status_message: string;
  pontuacao_total: number;
  total_palpites: number;
  acertos_exatos: number;
  precisao: number;
}

export const Ranking: React.FC = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    setLoading(true);

    // 1. Buscar usuários ordenados por pontuação
    const { data: profiles, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .order("pontuacao_total", { ascending: false });

    if (profileError) return;

    // 2. Buscar estatísticas de palpites para calcular precisão
    // Em um cenário de produção, isso seria uma View no Postgres ou uma Edge Function
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
        <h1>Ranking Global</h1>
      </header>

      <div className="ranking-list">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`ranking-item ${index === 0 ? "podium-first" : ""}`}
          >
            <div className="rank-number">{index + 1}º</div>

            <div className="avatar-wrapper">
              <img
                src={
                  user.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.username}
                className="user-avatar"
              />
              {user.status_message && (
                <div className="status-bubble">
                  <MessageCircle size={10} fill="currentColor" />
                  <span>{user.status_message}</span>
                </div>
              )}
            </div>

            <div className="user-info">
              <span className="username">{user.username}</span>
              <div className="user-analytics">
                <span className="stat-tag">
                  <Target size={12} /> {user.precisao}% precisão
                </span>
                <span className="stat-tag">
                  <TrendingUp size={12} /> {user.acertos_exatos} cravadas
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
