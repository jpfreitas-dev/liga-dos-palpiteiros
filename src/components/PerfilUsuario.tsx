import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "./PerfilUsuario.css";

export function PerfilUsuario({
  usuarioId,
  onClose,
}: {
  usuarioId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadFullStats() {
      const { data: user } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", usuarioId)
        .single();
      const { data: palpites } = await supabase
        .from("palpites")
        .select("pontos_ganhos, created_at")
        .eq("usuario_id", usuarioId)
        .order("created_at", { ascending: false });

      const total = palpites?.length || 0;
      const cravadas =
        palpites?.filter((p) => p.pontos_ganhos === 7).length || 0;
      const vitorias =
        palpites?.filter((p) => p.pontos_ganhos === 4).length || 0;
      const pontuados =
        palpites?.filter((p) => p.pontos_ganhos > 0).length || 0;

      // Cálculo de Streak (sequência atual de jogos com pontos > 0)
      let streak = 0;
      for (const p of palpites || []) {
        if (p.pontos_ganhos > 0) streak++;
        else break;
      }

      setData({
        ...user,
        total,
        cravadas,
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
        ultimos5: palpites?.slice(0, 5).map((p) => p.pontos_ganhos),
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
          <strong>{data.precisao}%</strong>Cravadas <br /> (7 pontos)
        </div>
        <div className="stat-card">
          <strong>{data.taxaVencedor}%</strong>Vencedores <br /> (4 pontos)
        </div>
        <div className="stat-card full">
          <strong>{data.precisaoGeral}%</strong>Precisão Geral <br /> (pontos
          &gt; 0)
        </div>
      </div>
    </div>
  );
}
