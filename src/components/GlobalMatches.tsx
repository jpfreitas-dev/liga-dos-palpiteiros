import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { MatchCard } from "./MatchCard";
import { DateNavigator } from "./DateNavigator";
import { useToast } from "../contexts/ToastContext";
import type { Palpite } from "../types/database";
import "./GlobalMatches.css";

interface GlobalMatchesProps {
  userId: string;
}

export const GlobalMatches: React.FC<GlobalMatchesProps> = ({ userId }) => {
  // Novo Estado: Armazena o "pacote" gigante com todos os jogos
  const [allMatchesCache, setAllMatchesCache] = useState<any[]>([]);
  // Estado de exibição: Mostra apenas o que for filtrado pela data
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { addToast } = useToast();

  // useEffect PRINCIPAL: Roda apenas UMA VEZ na montagem do componente (ou se o userId mudar)
  useEffect(() => {
    const fetchAllDataOnce = async () => {
      setIsLoading(true);

      try {
        // 1. Pega os torneios que o usuário participa
        const { data: membros } = await supabase
          .from("membros_liga")
          .select("liga_id")
          .eq("usuario_id", userId);

        if (!membros || membros.length === 0) {
          setIsLoading(false);
          return;
        }

        const ligaIds = membros.map((m: any) => m.liga_id);
        const { data: ligaTorneios } = await supabase
          .from("liga_torneios")
          .select("torneio_id")
          .in("liga_id", ligaIds);

        if (!ligaTorneios || ligaTorneios.length === 0) {
          setIsLoading(false);
          return;
        }

        const torneioIds = [
          ...new Set(ligaTorneios.map((lt: any) => lt.torneio_id)),
        ];

        // 2. Busca TODAS as partidas ativas desses torneios (sem filtro de data)
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

        // 3. Busca TODOS os palpites desse usuário para essas partidas
        const matchIds = partidasData.map((p) => p.id);
        const { data: palpitesData, error: predictionsError } = await supabase
          .from("palpites")
          .select("*")
          .eq("usuario_id", userId)
          .in("partida_id", matchIds);

        if (predictionsError) throw predictionsError;

        // 4. Combina tudo em um super array e salva no CACHE local
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
      } catch (error) {
        console.error("Erro ao carregar os dados iniciais:", error);
        addToast("Falha ao carregar as partidas do servidor.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDataOnce();
  }, [userId, addToast]); // ARRAY DE DEPENDÊNCIAS VAZIO/ESTÁTICO: A DATA NÃO ESTÁ AQUI.

  // useEffect SECUNDÁRIO: Roda localmente toda vez que o usuário CLICA na data
  useEffect(() => {
    // Se o cache ainda estiver vazio, não faz nada
    if (allMatchesCache.length === 0) return;

    // Define os limites da data selecionada na tela
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const now = new Date();

    // Filtra o CACHE na memória RAM do aparelho (ZERO requisições ao Supabase)
    const filteredMatches = allMatchesCache.filter((match) => {
      const matchStart = new Date(match.data_inicio);
      return matchStart >= startOfDay && matchStart <= endOfDay;
    });

    // Aplica a regra visual de travamento
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
  }, [selectedDate, allMatchesCache]); // Este efeito roda apenas no cliente

  const handleSavePrediction = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
  ) => {
    try {
      // O único POST para o banco de dados ocorre quando o usuário decide salvar
      const { error } = await supabase.from("palpites").upsert(
        {
          usuario_id: userId,
          partida_id: matchId,
          palpite_a: scoreA,
          palpite_b: scoreB,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "usuario_id, partida_id" },
      );

      if (error) throw error;

      // Atualiza o estado visual na tela E no cache
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
      setAllMatchesCache(updateFunction); // Atualiza o cache principal também

      addToast("Palpite salvo!", "success");
    } catch (error) {
      addToast("Erro ao registrar palpite.", "error");
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
    <div className="global-matches-container">
      <header className="global-header">
        <h2>Painel Global de Jogos</h2>
        <p>
          Seus palpites aqui são aplicados automaticamente em todas as suas
          ligas.
        </p>
      </header>

      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {isLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          <p>Sincronizando banco de dados pela primeira vez...</p>
        </div>
      ) : matches.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
          }}
        >
          <p>Não há partidas agendadas para a data selecionada.</p>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              matchId={match.id}
              siglaA={match.sigla_mandante || match.time_a}
              siglaB={match.sigla_visitante || match.time_b}
              escudoA={match.emblema_mandante || match.time_a.substring(0, 3)}
              escudoB={match.emblema_visitante || match.time_b.substring(0, 3)}
              torneioNome={match.torneios?.nome || "Torneio"}
              rodada={match.fase || "Rodada"}
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
