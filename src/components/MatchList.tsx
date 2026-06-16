import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import type { Partida, Palpite } from "../types/database";
import { differenceInMinutes, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock, CalendarOff } from "lucide-react";
import "./MatchList.css";

export const MatchList: React.FC<{ userId: string }> = ({ userId }) => {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [palpites, setPalpites] = useState<Record<string, Palpite>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    // 1. Buscar partidas (ex: próximas 48h ou do torneio ativo)
    const { data: matches } = await supabase
      .from("partidas")
      .select("*")
      .order("data_inicio", { ascending: true });

    // 2. Buscar palpites existentes do usuário
    const { data: predictions } = await supabase
      .from("palpites")
      .select("*")
      .eq("usuario_id", userId);

    if (matches) setPartidas(matches);

    const predictionsMap: Record<string, Palpite> = {};
    predictions?.forEach((p) => {
      predictionsMap[p.partida_id] = p;
    });
    setPalpites(predictionsMap);
    setLoading(false);
  };

  const handleSavePalpite = async (partidaId: string) => {
    const palpite = palpites[partidaId];
    if (!palpite || palpite.palpite_a === "" || palpite.palpite_b === "")
      return;

    const { error } = await supabase.from("palpites").upsert({
      ...palpite,
      usuario_id: userId,
      partida_id: partidaId,
      updated_at: new Date().toISOString(),
    });

    if (error) alert("Erro ao salvar: " + error.message);
    else alert("Palpite salvo com sucesso!");
  };

  const updateLocalPalpite = (
    partidaId: string,
    field: keyof Palpite,
    value: any,
  ) => {
    setPalpites((prev) => ({
      ...prev,
      [partidaId]: {
        ...(prev[partidaId] || {
          partida_id: partidaId,
          palpite_a: "",
          palpite_b: "",
        }),
        [field]: value,
      },
    }));
  };

  if (loading) return <div className="loading">Carregando jogos...</div>;

  // Empty State
  if (partidas.length === 0) {
    return (
      <div className="empty-state">
        <CalendarOff size={3} color="var(--text-muted)" />
        <h2>Nenhum jogo agendado</h2>
        <p>
          Não há partidas previstas para os próximos dias. Aproveite a pausa!
        </p>
      </div>
    );
  }

  return (
    <div className="match-list">
      {partidas.map((match) => {
        const dataInicio = parseISO(match.data_inicio);
        const isLocked = differenceInMinutes(dataInicio, new Date()) <= 30;
        const palpite = palpites[match.id] || { palpite_a: "", palpite_b: "" };
        const isDraw =
          palpite.palpite_a !== "" && palpite.palpite_a === palpite.palpite_b;
        const showPenalty = match.fase !== "grupos" && isDraw;

        return (
          <article
            key={match.id}
            className={`match-card ${isLocked ? "locked" : ""}`}
          >
            <header className="match-info">
              <span className="fase-tag">{match.fase.toUpperCase()}</span>
              <time>
                {format(dataInicio, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </time>
              {isLocked && <Lock size={1} className="lock-icon" />}
            </header>

            <div className="scoreboard">
              <div className="team">
                <span className="team-name">{match.time_a}</span>
              </div>

              <div className="inputs">
                <input
                  type="number"
                  min="0"
                  value={palpite.palpite_a}
                  disabled={isLocked}
                  onChange={(e) =>
                    updateLocalPalpite(
                      match.id,
                      "palpite_a",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
                <span className="vs">X</span>
                <input
                  type="number"
                  min="0"
                  value={palpite.palpite_b}
                  disabled={isLocked}
                  onChange={(e) =>
                    updateLocalPalpite(
                      match.id,
                      "palpite_b",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>

              <div className="team">
                <span className="team-name">{match.time_b}</span>
              </div>
            </div>

            {showPenalty && (
              <div className="penalty-box">
                <label htmlFor={`penalty-${match.id}`}>
                  Quem vence nos pênaltis?
                </label>
                <select
                  id={`penalty-${match.id}`}
                  value={palpite.vencedor_penaltis_palpite || ""}
                  disabled={isLocked}
                  required
                  onChange={(e) =>
                    updateLocalPalpite(
                      match.id,
                      "vencedor_penaltis_palpite",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Selecione...</option>
                  <option value={match.time_a}>{match.time_a}</option>
                  <option value={match.time_b}>{match.time_b}</option>
                </select>
              </div>
            )}

            <button
              className="btn-save"
              disabled={
                isLocked ||
                palpite.palpite_a === "" ||
                (showPenalty && !palpite.vencedor_penaltis_palpite)
              }
              onClick={() => handleSavePalpite(match.id)}
            >
              {isLocked ? "Palpites Encerrados" : "Salvar Palpite"}
            </button>
          </article>
        );
      })}
    </div>
  );
};
