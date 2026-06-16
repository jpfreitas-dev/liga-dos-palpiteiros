import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "./PerfilUsuario.css";

const getPontuacaoStyle = (pontos: number) => {
  if (pontos === 7) return "border-green";
  if (pontos === 4) return "border-blue";
  if (pontos === 2) return "border-yellow";
  if (pontos === 1) return "border-orange";
  return "border-red";
};

export function PerfilUsuario({
  usuarioId,
  onClose,
}: {
  usuarioId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadFullStats() {
      const { data: user } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", usuarioId)
        .single();

      const { data: palpites } = await supabase
        .from("palpites")
        .select(
          `
          pontos_ganhos, 
          detalhe_pontuacao, 
          palpite_a, 
          palpite_b, 
          created_at,
          partidas(time_a, time_b, placar_a, placar_b, data_inicio, sigla_mandante, sigla_visitante, emblema_mandante, emblema_visitante)
        `,
        )
        .eq("usuario_id", usuarioId)
        .order("created_at", { ascending: false });

      const total = palpites?.length || 0;
      const cravadas =
        palpites?.filter((p) => p.pontos_ganhos === 7).length || 0;
      const vitorias =
        palpites?.filter((p) => p.pontos_ganhos === 4).length || 0;
      const pontuados =
        palpites?.filter((p) => p.pontos_ganhos > 0).length || 0;

      let streak = 0;
      for (const p of palpites || []) {
        if (p.pontos_ganhos > 0) streak++;
        else break;
      }

      setData({
        ...user,
        total,
        cravadas,
        historico: palpites || [],
        precisao: total > 0 ? Math.round((cravadas / total) * 100) : 0,
        taxaVencedor: total > 0 ? Math.round((vitorias / total) * 100) : 0,
        precisaoGeral: total > 0 ? Math.round((pontuados / total) * 100) : 0,
        mediaPontos:
          total > 0
            ? (
                (palpites ?? []).reduce((a, b) => a + b.pontos_ganhos, 0) /
                total
              ).toFixed(1)
            : 0,
        streak,
        ultimos5: palpites?.slice(0, 5).map((p: any) => p.pontos_ganhos),
      });
    }
    loadFullStats();
  }, [usuarioId]);

  if (!data) return <div className="loading">Carregando Dashboard...</div>;

  return (
    <div className="perfil-container">
      <button className="btn-voltar" onClick={onClose}>
        ← Voltar
      </button>

      <div className="hero-stats">
        <h2>{data.username}</h2>
        <div className="streak-badge">
          🔥 Sequência atual: {data.streak} jogos
        </div>
        <div className="last-5">
          {data.ultimos5.map((p: number, i: number) => (
            <span key={i} className={`dot score-${p}`}>
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <strong>{data.pontuacao_total}</strong>Pontos Totais
        </div>
        <div className="stat-card">
          <strong>{data.mediaPontos}</strong>Média/Jogo
        </div>
        <div className="stat-card">
          <strong>{data.precisao}%</strong>Cravadas
        </div>
        <div className="stat-card">
          <strong>{data.taxaVencedor}%</strong>Vencedores
        </div>
        <div className="stat-card full">
          <strong>{data.precisaoGeral}%</strong>Precisão Geral
        </div>
      </div>

      <div
        className={`historico-section ${expanded ? "expanded" : "collapsed"}`}
      >
        <button className="btn-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Ocultar Histórico" : "Ver Histórico Completo"}
        </button>

        {expanded && (
          <div className="historico-lista">
            {data.historico.map((h: any, i: number) => {
              const siglaA =
                h.partidas.sigla_mandante ||
                h.partidas.time_a.substring(0, 3).toUpperCase();
              const siglaB =
                h.partidas.sigla_visitante ||
                h.partidas.time_b.substring(0, 3).toUpperCase();

              return (
                <div
                  key={i}
                  className={`history-card ${getPontuacaoStyle(h.pontos_ganhos)}`}
                >
                  <div className="hist-info">
                    <span className="hist-data">
                      {new Date(h.partidas.data_inicio).toLocaleDateString()}
                    </span>
                    <span className="hist-pontos">{h.pontos_ganhos} pts</span>
                  </div>
                  <div className="hist-match-box">
                    {/* Time Mandante */}
                    <div className="team-container">
                      <img
                        src={h.partidas.emblema_mandante}
                        alt={siglaA}
                        className="hist-flag"
                      />
                      <span className="team-tag">{siglaA}</span>
                    </div>

                    {/* Placar Central */}
                    <span className="score-palpite">
                      {h.palpite_a} - {h.palpite_b}
                    </span>

                    {/* Time Visitante */}
                    <div className="team-container">
                      <img
                        src={h.partidas.emblema_visitante}
                        alt={siglaB}
                        className="hist-flag"
                      />
                      <span className="team-tag">{siglaB}</span>
                    </div>
                  </div>
                  <div className="hist-footer">{h.detalhe_pontuacao}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
