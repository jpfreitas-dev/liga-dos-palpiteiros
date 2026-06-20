import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./UserStats.css";

// Interface atualizada para bater com os retornos das Views do banco
interface Stats {
  total_palpites: number;
  total_pontos: number;
  cravadas: number;
  acertos_saldo_vencedor: number;
  acertos_vencedor: number;
  acertos_placar_independente: number;
  acertos_diferenca_independente: number;
  errados: number;
}

interface UserStatsProps {
  userId: string;
  ligaId?: string; // Alterado para opcional (?)
  username: string;
  onClose: () => void;
}

export const UserStats: React.FC<UserStatsProps> = ({
  userId,
  ligaId,
  username,
  onClose,
}) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let data, error;

      // Se um ligaId foi passado, busca as estatísticas filtradas por liga
      if (ligaId) {
        const response = await supabase.rpc("get_user_stats_liga", {
          p_liga_id: ligaId,
          p_user_id: userId,
        });
        data = response.data;
        error = response.error;
      }
      // Se não tem ligaId, significa que foi chamado do Ranking Global
      else {
        const response = await supabase.rpc("get_user_stats", {
          p_user_id: userId,
        });
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error(
          "Erro retornado pelo Supabase na busca de estatísticas:",
          error,
        );
      }

      if (!error && data && data.length > 0) {
        setStats(data[0]);
      }
      setLoading(false);
    };
    fetchStats();
  }, [userId, ligaId]);

  const calcPercentage = (value: number, total: number) => {
    if (!total || total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <header className="stats-header">
          <h3>
            Estatísticas {ligaId ? `de ${username}` : `Globais de ${username}`}
          </h3>
          <button
            onClick={onClose}
            className="btn-close-modal"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        {loading ? (
          <div className="stats-loading">Carregando dados...</div>
        ) : stats ? (
          <div className="stats-list">
            {/* Total de Palpites */}
            <div className="stat-row neutral-bg">
              <div className="stat-info">
                <span className="stat-label">TOTAL DE PALPITES</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value neutral">
                  {stats.total_palpites}
                </span>
              </div>
            </div>

            {/* Pontos Totais */}
            <div className="stat-row primary-bg">
              <div className="stat-info">
                <span className="stat-label">PONTOS TOTAIS</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value primary">{stats.total_pontos}</span>
              </div>
            </div>

            {/* Cravadas */}
            <div className="stat-row card-gold">
              <div className="stat-info">
                <span className="stat-pts-header">10 PONTOS:</span>
                <span className="stat-label">CRAVADAS (PLACAR EXATO)</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{stats.cravadas}</span>
                <span className="stat-percent">
                  ({calcPercentage(stats.cravadas, stats.total_palpites)})
                </span>
              </div>
            </div>

            {/* Vencedor + Saldo */}
            <div className="stat-row card-green">
              <div className="stat-info">
                <span className="stat-pts-header">7 PONTOS:</span>
                <span className="stat-label">ACERTOU O VENCEDOR E O SALDO</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">
                  {stats.acertos_saldo_vencedor}
                </span>
                <span className="stat-percent">
                  (
                  {calcPercentage(
                    stats.acertos_saldo_vencedor,
                    stats.total_palpites,
                  )}
                  )
                </span>
              </div>
            </div>

            {/* Vencedor Simples */}
            <div className="stat-row card-purple">
              <div className="stat-info">
                <span className="stat-pts-header">5 PONTOS:</span>
                <span className="stat-label">ACERTOU APENAS O VENCEDOR</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{stats.acertos_vencedor}</span>
                <span className="stat-percent">
                  (
                  {calcPercentage(stats.acertos_vencedor, stats.total_palpites)}
                  )
                </span>
              </div>
            </div>

            {/* Placar Independente */}
            <div className="stat-row card-blue">
              <div className="stat-info">
                <span className="stat-pts-header">3 PONTOS:</span>
                <span className="stat-label">ACERTOU OS NÚMEROS DO PLACAR</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">
                  {stats.acertos_placar_independente}
                </span>
                <span className="stat-percent">
                  (
                  {calcPercentage(
                    stats.acertos_placar_independente,
                    stats.total_palpites,
                  )}
                  )
                </span>
              </div>
            </div>

            {/* Saldo Independente */}
            <div className="stat-row card-orange">
              <div className="stat-info">
                <span className="stat-pts-header">1 PONTO:</span>
                <span className="stat-label">ACERTOU O SALDO DE GOLS</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">
                  {stats.acertos_diferenca_independente}
                </span>
                <span className="stat-percent">
                  (
                  {calcPercentage(
                    stats.acertos_diferenca_independente,
                    stats.total_palpites,
                  )}
                  )
                </span>
              </div>
            </div>

            {/* Errados */}
            <div className="stat-row card-red">
              <div className="stat-info">
                <span className="stat-pts-header">0 PONTOS:</span>
                <span className="stat-label">PALPITES ERRADOS</span>
              </div>
              <div className="stat-numbers">
                <span className="stat-value">{stats.errados}</span>
                <span className="stat-percent">
                  ({calcPercentage(stats.errados, stats.total_palpites)})
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="error-text">Dados não encontrados.</p>
        )}
      </div>
    </div>
  );
};
