import React from "react";
import { MatchCard } from "./MatchCard";
import "./GlobalMatches.css";

export const GlobalMatches: React.FC = () => {
  // Dados simulados para testar a interface antes da integração com o banco
  const mockMatches = [
    {
      id: "1",
      timeA: "Brasil",
      timeB: "Argentina",
      escudoA: "BR",
      escudoB: "AR",
      torneioNome: "Copa do Mundo 2026",
      rodada: "Final",
      dataHora: "19/07/2026 • 16:00",
      ligasAfetadas: ["Firma do TI", "Amigos da Faculdade"],
    },
    {
      id: "2",
      timeA: "Flamengo",
      timeB: "Palmeiras",
      escudoA: "FLA",
      escudoB: "PAL",
      torneioNome: "Brasileirão",
      rodada: "Rodada 12",
      dataHora: "Hoje • 21:30",
      ligasAfetadas: ["Firma do TI", "Família Silva"],
    },
  ];

  return (
    <div className="global-matches-container">
      <header className="global-header">
        <h2>Painel Global de Jogos</h2>
        <p>
          Seus palpites aqui são aplicados automaticamente em todas as suas
          ligas.
        </p>
      </header>

      <div className="matches-grid">
        {mockMatches.map((match) => (
          <MatchCard
            key={match.id}
            matchId={match.id}
            timeA={match.timeA}
            timeB={match.timeB}
            escudoA={match.escudoA}
            escudoB={match.escudoB}
            torneioNome={match.torneioNome}
            rodada={match.rodada}
            dataHora={match.dataHora}
            ligasAfetadas={match.ligasAfetadas}
          />
        ))}
      </div>
    </div>
  );
};
