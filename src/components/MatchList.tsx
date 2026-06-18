import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import type { Partida, Palpite } from "../types/database";
import "./MatchList.css";

interface MatchListProps {
  leagueId: string;
}

interface MatchWithPrediction extends Partida {
  userPrediction?: Palpite;
  isLocked: boolean;
}

export const MatchList: React.FC<MatchListProps> = ({ leagueId }) => {
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<
    Record<string, "saving" | "saved" | "error">
  >({});

  const fetchMatchesAndPredictions = async () => {
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) return;

    try {
      const { data: ligaTorneios, error: ltError } = await supabase
        .from("liga_torneios")
        .select("torneio_id")
        .eq("liga_id", leagueId);

      if (ltError) throw ltError;

      const tournamentIds = ligaTorneios?.map((lt) => lt.torneio_id) || [];

      if (tournamentIds.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      const { data: partidasData, error: matchesError } = await supabase
        .from("partidas")
        .select("*")
        .in("torneio_id", tournamentIds)
        .order("data_inicio", { ascending: true });

      if (matchesError) throw matchesError;

      const { data: palpitesData, error: predictionsError } = await supabase
        .from("palpites")
        .select("*")
        .eq("usuario_id", userId);

      if (predictionsError) throw predictionsError;

      const now = new Date();

      const combinedData: MatchWithPrediction[] = partidasData.map(
        (partida) => {
          const prediction = palpitesData.find(
            (p) => p.partida_id === partida.id,
          );
          const matchStart = new Date(partida.data_inicio);
          const locked = now >= matchStart || partida.status === "FT";

          return {
            ...partida,
            userPrediction: prediction,
            isLocked: locked,
          };
        },
      );

      setMatches(combinedData);
    } catch (error) {
      console.error("Erro ao buscar dados da liga:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndPredictions();
  }, [leagueId]);

  const handleSavePrediction = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
  ) => {
    setSavingStatus((prev) => ({ ...prev, [matchId]: "saving" }));

    const { data: userData } = await supabase.auth.getUser();

    try {
      const { error } = await supabase.from("palpites").upsert(
        {
          usuario_id: userData.user?.id,
          partida_id: matchId,
          palpite_a: scoreA,
          palpite_b: scoreB,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "usuario_id, partida_id" },
      );

      if (error) throw error;

      setSavingStatus((prev) => ({ ...prev, [matchId]: "saved" }));
      setTimeout(
        () =>
          setSavingStatus((prev) => {
            const next = { ...prev };
            delete next[matchId];
            return next;
          }),
        2000,
      );

      // Atualiza o estado local para refletir o palpite salvo
      setMatches((prevMatches) =>
        prevMatches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                userPrediction: {
                  ...m.userPrediction,
                  palpite_a: scoreA,
                  palpite_b: scoreB,
                } as Palpite,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("Erro ao salvar palpite:", error);
      setSavingStatus((prev) => ({ ...prev, [matchId]: "error" }));
    }
  };

  const formatMatchTime = (utcString: string) => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(utcString));
  };

  if (isLoading)
    return (
      <div className="loading-state" aria-live="polite">
        Carregando jogos...
      </div>
    );

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <p>Esta liga ainda não possui torneios ativos ou jogos agendados.</p>
        <p>
          O administrador da liga precisa adicionar torneios nas configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <article
          key={match.id}
          className={`match-card ${match.isLocked ? "locked" : ""}`}
        >
          <header className="match-header">
            <span className="match-phase">
              {match.fase} {match.grupo ? `- ${match.grupo}` : ""}
            </span>
            <span className="match-time" aria-label="Data e hora da partida">
              {formatMatchTime(match.data_inicio)}
            </span>
          </header>

          <form
            className="match-teams"
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as HTMLFormElement;
              const inputA = target.elements.namedItem(
                `scoreA-${match.id}`,
              ) as HTMLInputElement;
              const inputB = target.elements.namedItem(
                `scoreB-${match.id}`,
              ) as HTMLInputElement;
              handleSavePrediction(
                match.id,
                parseInt(inputA.value),
                parseInt(inputB.value),
              );
            }}
          >
            <div className="team-block">
              <img
                src={match.emblema_mandante || ""}
                alt={`Escudo do ${match.time_a}`}
                className="team-logo"
                loading="lazy"
              />
              <span className="team-name" title={match.time_a}>
                {match.sigla_mandante || match.time_a}
              </span>
              <input
                type="number"
                name={`scoreA-${match.id}`}
                defaultValue={match.userPrediction?.palpite_a ?? ""}
                min="0"
                max="20"
                disabled={match.isLocked}
                aria-disabled={match.isLocked}
                aria-label={`Seu palpite de gols para o ${match.time_a}`}
                required
              />
            </div>

            <div className="match-vs">
              <span>X</span>
              {!match.isLocked && (
                <button
                  type="submit"
                  className={`btn-save ${savingStatus[match.id] || ""}`}
                  disabled={savingStatus[match.id] === "saving"}
                >
                  {savingStatus[match.id] === "saving"
                    ? "..."
                    : savingStatus[match.id] === "saved"
                      ? "✓"
                      : "Salvar"}
                </button>
              )}
            </div>

            <div className="team-block">
              <input
                type="number"
                name={`scoreB-${match.id}`}
                defaultValue={match.userPrediction?.palpite_b ?? ""}
                min="0"
                max="20"
                disabled={match.isLocked}
                aria-disabled={match.isLocked}
                aria-label={`Seu palpite de gols para o ${match.time_b}`}
                required
              />
              <span className="team-name" title={match.time_b}>
                {match.sigla_visitante || match.time_b}
              </span>
              <img
                src={match.emblema_visitante || ""}
                alt={`Escudo do ${match.time_b}`}
                className="team-logo"
                loading="lazy"
              />
            </div>
          </form>

          {match.status === "FT" && (
            <footer className="match-footer">
              <span className="actual-score">
                Placar Final: {match.placar_a} x {match.placar_b}
              </span>
              <span className="points-earned">
                Pontos: {match.userPrediction?.pontos_ganhos ?? 0}
              </span>
            </footer>
          )}
        </article>
      ))}
    </div>
  );
};
