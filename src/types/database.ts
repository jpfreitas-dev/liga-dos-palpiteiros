export interface Partida {
  id: string;
  time_a: string;
  time_b: string;
  data_inicio: string;
  fase: "grupos" | "oitavas" | "quartas" | "semi" | "final";
  torneio_id: string;
}

export interface Palpite {
  id?: string;
  partida_id: string;
  usuario_id: string;
  palpite_a: number | "";
  palpite_b: number | "";
  vencedor_penaltis_palpite?: string | null;
}
