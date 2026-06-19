import React, { useState, useEffect } from "react";
import "./MatchCard.css";

interface MatchCardProps {
  matchId: string;
  siglaA: string;
  siglaB: string;
  escudoA: string;
  escudoB: string;
  torneioNome: string;
  rodada: string;
  horario: string;
  initialPalpiteA?: number;
  initialPalpiteB?: number;
  isLocked?: boolean;
  isFinished?: boolean;
  placarRealA?: number;
  placarRealB?: number;
  pontosGanhos?: number;
  onSavePrediction?: (
    matchId: string,
    scoreA: number,
    scoreB: number,
  ) => Promise<void>;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  matchId,
  siglaA,
  siglaB,
  escudoA,
  escudoB,
  torneioNome,
  rodada,
  horario,
  initialPalpiteA,
  initialPalpiteB,
  isLocked = false,
  isFinished = false,
  placarRealA,
  placarRealB,
  pontosGanhos,
  onSavePrediction,
}) => {
  const [palpiteA, setPalpiteA] = useState(
    initialPalpiteA !== undefined ? initialPalpiteA.toString() : "",
  );
  const [palpiteB, setPalpiteB] = useState(
    initialPalpiteB !== undefined ? initialPalpiteB.toString() : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasInitialPrediction =
    initialPalpiteA !== undefined && initialPalpiteB !== undefined;

  useEffect(() => {
    if (initialPalpiteA !== undefined) setPalpiteA(initialPalpiteA.toString());
    if (initialPalpiteB !== undefined) setPalpiteB(initialPalpiteB.toString());
  }, [initialPalpiteA, initialPalpiteB]);

  const handleSaveClick = async () => {
    if (isLocked || !onSavePrediction) return;

    if (palpiteA !== "" && palpiteB !== "") {
      setIsSaving(true);
      await onSavePrediction(matchId, parseInt(palpiteA), parseInt(palpiteB));
      setIsSaving(false);
    }
  };

  // Desativa o botão se os campos estiverem vazios ou se estiver salvando
  const isButtonDisabled =
    isLocked || isSaving || palpiteA === "" || palpiteB === "";

  return (
    <article className={`match-card ${isLocked ? "locked" : ""}`}>
      <header className="match-header">
        <div className="match-context">
          <span className="tourney-name">{torneioNome}</span>
          <span className="tourney-round">{rodada}</span>
        </div>
        <span className="match-time">{horario}</span>
      </header>

      <div className="match-body">
        <div className="team-container">
          <div className="team-shield">
            {escudoA?.length > 4 ? <img src={escudoA} alt={siglaA} /> : escudoA}
          </div>
          <span className="team-sigla">{siglaA}</span>
        </div>

        <div className="score-area">
          <div className="score-container">
            <input
              type="number"
              min="0"
              value={palpiteA}
              onChange={(e) => setPalpiteA(e.target.value)}
              disabled={isLocked || isSaving}
              className="score-input"
              aria-label={`Palpite para ${siglaA}`}
            />
            <span className="versus-x">X</span>
            <input
              type="number"
              min="0"
              value={palpiteB}
              onChange={(e) => setPalpiteB(e.target.value)}
              disabled={isLocked || isSaving}
              className="score-input"
              aria-label={`Palpite para ${siglaB}`}
            />
          </div>

          {/* Botão de Salvar/Atualizar visível apenas se o jogo não estiver travado */}
          {!isLocked && onSavePrediction && (
            <button
              className={`btn-save-prediction ${hasInitialPrediction ? "btn-update" : ""}`}
              onClick={handleSaveClick}
              disabled={isButtonDisabled}
            >
              {isSaving
                ? "Salvando..."
                : hasInitialPrediction
                  ? "Atualizar"
                  : "Salvar"}
            </button>
          )}
        </div>

        <div className="team-container">
          <div className="team-shield">
            {escudoB?.length > 4 ? <img src={escudoB} alt={siglaB} /> : escudoB}
          </div>
          <span className="team-sigla">{siglaB}</span>
        </div>
      </div>

      {isFinished && (
        <footer className="match-footer-results">
          <span className="real-score-text">
            Placar Oficial: {placarRealA} x {placarRealB}
          </span>
          <span className="points-badge">+{pontosGanhos || 0} pts</span>
        </footer>
      )}
    </article>
  );
};
