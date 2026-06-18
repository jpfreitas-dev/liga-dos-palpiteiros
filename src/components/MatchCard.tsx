import React, { useState } from "react";
import "./MatchCard.css";

interface MatchCardProps {
  matchId: string;
  timeA: string;
  timeB: string;
  escudoA: string;
  escudoB: string;
  torneioNome: string;
  rodada: string;
  dataHora: string;
  ligasAfetadas: string[]; // Nomes das ligas onde este jogo vale pontos
}

export const MatchCard: React.FC<MatchCardProps> = ({
  timeA,
  timeB,
  escudoA,
  escudoB,
  torneioNome,
  rodada,
  dataHora,
  ligasAfetadas,
}) => {
  const [palpiteA, setPalpiteA] = useState("");
  const [palpiteB, setPalpiteB] = useState("");

  return (
    <article className="match-card">
      <header className="match-header">
        <div className="match-tags">
          <span className="tag-tournament">{torneioNome}</span>
          <span className="tag-round">{rodada}</span>
        </div>
        <span className="match-time">{dataHora}</span>
      </header>

      <div className="match-teams">
        <div className="team">
          <span className="team-name">{timeA}</span>
          <div className="team-shield">{escudoA}</div>
        </div>

        <div className="match-inputs">
          <input
            type="number"
            min="0"
            value={palpiteA}
            onChange={(e) => setPalpiteA(e.target.value)}
            className="input-score"
          />
          <span className="versus">X</span>
          <input
            type="number"
            min="0"
            value={palpiteB}
            onChange={(e) => setPalpiteB(e.target.value)}
            className="input-score"
          />
        </div>

        <div className="team">
          <div className="team-shield">{escudoB}</div>
          <span className="team-name">{timeB}</span>
        </div>
      </div>

      {ligasAfetadas.length > 0 && (
        <footer className="match-footer">
          <span className="footer-label">Válido para:</span>
          <div className="league-badges">
            {ligasAfetadas.map((liga, index) => (
              <span key={index} className="badge-league">
                {liga}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
};
