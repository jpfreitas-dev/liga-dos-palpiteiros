import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "./MatchList.css";

export function MatchList({ userId }: { userId: string }) {
  const [dataFoco, setDataFoco] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [partidas, setPartidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPartidas() {
      setLoading(true);
      const startOfDay = `${dataFoco}T00:00:00-03:00`;
      const endOfDay = `${dataFoco}T23:59:59-03:00`;

      const { data } = await supabase
        .from("partidas")
        .select(`*, palpites (palpite_a, palpite_b)`)
        .eq("palpites.usuario_id", userId)
        .gte("data_inicio", startOfDay)
        .lte("data_inicio", endOfDay)
        .order("data_inicio", { ascending: true });

      setPartidas(data || []);
      setLoading(false);
    }
    carregarPartidas();
  }, [dataFoco, userId]);

  const alterarData = (dias: number) => {
    const novaData = new Date(dataFoco + "T12:00:00");
    novaData.setDate(novaData.getDate() + dias);
    setDataFoco(novaData.toISOString().split("T")[0]);
  };

  return (
    <div className="match-list">
      <div className="date-navigator">
        <button onClick={() => alterarData(-1)} className="nav-btn">
          <img src="src/assets/arrow-left.svg" alt="Anterior" />
        </button>
        <input
          type="date"
          value={dataFoco}
          onChange={(e) => setDataFoco(e.target.value)}
          className="date-input"
        />
        <button onClick={() => alterarData(1)} className="nav-btn">
          <img src="src/assets/arrow-right.svg" alt="Próximo" />
        </button>
      </div>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : partidas.length === 0 ? (
        <div className="empty-state">
          <h2>Sem jogos agendados para este dia.</h2>
        </div>
      ) : (
        partidas.map((p) => {
          const agora = new Date().getTime();
          const horaJogo = new Date(p.data_inicio).getTime();
          const bloqueado = agora >= horaJogo - 10 * 60000; // Bloqueia 10min antes

          return (
            <div
              key={p.id}
              className={`match-card ${bloqueado ? "locked" : ""}`}
            >
              <div className="match-info">
                <span className="fase-tag">{p.fase}</span>
                <span>
                  {new Date(p.data_inicio).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="scoreboard">
                <div className="team">
                  <img
                    src={p.emblema_mandante}
                    alt={p.time_a}
                    className="flag"
                  />
                  <div className="team-name">{p.time_a}</div>
                </div>
                <div className="inputs">
                  <input
                    type="number"
                    disabled={bloqueado}
                    defaultValue={p.palpites?.[0]?.palpite_a}
                  />
                  <span>x</span>
                  <input
                    type="number"
                    disabled={bloqueado}
                    defaultValue={p.palpites?.[0]?.palpite_b}
                  />
                </div>
                <div className="team">
                  <img
                    src={p.emblema_visitante}
                    alt={p.time_b}
                    className="flag"
                  />
                  <div className="team-name">{p.time_b}</div>
                </div>
              </div>

              {/* Resultado Oficial (Exibido se o jogo já começou ou terminou) */}
              {agora >= horaJogo && (
                <div className="official-result">
                  <span>
                    Placar Oficial: {p.placar_a ?? "-"} x {p.placar_b ?? "-"}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
