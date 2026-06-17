import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import type { Match, Prediction } from "../types/database";
import "./MatchList.css";

export function MatchList({
  userId,
  tournamentId,
}: {
  userId: string;
  tournamentId: string;
}) {
  const getLocalDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const [focusedDate, setFocusedDate] = useState(getLocalDate());
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tempPredictions, setTempPredictions] = useState<
    Record<string, { a: number; b: number }>
  >({});

  useEffect(() => {
    async function fetchMatches() {
      setIsLoading(true);
      const startOfDay = `${focusedDate}T00:00:00-03:00`;
      const endOfDay = `${focusedDate}T23:59:59-03:00`;

      const { data, error } = await supabase
        .from("partidas")
        .select(`*, palpites (id, palpite_a, palpite_b)`)
        .eq("torneio_id", tournamentId)
        .eq("palpites.usuario_id", userId)
        .gte("data_inicio", startOfDay)
        .lte("data_inicio", endOfDay)
        .order("data_inicio", { ascending: true });

      if (error) {
        console.error("Fetch error:", error.message);
      }

      setMatches((data as Match[]) || []);
      setIsLoading(false);
    }
    fetchMatches();
  }, [focusedDate, userId, tournamentId]);

  const changeDate = (days: number) => {
    const newDate = new Date(focusedDate + "T12:00:00");
    newDate.setDate(newDate.getDate() + days);
    setFocusedDate(newDate.toISOString().split("T")[0]);
  };

  const handleSavePrediction = async (
    matchId: string,
    predictionId?: string,
  ) => {
    const prediction = tempPredictions[matchId];
    if (!prediction) return;

    if (
      isNaN(prediction.a) ||
      isNaN(prediction.b) ||
      prediction.a < 0 ||
      prediction.a > 99 ||
      prediction.b < 0 ||
      prediction.b > 99
    ) {
      alert(
        "Por favor, insira um placar válido (apenas números entre 0 e 99).",
      );
      return;
    }

    const valA = prediction.a;
    const valB = prediction.b;
    let dbError = null;

    if (predictionId) {
      const { error } = await supabase
        .from("palpites")
        .update({ palpite_a: valA, palpite_b: valB })
        .eq("id", predictionId);
      dbError = error;
    } else {
      const { error } = await supabase.from("palpites").insert({
        usuario_id: userId,
        partida_id: matchId,
        palpite_a: valA,
        palpite_b: valB,
      });
      dbError = error;
    }

    if (dbError) {
      console.error("Supabase Error:", dbError.message);
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
        <button onClick={() => changeDate(-1)} className="nav-btn">
          <img src="src/assets/arrow-left.svg" alt="Anterior" />
        </button>

        <input
          type="date"
          value={focusedDate}
          onChange={(e) => setFocusedDate(e.target.value)}
          className="date-input"
        />

        <button onClick={() => changeDate(1)} className="nav-btn">
          <img src="src/assets/arrow-right.svg" alt="Próximo" />
        </button>
      </div>

      {isLoading ? (
        <p className="loading">Carregando...</p>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <h2>Sem jogos agendados para este dia.</h2>
        </div>
      ) : (
        matches.map((match) => {
          const isToDefine =
            match.time_a === "A Definir" || match.time_b === "A Definir";
          const now = new Date().getTime();
          const matchTime = new Date(match.data_inicio).getTime();
          const isLocked = now >= matchTime - 10 * 60000 || isToDefine;
          const predictionData: Prediction | undefined = match.palpites?.[0];

          return (
            <div
              key={match.id}
              className={`match-card ${isLocked ? "locked" : ""}`}
            >
              <div className="match-info">
                <span className="fase-tag">{match.fase}</span>
                <span>
                  {new Date(match.data_inicio).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="scoreboard">
                <div className="team">
                  {match.time_a !== "A Definir" && match.emblema_mandante && (
                    <img
                      src={match.emblema_mandante}
                      alt={match.time_a}
                      className="flag"
                    />
                  )}
                  <div className="team-name">{match.time_a}</div>
                </div>

                <div className="inputs">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={isLocked}
                    defaultValue={predictionData?.palpite_a}
                    onChange={(e) =>
                      setTempPredictions((prev) => ({
                        ...prev,
                        [match.id]: {
                          a: parseInt(e.target.value),
                          b:
                            tempPredictions[match.id]?.b ??
                            predictionData?.palpite_b ??
                            0,
                        },
                      }))
                    }
                  />
                  <span>x</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    disabled={isLocked}
                    defaultValue={predictionData?.palpite_b}
                    onChange={(e) =>
                      setTempPredictions((prev) => ({
                        ...prev,
                        [match.id]: {
                          a:
                            tempPredictions[match.id]?.a ??
                            predictionData?.palpite_a ??
                            0,
                          b: parseInt(e.target.value),
                        },
                      }))
                    }
                  />
                </div>

                <div className="team">
                  {match.time_b !== "A Definir" && match.emblema_visitante && (
                    <img
                      src={match.emblema_visitante}
                      alt={match.time_b}
                      className="flag"
                    />
                  )}
                  <div className="team-name">{match.time_b}</div>
                </div>
              </div>

              {!isLocked && (
                <button
                  className="btn-salvar"
                  onClick={() =>
                    handleSavePrediction(match.id, predictionData?.id)
                  }
                >
                  Salvar Palpite
                </button>
              )}

              {now >= matchTime && !isToDefine && (
                <div className="official-result">
                  <span>
                    Placar Oficial: {match.placar_a ?? "-"} x{" "}
                    {match.placar_b ?? "-"}
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
