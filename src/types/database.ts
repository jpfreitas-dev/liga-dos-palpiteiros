export interface Partida {
  id: string;
  torneio_id: string;
  external_id: number;
  time_a: string;
  time_b: string;
  sigla_mandante: string | null;
  sigla_visitante: string | null;
  emblema_mandante: string | null;
  emblema_visitante: string | null;
  data_inicio: string;
  fase: string;
  estagio: string;
  grupo: string | null;
  status: string;
  placar_a: number | null;
  placar_b: number | null;
}

export interface Palpite {
  id: string;
  usuario_id: string;
  partida_id: string;
  palpite_a: number;
  palpite_b: number;
  pontos_ganhos: number;
  detalhe_pontuacao: string | null;
  partidas?: Partida;
}
