export interface UserProfile {
  id: string;
  username: string;
  pontuacao_total: number;
  avatar_url?: string | null;
  status_message?: string | null;
}

export interface Tournament {
  id: string;
  nome: string;
  ano: number;
  ativo: boolean;
  codigo_api?: string;
}

export interface Prediction {
  id: string;
  usuario_id: string;
  partida_id: string;
  palpite_a: number;
  palpite_b: number;
  pontos_ganhos?: number;
  detalhe_pontuacao?: string | null;
  palpite_penaltis_a?: number | null;
  palpite_penaltis_b?: number | null;
}

export interface Match {
  id: string;
  torneio_id?: string;
  external_id?: number;
  time_a: string;
  time_b: string;
  data_inicio: string;
  placar_a: number | null;
  placar_b: number | null;
  status?: string;
  fase: string;
  grupo?: string | null;
  emblema_mandante: string | null;
  emblema_visitante: string | null;
  sigla_mandante?: string | null;
  sigla_visitante?: string | null;
  palpites?: Prediction[];
}
