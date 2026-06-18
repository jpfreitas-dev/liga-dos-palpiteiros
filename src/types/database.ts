export interface UsuarioProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  status_message: string | null;
  created_at: string;
}

export interface Torneio {
  id: string;
  nome: string;
  ano: number;
  ativo: boolean;
  codigo_api: string;
  created_at: string;
}

export interface Partida {
  id: string;
  torneio_id: string;
  external_id: number | null;
  time_a: string;
  time_b: string;
  data_inicio: string;
  fase: string | null;
  grupo: string | null;
  placar_a: number | null;
  placar_b: number | null;
  status: string | null;
  emblema_mandante: string | null;
  emblema_visitante: string | null;
  sigla_mandante: string | null;
  sigla_visitante: string | null;
  created_at: string;
}

export interface Liga {
  id: string;
  nome: string;
  codigo_acesso: string;
  admin_id: string;
  created_at: string;
}

export interface MembroLiga {
  liga_id: string;
  usuario_id: string;
  joined_at: string;
}

export interface LigaTorneio {
  liga_id: string;
  torneio_id: string;
}

export interface Palpite {
  id: string;
  usuario_id: string;
  partida_id: string;
  palpite_a: number;
  palpite_b: number;
  pontos_ganhos: number | null;
  detalhe_pontuacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface RankingLigaData {
  usuario_id: string;
  username: string;
  total_pontos: number;
  total_palpites: number;
}
