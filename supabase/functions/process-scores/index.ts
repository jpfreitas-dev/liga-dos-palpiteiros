import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const forceRecalculate =
      url.searchParams.get("forceRecalculate") === "true";

    // Adicionado 'ano' na consulta
    const { data: torneios, error: torneiosError } = await supabase
      .from("torneios")
      .select("id, codigo_api, ano")
      .eq("ativo", true);

    if (torneiosError) throw new Error("Erro ao buscar torneios ativos");
    if (!torneios || torneios.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum torneio ativo encontrado." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const traducaoFase: Record<string, string> = {
      GROUP_STAGE: "Fase de Grupos",
      LAST_32: "16 Avos de Final",
      LAST_16: "Oitavas de Final",
      QUARTER_FINALS: "Quartas de Final",
      SEMI_FINALS: "Semifinal",
      THIRD_PLACE: "Disputa de 3º Lugar",
      FINAL: "Final",
    };

    const traducaoGrupo: Record<string, string> = {
      GROUP_A: "Grupo A",
      GROUP_B: "Grupo B",
      GROUP_C: "Grupo C",
      GROUP_D: "Grupo D",
      GROUP_E: "Grupo E",
      GROUP_F: "Grupo F",
      GROUP_G: "Grupo G",
      GROUP_H: "Grupo H",
      GROUP_I: "Grupo I",
      GROUP_J: "Grupo J",
      GROUP_K: "Grupo K",
      GROUP_L: "Grupo L",
    };

    const traducaoTimes: Record<string, string> = {
      Canada: "Canadá",
      "United States": "Estados Unidos",
      Mexico: "México",
      Argentina: "Argentina",
      Brazil: "Brasil",
      Ecuador: "Equador",
      Uruguay: "Uruguai",
      Colombia: "Colômbia",
      Paraguay: "Paraguai",
      Germany: "Alemanha",
      Austria: "Áustria",
      Belgium: "Bélgica",
      Croatia: "Croácia",
      Spain: "Espanha",
      France: "França",
      England: "Inglaterra",
      Norway: "Noruega",
      Netherlands: "Holanda",
      Portugal: "Portugal",
      Switzerland: "Suíça",
      "Bosnia and Herzegovina": "Bósnia e Herzegovina",
      Scotland: "Escócia",
      Czechia: "Tchéquia",
      Sweden: "Suécia",
      Turkey: "Turquia",
      "South Africa": "África do Sul",
      Algeria: "Argélia",
      "Cape Verde Islands": "Cabo Verde",
      "Ivory Coast": "Costa do Marfim",
      Egypt: "Egito",
      Ghana: "Gana",
      Morocco: "Marrocos",
      Senegal: "Senegal",
      Tunisia: "Tunísia",
      "Saudi Arabia": "Arábia Saudita",
      Australia: "Austrália",
      Jordan: "Jordânia",
      Qatar: "Catar",
      "South Korea": "Coreia do Sul",
      "United Arab Emirates": "Emirados Árabes Unidos",
      Iran: "Irã",
      Japan: "Japão",
      Uzbekistan: "Uzbequistão",
      Curaçao: "Curaçao",
      Haiti: "Haiti",
      Panama: "Panamá",
      "New Zealand": "Nova Zelândia",
      Iraq: "Iraque",
      "DR Congo": "RD Congo",
    };

    const traducaoSiglas: Record<string, string> = {
      CAN: "CAN",
      USA: "EUA",
      MEX: "MEX",
      ARG: "ARG",
      BRA: "BRA",
      ECU: "EQU",
      URU: "URU",
      COL: "COL",
      PAR: "PAR",
      GER: "ALE",
      AUT: "AUT",
      BEL: "BEL",
      CRO: "CRO",
      ESP: "ESP",
      FRA: "FRA",
      ENG: "ING",
      NOR: "NOR",
      NED: "HOL",
      POR: "POR",
      SUI: "SUI",
      BIH: "BOS",
      SCO: "ESC",
      CZE: "RTC",
      SWE: "SUE",
      TUR: "TUR",
      RSA: "AFS",
      ALG: "ALG",
      CPV: "CBV",
      CIV: "CDM",
      EGY: "EGI",
      GHA: "GAN",
      MAR: "MAR",
      SEN: "SEN",
      TUN: "TUN",
      KSA: "ARA",
      AUS: "AUS",
      JOR: "JOR",
      QAT: "CAT",
      KOR: "COR",
      UAE: "EAU",
      IRN: "IRA",
      JPN: "JAP",
      UZB: "UZB",
      CUW: "CUR",
      HAI: "HAI",
      PAN: "PAN",
      BRU: "BRU",
      NZL: "NZL",
      IRQ: "IRQ",
      COD: "RDC",
    };

    for (let i = 0; i < torneios.length; i++) {
      const torneio = torneios[i];
      if (!torneio.codigo_api || !torneio.ano) continue;

      // Adicionado ?season= na URL
      const response = await fetch(
        `https://api.football-data.org/v4/competitions/${torneio.codigo_api}/matches?season=${torneio.ano}`,
        {
          headers: {
            "X-Auth-Token": Deno.env.get("API_FOOTBALL_KEY") ?? "",
            Connection: "close", // Força fechamento para evitar erro HTTP/2
          },
        },
      );

      if (response.status === 429) {
        throw new Error(
          `Limite da API excedido no torneio ${torneio.codigo_api}`,
        );
      }

      const data = await response.json();
      if (!data.matches) continue;

      for (const match of data.matches) {
        const isAdefinir = !match.homeTeam.name || !match.awayTeam.name;

        const partidaData = {
          torneio_id: torneio.id,
          time_a: isAdefinir
            ? "A Definir"
            : traducaoTimes[match.homeTeam.name] || match.homeTeam.name,
          time_b: isAdefinir
            ? "A Definir"
            : traducaoTimes[match.awayTeam.name] || match.awayTeam.name,
          data_inicio: match.utcDate,
          status: match.status,
          fase: match.matchday
            ? `Rodada ${match.matchday}`
            : traducaoFase[match.stage] || match.stage,
          grupo: match.group ? traducaoGrupo[match.group] || match.group : null,
          emblema_mandante: isAdefinir ? null : match.homeTeam.crest,
          emblema_visitante: isAdefinir ? null : match.awayTeam.crest,
          sigla_mandante: isAdefinir
            ? null
            : traducaoSiglas[match.homeTeam.tla] || match.homeTeam.tla,
          sigla_visitante: isAdefinir
            ? null
            : traducaoSiglas[match.awayTeam.tla] || match.awayTeam.tla,
          placar_a: match.score.fullTime.home ?? null,
          placar_b: match.score.fullTime.away ?? null,
        };

        const { data: partida, error: partidaError } = await supabase
          .from("partidas")
          .upsert(
            { external_id: match.id, ...partidaData },
            { onConflict: "external_id" },
          )
          .select("id")
          .single();

        // Verificação de segurança adicionada
        if (partidaError || !partida) continue;

        if ((match.status === "FINISHED" || forceRecalculate) && partida) {
          const realA = match.score.fullTime.home ?? 0;
          const realB = match.score.fullTime.away ?? 0;
          const realWinner = realA > realB ? "A" : realB > realA ? "B" : "DRAW";

          const { data: palpites } = await supabase
            .from("palpites")
            .select("*")
            .eq("partida_id", partida.id)
            .or("pontos_ganhos.eq.0,pontos_ganhos.is.null");

          for (const palpite of palpites || []) {
            let pontos = 0;
            let detalhe = "Errou o palpite";
            const pWinner =
              palpite.palpite_a > palpite.palpite_b
                ? "A"
                : palpite.palpite_b > palpite.palpite_a
                  ? "B"
                  : "DRAW";

            if (palpite.palpite_a === realA && palpite.palpite_b === realB) {
              pontos = 7;
              detalhe = "Acertou o placar exato";
            } else if (pWinner === realWinner) {
              pontos = 4;
              detalhe = "Acertou o vencedor";
            } else if (
              palpite.palpite_a === realB &&
              palpite.palpite_b === realA
            ) {
              pontos = 2;
              detalhe = "Acertou o placar invertido";
            } else if (
              Math.abs(palpite.palpite_a - palpite.palpite_b) ===
              Math.abs(realA - realB)
            ) {
              pontos = 1;
              detalhe = "Acertou o saldo de gols";
            }

            if (pontos > 0) {
              await supabase
                .from("palpites")
                .update({ pontos_ganhos: pontos, detalhe_pontuacao: detalhe })
                .eq("id", palpite.id);
              await supabase.rpc("increment_user_score", {
                user_id: palpite.usuario_id,
                score_to_add: pontos,
              });
            }
          }
        }
      }

      if (i < torneios.length - 1) {
        await delay(6000);
      }
    }

    return new Response(
      JSON.stringify({ message: "Sincronização concluída" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro no processamento:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
