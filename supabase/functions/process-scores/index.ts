import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // BUSCA TODO O TORNEIO (Removido o filtro ?date=${today})
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches",
      { headers: { "X-Auth-Token": Deno.env.get("API_FOOTBALL_KEY") ?? "" } },
    );

    if (response.status === 429) throw new Error("Limite da API excedido");
    const data = await response.json();

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
      // Países-sede
      Canada: "Canadá",
      "United States": "Estados Unidos",
      Mexico: "México",

      // CONMEBOL
      Argentina: "Argentina",
      Brazil: "Brasil",
      Ecuador: "Equador",
      Uruguay: "Uruguai",
      Colombia: "Colômbia",
      Paraguay: "Paraguai",

      // UEFA
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
      "Czech Republic": "República Tcheca",
      Sweden: "Suécia",
      Turkey: "Turquia",

      // CAF
      "South Africa": "África do Sul",
      Algeria: "Argélia",
      "Cape Verde": "Cabo Verde",
      "Ivory Coast": "Costa do Marfim",
      Egypt: "Egito",
      Ghana: "Gana",
      Morocco: "Marrocos",
      Senegal: "Senegal",
      Tunisia: "Tunísia",

      // AFC
      "Saudi Arabia": "Arábia Saudita",
      Australia: "Austrália",
      Qatar: "Catar",
      "South Korea": "Coreia do Sul",
      "United Arab Emirates": "Emirados Árabes Unidos",
      Iran: "Irã",
      Japan: "Japão",
      Uzbekistan: "Uzbequistão",

      // CONCACAF
      Curacao: "Curaçao",
      Haiti: "Haiti",
      Panama: "Panamá",

      // OFC
      "New Zealand": "Nova Zelândia",

      // Repescagem
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
      ALG: "ARG",
      CPV: "CBV",
      CIV: "CDM",
      EGY: "EGI",
      GHA: "GAN",
      MAR: "MAR",
      SEN: "SEN",
      TUN: "TUN",

      KSA: "ARA",
      AUS: "AUS",
      QAT: "CAT",
      KOR: "COR",
      UAE: "EAU",
      IRN: "IRA",
      JPN: "JAP",
      UZB: "UZB",

      CUW: "CUR",
      HAI: "HAI",
      PAN: "PAN",

      NZL: "NZL",

      IRQ: "IRQ",
      COD: "RDC",
    };

    for (const match of data.matches) {
      // Lógica de "A Definir"
      const isAdefinir = !match.homeTeam.name || !match.awayTeam.name;

      const partidaData = {
        torneio_id: "cafed0d3-9ed5-4e61-a429-9cd82ebda0c2",
        time_a: isAdefinir
          ? "A Definir"
          : traducaoTimes[match.homeTeam.name!] || match.homeTeam.name,
        time_b: isAdefinir
          ? "A Definir"
          : traducaoTimes[match.awayTeam.name!] || match.awayTeam.name,
        data_inicio: match.utcDate,
        fase: traducaoFase[match.stage] || match.stage,
        estagio: traducaoFase[match.stage] || match.stage,
        grupo: match.group ? traducaoGrupo[match.group] || match.group : null,
        emblema_mandante: isAdefinir ? null : match.homeTeam.crest,
        emblema_visitante: isAdefinir ? null : match.awayTeam.crest,
        sigla_mandante: isAdefinir
          ? null
          : traducaoSiglas[match.homeTeam.tla!] || match.homeTeam.tla,
        sigla_visitante: isAdefinir
          ? null
          : traducaoSiglas[match.awayTeam.tla!] || match.awayTeam.tla,
        status: match.status,
        placar_a: match.score.fullTime.home ?? null,
        placar_b: match.score.fullTime.away ?? null,
      };

      await supabase
        .from("partidas")
        .upsert(
          { external_id: match.id, ...partidaData },
          { onConflict: "external_id" },
        );

      if (match.status === "FINISHED") {
        const realA = match.score.fullTime.home ?? 0;
        const realB = match.score.fullTime.away ?? 0;
        const realWinner = realA > realB ? "A" : realB > realA ? "B" : "DRAW";

        const { data: palpites } = await supabase
          .from("palpites")
          .select("*, partidas!inner(external_id)")
          .eq("partidas.external_id", match.id)
          .eq("pontos_ganhos", 0);

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
          } else if (palpite.palpite_a - palpite.palpite_b === realA - realB) {
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

    return new Response(
      JSON.stringify({ message: "Sincronização concluída" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
