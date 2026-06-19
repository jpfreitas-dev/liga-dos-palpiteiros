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

    const exactScore =
      prediction.palpite_a === actualScoreA &&
      prediction.palpite_b === actualScoreB;
    const teamAWon =
      actualScoreA > actualScoreB &&
      prediction.palpite_a > prediction.palpite_b;
    const teamBWon =
      actualScoreB > actualScoreA &&
      prediction.palpite_b > prediction.palpite_a;
    const draw =
      actualScoreA === actualScoreB &&
      prediction.palpite_a === prediction.palpite_b;
    const correctDiff =
      prediction.palpite_a - prediction.palpite_b ===
      actualScoreA - actualScoreB;

    if (exactScore) {
      points = 7;
      detalhes = "Placar Exato (Cravada)";
    } else if (teamAWon || teamBWon || draw) {
      points = 4;
      detalhes = "Acertou o Vencedor/Empate";
    } else if (
      prediction.palpite_a === actualScoreA ||
      prediction.palpite_b === actualScoreB
    ) {
      points = 2;
      detalhes = "Acertou os Gols de um Time";
    } else if (correctDiff) {
      points = 1;
      detalhes = "Acertou a Diferença de Gols";
    }

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
