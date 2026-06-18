// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  translationPhase,
  translationGroup,
  translationTeams,
  translationAcronyms,
} from "./translations.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (_req) => {
  try {
    const { data: activeTournaments, error: tournamentsError } = await supabase
      .from("torneios")
      .select("id, codigo_api")
      .eq("ativo", true);

    if (tournamentsError || !activeTournaments) throw tournamentsError;

    for (const tournament of activeTournaments) {
      const apiResponse = await fetch(
        `URL_DA_SUA_API/fixtures?league=${tournament.codigo_api}`,
        {
          headers: { "x-api-key": "SUA_CHAVE_AQUI" },
        },
      );
      const apiData = await apiResponse.json();

      for (const apiMatch of apiData.response) {
        const teamA =
          translationTeams[apiMatch.teams.home.name] ||
          apiMatch.teams.home.name;
        const teamB =
          translationTeams[apiMatch.teams.away.name] ||
          apiMatch.teams.away.name;
        const phase =
          translationPhase[apiMatch.league.round] || apiMatch.league.round;
        const group =
          translationGroup[apiMatch.league.group] || apiMatch.league.group;
        const acronymA =
          translationAcronyms[apiMatch.teams.home.code] ||
          apiMatch.teams.home.code;
        const acronymB =
          translationAcronyms[apiMatch.teams.away.code] ||
          apiMatch.teams.away.code;

        const { data: savedMatch, error: _matchError } = await supabase
          .from("partidas")
          .upsert(
            {
              torneio_id: tournament.id,
              external_id: apiMatch.fixture.id,
              time_a: teamA,
              time_b: teamB,
              data_inicio: apiMatch.fixture.date,
              fase: phase,
              grupo: group,
              placar_a: apiMatch.goals.home,
              placar_b: apiMatch.goals.away,
              status: apiMatch.fixture.status.short,
              emblema_mandante: apiMatch.teams.home.logo,
              emblema_visitante: apiMatch.teams.away.logo,
              sigla_mandante: acronymA,
              sigla_visitante: acronymB,
            },
            { onConflict: "external_id" },
          )
          .select()
          .single();

        if (savedMatch && apiMatch.fixture.status.short === "FT") {
          await calculateMatchPoints(
            savedMatch.id,
            apiMatch.goals.home,
            apiMatch.goals.away,
          );
        }
      }

      await sleep(6100);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Sync completed" }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
    .select("id, palpite_a, palpite_b")
    .eq("partida_id", matchId)
    .is("pontos_ganhos", null);

  if (!predictions) return;

  for (const prediction of predictions) {
    let points = 0;

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

    if (exactScore) {
      points = 7;
    } else if (teamAWon || teamBWon || draw) {
      points = 4;
    }

    await supabase
      .from("palpites")
      .update({ pontos_ganhos: points, updated_at: new Date().toISOString() })
      .eq("id", prediction.id);
  }
}
