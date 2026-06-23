import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { MatchCard } from "./MatchCard";
import { DateNavigator } from "./DateNavigator";
import { useToast } from "../contexts/ToastContext";
import type { Palpite } from "../types/database";
import "./MatchList.css"; // Certifique-se de importar o CSS aqui

interface MatchListProps {
  leagueId: string;
}

export const MatchList: React.FC<MatchListProps> = ({ leagueId }) => {
  const [allMatchesCache, setAllMatchesCache] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { addToast } = useToast();

  useEffect(() => {
    const fetchLeagueMatchesAndPredictionsOnce = async () => {
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      try {
        const { data: ligaTorneios } = await supabase
          .from("liga_torneios")
          .select("torneio_id")
          .eq("liga_id", leagueId);

        if (!ligaTorneios || ligaTorneios.length === 0) {
          setIsLoading(false);
          return;
        }

        const torneioIds = ligaTorneios.map((lt: any) => lt.torneio_id);

        const { data: partidasData, error: matchesError } = await supabase
          .from("partidas")
          .select(
            `
            id,
            time_a,
            time_b,
            sigla_mandante,
            sigla_visitante,
            emblema_mandante,
            emblema_visitante,
            fase,
            data_inicio,
            status,
            placar_a,
            placar_b,
            torneios (nome)
          `,
          )
          .in("torneio_id", torneioIds)
          .order("data_inicio", { ascending: true });

        if (matchesError) throw matchesError;

        if (!partidasData || partidasData.length === 0) {
          setIsLoading(false);
          return;
        }

        const matchIds = partidasData.map((p) => p.id);
        const { data: palpitesData, error: predictionsError } = await supabase
          .from("palpites")
          .select("*")
          .eq("usuario_id", userId)
          .in("partida_id", matchIds);

        if (predictionsError) throw predictionsError;

        const combinedData = partidasData.map((partida) => {
          const prediction = palpitesData?.find(
            (p) => p.partida_id === partida.id,
          );
          return {
            ...partida,
            userPrediction: prediction,
          };
        });

        setAllMatchesCache(combinedData);
      } catch (error: any) {
        console.error("Erro técnico detalhado:", error);
        addToast("Falha ao consultar o banco de dados.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueMatchesAndPredictionsOnce();
  }, [leagueId, addToast]);

  useEffect(() => {
    if (allMatchesCache.length === 0) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const now = new Date();

    const filteredMatches = allMatchesCache.filter((match) => {
      const matchStart = new Date(match.data_inicio);
      return matchStart >= startOfDay && matchStart <= endOfDay;
    });

    const displayReadyMatches = filteredMatches.map((match) => {
      const matchStart = new Date(match.data_inicio);
      const isAllowedStatus =
        match.status === "SCHEDULED" || match.status === "TIMED";
      const isLocked = now >= matchStart || !isAllowedStatus;

      return {
        ...match,
        isLocked: isLocked,
      };
    });

    setMatches(displayReadyMatches);
  }, [selectedDate, allMatchesCache]);

  const handleSavePrediction = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
  ) => {
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

      const updateFunction = (prevMatches: any[]) =>
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
        );

      setMatches(updateFunction);
      setAllMatchesCache(updateFunction);

      addToast("Palpite salvo com sucesso!", "success");
    } catch (error) {
      addToast("Erro ao registrar seu palpite. Tente novamente.", "error");
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="match-list-container">
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {isLoading ? (
        <div className="text-center p-8 text-muted">
          <p>Carregando todas as partidas do torneio...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center p-8 text-muted">
          <p>
            Nenhuma partida programada para os torneios desta liga na data
            selecionada.
          </p>
        </div>
      ) : (
        <div className="match-list">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              matchId={match.id}
              siglaA={match.sigla_mandante || match.time_a}
              siglaB={match.sigla_visitante || match.time_b}
              escudoA={match.emblema_mandante || match.time_a.substring(0, 3)}
              escudoB={match.emblema_visitante || match.time_b.substring(0, 3)}
              torneioNome={match.torneios?.nome || "Torneio"}
              rodada={match.fase || "Fase"}
              horario={formatTime(match.data_inicio)}
              initialPalpiteA={match.userPrediction?.palpite_a}
              initialPalpiteB={match.userPrediction?.palpite_b}
              isLocked={match.isLocked}
              isFinished={match.status === "FINISHED" || match.status === "FT"}
              placarRealA={match.placar_a}
              placarRealB={match.placar_b}
              pontosGanhos={match.userPrediction?.pontos_ganhos}
              onSavePrediction={handleSavePrediction}
            />
          ))}
        </div>
      )}
    </div>
  );
};