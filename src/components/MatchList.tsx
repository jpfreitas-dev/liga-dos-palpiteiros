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
  initialPalpiteA?: number | null;
  initialPalpiteB?: number | null;
  isLocked: boolean;
  isFinished: boolean;
  placarRealA?: number | null;
  placarRealB?: number | null;
  pontosGanhos?: number | null;
  onSavePrediction: (
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
  isLocked,
  isFinished,
  placarRealA,
  placarRealB,
  pontosGanhos,
  onSavePrediction,
}) => {
  const [valA, setValA] = useState<string>(initialPalpiteA?.toString() || "");
  const [valB, setValB] = useState<string>(initialPalpiteB?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValA(initialPalpiteA?.toString() || "");
    setValB(initialPalpiteB?.toString() || "");
  }, [initialPalpiteA, initialPalpiteB]);

  const handleSave = async () => {
    const numA = parseInt(valA, 10);
    const numB = parseInt(valB, 10);
    if (isNaN(numA) || isNaN(numB)) return;

    setIsSaving(true);
    await onSavePrediction(matchId, numA, numB);
    setIsSaving(false);
  };

  const hasPalpite = initialPalpiteA !== undefined && initialPalpiteA !== null;

  return (
    <div className={`match-card-box ${isFinished ? "match-finished" : ""}`}>
      <div className="match-card-meta">
        <span className="tournament-tag">{torneioNome}</span>
        <span className="phase-tag">{rodada}</span>
      </div>

      <div className="match-card-teams-row">
        {/* Time Mandante */}
        <div className="team-column mandante">
          <div className="team-emblem-container">
            {escudoA && escudoA.startsWith("http") ? (
              <img src={escudoA} alt={siglaA} className="team-emblem-img" />
            ) : (
              <div className="team-emblem-fallback">
                {siglaA.substring(0, 2)}
              </div>
            )}
          </div>
          <span className="team-sigla">{siglaA}</span>
        </div>

        {/* Bloco Central de Placar e Palpites */}
        <div className="match-core-center">
          {isFinished ? (
            <div className="real-result-display">
              <span className="real-score">{placarRealA}</span>
              <span className="score-divider">x</span>
              <span className="real-score">{placarRealB}</span>
            </div>
          ) : (
            <div className="time-display">{horario}</div>
          )}

          <div className="prediction-inputs-row">
            <input
              type="number"
              min="0"
              disabled={isLocked || isFinished}
              value={valA}
              onChange={(e) => setValA(e.target.value)}
              className="prediction-field"
            />
            <span className="vs-text">x</span>
            <input
              type="number"
              min="0"
              disabled={isLocked || isFinished}
              value={valB}
              onChange={(e) => setValB(e.target.value)}
              className="prediction-field"
            />
          </div>

          {!isLocked && !isFinished && (
            <button
              onClick={handleSave}
              disabled={isSaving || valA === "" || valB === ""}
              className="save-prediction-btn"
            >
              {isSaving ? "..." : "Salvar"}
            </button>
          )}
        </div>

        {/* Time Visitante */}
        <div className="team-column visitante">
          <div className="team-emblem-container">
            {escudoB && escudoB.startsWith("http") ? (
              <img src={escudoB} alt={siglaB} className="team-emblem-img" />
            ) : (
              <div className="team-emblem-fallback">
                {siglaB.substring(0, 2)}
              </div>
            )}
          </div>
          <span className="team-sigla">{siglaB}</span>
        </div>
      </div>

      {hasPalpite && pontosGanhos !== undefined && pontosGanhos !== null && (
        <div className={`points-badge-footer points-${pontosGanhos}`}>
          +{pontosGanhos}{" "}
          {pontosGanhos === 1 ? "ponto obtido" : "pontos obtidos"}
        </div>
      )}
    </div>
  );
};
