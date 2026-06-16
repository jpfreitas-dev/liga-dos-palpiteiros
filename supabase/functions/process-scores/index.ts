import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaces estritas para a API football-data.org
interface Team {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface ScoreData {
  home: number | null;
  away: number | null;
}

interface MatchScore {
  winner: string | null;
  duration: string;
  fullTime: ScoreData;
  halfTime: ScoreData;
}

interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: MatchScore;
}

interface ApiResponse {
  matches: ApiMatch[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Iniciando consumo da API football-data.org...");

    const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: {
        "X-Auth-Token": Deno.env.get('API_FOOTBALL_KEY') ?? ''
      }
    });

    const data: ApiResponse = await response.json();

    for (const match of data.matches) {
      // 1. Mapeamento de Dados da Partida
      const partidaData = {
        time_a: match.homeTeam.name ?? 'A Definir',
        time_b: match.awayTeam.name ?? 'A Definir',
        data_inicio: match.utcDate,
        fase: match.stage,
        estagio: match.stage,
        grupo: match.group,
        emblema_mandante: match.homeTeam.crest,
        emblema_visitante: match.awayTeam.crest,
        sigla_mandante: match.homeTeam.tla,
        sigla_visitante: match.awayTeam.tla,
        status: match.status,
        placar_a: match.score.fullTime?.home ?? null,
        placar_b: match.score.fullTime?.away ?? null
      };

      // 2. Atualizar ou Inserir a Partida (Sync de Calendário)
      const { data: existingPartida } = await supabase
        .from('partidas')
        .select('id')
        .eq('external_id', match.id)
        .single();

      if (existingPartida) {
        await supabase.from('partidas').update(partidaData).eq('id', existingPartida.id);
      } else {
        await supabase.from('partidas').insert({ ...partidaData, external_id: match.id });
      }

      console.log(`Partida sincronizada: ${partidaData.time_a} vs ${partidaData.time_b} | Status: ${match.status}`);

      // 3. Processamento de Palpites (Apenas para jogos finalizados)
      if (match.status === 'FINISHED') {
        const realA = match.score.fullTime.home ?? 0;
        const realB = match.score.fullTime.away ?? 0;
        const realWinner = realA > realB ? 'A' : realB > realA ? 'B' : 'DRAW';

        const { data: palpites, error: pError } = await supabase
          .from('palpites')
          .select('*, partidas!inner(time_a, time_b, fase)')
          .eq('partidas.external_id', match.id)
          .eq('pontos_ganhos', 0);

        if (pError || !palpites) continue;

        for (const palpite of palpites) {
          let pontos = 0;
          let detalhe = "Errou o palpite";
          const pA = palpite.palpite_a;
          const pB = palpite.palpite_b;
          const palpiteWinner = pA > pB ? 'A' : pB > pA ? 'B' : 'DRAW';

          if (pA === realA && pB === realB) {
            pontos = 7;
            detalhe = "Acertou o placar exato";
          } else if (palpiteWinner === realWinner) {
            pontos = 4;
            detalhe = "Acertou o vencedor";
          } else if (pA === realB && pB === realA && pA !== pB) {
            pontos = 2;
            detalhe = "Acertou o placar invertido";
          } else if ((pA - pB) === (realA - realB)) {
            pontos = 1;
            detalhe = "Acertou o saldo de gols";
          }

          if (pontos > 0) {
            await supabase
              .from('palpites')
              .update({ pontos_ganhos: pontos, detalhe_pontuacao: detalhe })
              .eq('id', palpite.id);

            await supabase.rpc('increment_user_score', { 
              user_id: palpite.usuario_id, 
              score_to_add: pontos 
            });
            
            console.log(`Usuário ${palpite.usuario_id} ganhou ${pontos} pontos. Motivo: ${detalhe}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: "Sincronização e Processamento concluídos" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});