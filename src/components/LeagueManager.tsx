import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import type { Liga } from "../types/database";
import "./LeagueManager.css";

interface LeagueManagerProps {
  userId: string;
  onSelectLeague: (leagueId: string) => void;
}

export const LeagueManager: React.FC<LeagueManagerProps> = ({
  userId,
  onSelectLeague,
}) => {
  const [myLeagues, setMyLeagues] = useState<Liga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [newLeagueName, setNewLeagueName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Estados para exclusão de liga
  const [leagueToExit, setLeagueToExit] = useState<Liga | null>(null);
  const [exitCode, setExitCode] = useState("");

  const joinDialogRef = useRef<HTMLDialogElement>(null);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const exitDialogRef = useRef<HTMLDialogElement>(null);

  const fetchMyLeagues = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("membros_liga")
      .select("ligas (*)")
      .eq("usuario_id", userId);

    if (!error && data) {
      const leagues = data.map((item: any) => item.ligas as Liga);
      setMyLeagues(leagues);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyLeagues();
  }, [userId]);

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: league, error: searchError } = await supabase
        .from("ligas")
        .select("id")
        .eq("codigo_acesso", joinCode.toUpperCase())
        .single();

      if (searchError || !league) throw new Error("Liga não encontrada.");

      const { error: joinError } = await supabase
        .from("membros_liga")
        .insert({ liga_id: league.id, usuario_id: userId });

      if (joinError) throw joinError;

      setJoinCode("");
      joinDialogRef.current?.close();
      fetchMyLeagues();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const { data: newLeague, error: createError } = await supabase
        .from("ligas")
        .insert({
          nome: newLeagueName,
          codigo_acesso: accessCode,
          admin_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await supabase
        .from("membros_liga")
        .insert({ liga_id: newLeague.id, usuario_id: userId });

      setNewLeagueName("");
      createDialogRef.current?.close();
      fetchMyLeagues();
    } catch (err: any) {
      setErrorMessage("Erro ao criar liga.");
    }
  };

  const handleExitLeague = async () => {
    if (!leagueToExit) return;

    const { error } = await supabase
      .from("membros_liga")
      .delete()
      .eq("liga_id", leagueToExit.id)
      .eq("usuario_id", userId);

    if (!error) {
      exitDialogRef.current?.close();
      setExitCode("");
      setLeagueToExit(null);
      fetchMyLeagues();
    }
  };

  if (isLoading) return <div className="loading-state">Carregando...</div>;

  return (
    <div className="league-manager">
      <header className="league-header">
        <h2>Minhas Ligas</h2>
        <div className="league-actions">
          <button
            className="btn-secondary"
            onClick={() => joinDialogRef.current?.showModal()}
          >
            Entrar
          </button>
          <button
            className="btn-primary"
            onClick={() => createDialogRef.current?.showModal()}
          >
            Criar
          </button>
        </div>
      </header>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="league-grid">
        {myLeagues.map((league) => (
          <div
            key={league.id}
            className="league-card"
            onClick={() => onSelectLeague(league.id)}
          >
            <h3>{league.nome}</h3>
            <p>
              Código: <strong>{league.codigo_acesso}</strong>
            </p>
            {league.admin_id === userId && (
              <span className="admin-badge">Admin</span>
            )}

            <button
              className="btn-exit-league"
              onClick={(e) => {
                e.stopPropagation();
                setLeagueToExit(league);
                exitDialogRef.current?.showModal();
              }}
            >
              Sair da Liga
            </button>
          </div>
        ))}
      </div>

      <dialog ref={joinDialogRef} className="league-modal">
        <h3>Entrar em uma Liga</h3>
        <form onSubmit={handleJoinLeague}>
          <input
            type="text"
            placeholder="Código da Liga"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => joinDialogRef.current?.close()}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Entrar
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={createDialogRef} className="league-modal">
        <h3>Criar Nova Liga</h3>
        <form onSubmit={handleCreateLeague}>
          <input
            type="text"
            placeholder="Nome da Liga (ex: Copa da Família)"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            required
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => createDialogRef.current?.close()}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={exitDialogRef} className="league-modal confirm-modal">
        <h3>Confirmar Saída</h3>
        <p>
          Esta ação é irreversível. Digite{" "}
          <strong>{leagueToExit?.codigo_acesso}</strong> para confirmar.
        </p>
        <input
          className="confirm-input"
          value={exitCode}
          onChange={(e) => setExitCode(e.target.value)}
        />
        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={() => exitDialogRef.current?.close()}
          >
            Cancelar
          </button>
          <button
            className="btn-danger"
            disabled={exitCode !== leagueToExit?.codigo_acesso}
            onClick={handleExitLeague}
          >
            Confirmar Saída
          </button>
        </div>
      </dialog>

      {/* Manter aqui os outros modais (Join e Create) conforme estruturamos antes */}
    </div>
  );
};
