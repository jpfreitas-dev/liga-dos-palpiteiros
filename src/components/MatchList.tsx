import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "./MatchList.css";

export function MatchList({ userId }: { userId: string }) {
  const getLocalDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const [dataFoco, setDataFoco] = useState(getLocalDate());
  const [partidas, setPartidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tempPalpites, setTempPalpites] = useState<
    Record<string, { a: number; b: number }>
  >({});

  useEffect(() => {
    async function carregarPartidas() {
      setLoading(true);
      const startOfDay = `${dataFoco}T00:00:00-03:00`;
      const endOfDay = `${dataFoco}T23:59:59-03:00`;

      const { data } = await supabase
        .from("partidas")
        .select(`*, palpites (id, palpite_a, palpite_b)`)
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

  const handleSalvarPalpite = async (partidaId: string, palpiteId?: string) => {
    const palpite = tempPalpites[partidaId];
    if (!palpite) return;

    if (
      isNaN(palpite.a) ||
      isNaN(palpite.b) ||
      palpite.a < 0 ||
      palpite.a > 99 ||
      palpite.b < 0 ||
      palpite.b > 99
    ) {
      alert(
        "Por favor, insira um placar válido (apenas números entre 0 e 99).",
      );
      return;
    }

    const valA = palpite.a;
    const valB = palpite.b;
    let dbError = null;

    if (palpiteId) {
      const { error } = await supabase
        .from("palpites")
        .update({ palpite_a: valA, palpite_b: valB })
        .eq("id", palpiteId);
      dbError = error;
    } else {
      const { error } = await supabase.from("palpites").insert({
        usuario_id: userId,
        partida_id: partidaId,
        palpite_a: valA,
        palpite_b: valB,
      });
      dbError = error;
    }

    if (dbError) {
      console.error("Erro do Supabase:", dbError.message);
      alert(
        "Erro ao salvar o palpite. O jogo já pode ter começado ou os dados são inválidos.",
      );
    } else {
      alert("Palpite salvo com sucesso!");
    }
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
          const isAdefinir =
            p.time_a === "A Definir" || p.time_b === "A Definir";
          const agora = new Date().getTime();
          const horaJogo = new Date(p.data_inicio).getTime();
          const bloqueado = agora >= horaJogo - 10 * 60000 || isAdefinir;
          const palpite = p.palpites?.[0];

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
                  {p.time_a !== "A Definir" && p.emblema_mandante && (
                    <img
                      src={p.emblema_mandante}
                      alt={p.time_a}
                      className="flag"
                    />
                  )}
                  <div className="team-name">{p.time_a}</div>
                </div>

                <div className="inputs">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={bloqueado}
                    defaultValue={palpite?.palpite_a}
                    onChange={(e) =>
                      setTempPalpites((prev) => ({
                        ...prev,
                        [p.id]: {
                          a: parseInt(e.target.value),
                          b: tempPalpites[p.id]?.b ?? palpite?.palpite_b ?? 0,
                        },
                      }))
                    }
                  />
                  <span>x</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={bloqueado}
                    defaultValue={palpite?.palpite_b}
                    onChange={(e) =>
                      setTempPalpites((prev) => ({
                        ...prev,
                        [p.id]: {
                          a: tempPalpites[p.id]?.a ?? palpite?.palpite_a ?? 0,
                          b: parseInt(e.target.value),
                        },
                      }))
                    }
                  />
                </div>

                <div className="team">
                  {p.time_b !== "A Definir" && p.emblema_visitante && (
                    <img
                      src={p.emblema_visitante}
                      alt={p.time_b}
                      className="flag"
                    />
                  )}
                  <div className="team-name">{p.time_b}</div>
                </div>
              </div>

              {!bloqueado && (
                <button
                  className="btn-salvar"
                  onClick={() => handleSalvarPalpite(p.id, palpite?.id)}
                >
                  Salvar Palpite
                </button>
              )}

              {agora >= horaJogo && !isAdefinir && (
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
