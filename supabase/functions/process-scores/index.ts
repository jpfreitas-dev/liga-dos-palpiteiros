import { serve } from "serve";
import { createClient } from "@supabase/supabase-js";
import {
  translationPhase,
  translationGroup,
  translationTeams,
  translationAcronyms,
} from "./translations.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (_req) => {
  try {
    const { data: activeTournaments, error: tournamentsError } = await supabase
      .from("torneios")
      .select("id, codigo_api, temporada")
      .eq("ativo", true);

    if (tournamentsError || !activeTournaments) throw tournamentsError;

    for (const tournament of activeTournaments) {
      if (!tournament.temporada) {
        console.warn(
          `Torneio ID ${tournament.id} ignorado: coluna 'temporada' nula.`,
        );
        continue;
      }

      console.log(
        `Buscando partidas para o torneio API ${tournament.codigo_api}, Temporada ${tournament.temporada}`,
      );

      const apiResponse = await fetch(
        `https://api.football-data.org/v4/competitions/${tournament.codigo_api}/matches?season=${tournament.temporada}`,
        {
          headers: { "X-Auth-Token": Deno.env.get("API_FOOTBALL_KEY")! },
        },
      );

      const apiData = await apiResponse.json();

      if (apiData.errorCode || apiData.message) {
        console.error(
          `Erro da API Football-Data para ${tournament.codigo_api}:`,
          apiData.message,
        );
        continue;
      }

      const matchesToUpsert = [];

      if (apiData.matches && apiData.matches.length > 0) {
        for (const apiMatch of apiData.matches) {
          const rawTeamA = apiMatch.homeTeam?.name;
          const rawTeamB = apiMatch.awayTeam?.name;

          const teamA = rawTeamA
            ? translationTeams[rawTeamA] || rawTeamA
            : "A definir";
          const teamB = rawTeamB
            ? translationTeams[rawTeamB] || rawTeamB
            : "A definir";

          const phaseRaw = apiMatch.matchday
            ? `Rodada ${apiMatch.matchday}`
            : apiMatch.stage;
          const phase = translationPhase[phaseRaw] || phaseRaw;

          const group = translationGroup[apiMatch.group] || apiMatch.group;

          const acronymA = apiMatch.homeTeam?.tla
            ? translationAcronyms[apiMatch.homeTeam.tla] ||
              apiMatch.homeTeam.tla
            : typeof teamA === "string"
              ? teamA.substring(0, 3).toUpperCase()
              : "TBD";

          const acronymB = apiMatch.awayTeam?.tla
            ? translationAcronyms[apiMatch.awayTeam.tla] ||
              apiMatch.awayTeam.tla
            : typeof teamB === "string"
              ? teamB.substring(0, 3).toUpperCase()
              : "TBD";

          matchesToUpsert.push({
            torneio_id: tournament.id,
            external_id: apiMatch.id,
            time_a: teamA,
            time_b: teamB,
            data_inicio: apiMatch.utcDate,
            fase: phase,
            grupo: group,
            placar_a: apiMatch.score?.fullTime?.home ?? null,
            placar_b: apiMatch.score?.fullTime?.away ?? null,
            status: apiMatch.status,
            emblema_mandante: apiMatch.homeTeam?.crest ?? null,
            emblema_visitante: apiMatch.awayTeam?.crest ?? null,
            sigla_mandante: acronymA,
            sigla_visitante: acronymB,
          });
        }
      }

      if (matchesToUpsert.length > 0) {
        const { data: savedMatches, error: matchError } = await supabase
          .from("partidas")
          .upsert(matchesToUpsert, { onConflict: "external_id" })
          .select();

        if (matchError) {
          console.error(
            `Erro no Upsert do torneio ${tournament.codigo_api}:`,
            matchError,
          );
        }

        if (savedMatches) {
          for (const match of savedMatches) {
            if (match.status === "FINISHED") {
              await calculateMatchPoints(
                match.id,
                match.placar_a,
                match.placar_b,
              );
            }
          }
        }
      } else {
        console.log(
          `Nenhuma partida encontrada para ${tournament.codigo_api}.`,
        );
      }

      await sleep(6100);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sincronização processada com a football-data.org.",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro Crítico na Edge Function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});

async function calculateMatchPoints(
  matchId: string,
  actualScoreA: number,
  actualScoreB: number,
) {
  const { data: predictions } = await supabase
    .from("palpites")
    .select("id, palpite_a, palpite_b, pontos_ganhos")
    .eq("partida_id", matchId);

  if (!predictions || predictions.length === 0) return;

  for (const prediction of predictions) {
    let points = 0;
    let detalhes = "Errou o resultado";

    const palpiteA = prediction.palpite_a;
    const palpiteB = prediction.palpite_b;

    // Cálculos de saldo (diferença)
    const diffPalpite = palpiteA - palpiteB;
    const diffActual = actualScoreA - actualScoreB;

    // Cálculos de saldo absoluto (ignorando quem ganhou, apenas a quantidade)
    const absDiffPalpite = Math.abs(diffPalpite);
    const absDiffActual = Math.abs(diffActual);

    // Cálculos de vencedor (retorna 1 para A, -1 para B, e 0 para empate)
    const signPalpite = Math.sign(diffPalpite);
    const signActual = Math.sign(diffActual);

    // Lógica de Atribuição de Pontos
    if (palpiteA === actualScoreA && palpiteB === actualScoreB) {
      points = 10;
      detalhes = "Placar Exato (Cravada)";
    } else if (diffPalpite === diffActual) {
      // Se a diferença exata for igual, o usuário acertou o vencedor e o saldo automaticamente
      points = 7;
      detalhes = "Acertou o Vencedor e o Saldo";
    } else if (signPalpite === signActual) {
      points = 5;
      detalhes = "Acertou Apenas o Vencedor";
    } else if (palpiteA === actualScoreB && palpiteB === actualScoreA) {
      points = 3;
      detalhes = "Acertou o Placar Independente do Time";
    } else if (absDiffPalpite === absDiffActual) {
      points = 1;
      detalhes = "Acertou o Saldo Independente do Time";
    }

    // Atualiza no banco de dados apenas se a pontuação atual for diferente
    if (prediction.pontos_ganhos !== points) {
      await supabase
        .from("palpites")
        .update({
          pontos_ganhos: points,
          detalhe_pontuacao: detalhes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prediction.id);
    }
  }
}
