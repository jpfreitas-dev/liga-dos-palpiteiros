import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import type { Liga } from "../types/database";
import { LeagueSettings } from "./LeagueSettings";
import { useToast } from "../contexts/ToastContext";
import "./LeagueManager.css";

export const LeagueManager: React.FC<{
  userId: string;
  onSelectLeague: (id: string) => void;
}> = ({ userId, onSelectLeague }) => {
  const [myLeagues, setMyLeagues] = useState<Liga[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos formulários
  const [joinCode, setJoinCode] = useState("");
  const [newLeagueName, setNewLeagueName] = useState("");
  const [exitCode, setExitCode] = useState("");

  const joinDialogRef = useRef<HTMLDialogElement>(null);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const exitDialogRef = useRef<HTMLDialogElement>(null);

  const { addToast } = useToast();

  const fetchMyLeagues = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("membros_liga")
      .select("ligas (*)")
      .eq("usuario_id", userId);

    if (error) {
      addToast("Erro ao carregar suas ligas.", "error");
    } else if (data) {
      setMyLeagues(data.map((item: any) => item.ligas));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyLeagues();
  }, [userId]);

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();

    // Busca a liga pelo código
    const { data: league, error: searchError } = await supabase
      .from("ligas")
      .select("id")
      .eq("codigo_acesso", joinCode)
      .single();

    if (searchError || !league) {
      addToast("Código inválido ou liga não encontrada.", "error");
      return;
    }

    // Verifica se já é membro para não duplicar
    const { data: existingMember } = await supabase
      .from("membros_liga")
      .select("id")
      .eq("liga_id", league.id)
      .eq("usuario_id", userId)
      .single();

    if (existingMember) {
      addToast("Você já participa desta liga.", "info");
      return;
    }

    // Insere o usuário na liga
    const { error: joinError } = await supabase
      .from("membros_liga")
      .insert({ liga_id: league.id, usuario_id: userId });

    if (joinError) {
      addToast("Erro ao entrar na liga.", "error");
    } else {
      addToast("Você entrou na liga com sucesso!", "success");
      joinDialogRef.current?.close();
      setJoinCode("");
      fetchMyLeagues();
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newLeague, error: createError } = await supabase
      .from("ligas")
      .insert({
        nome: newLeagueName,
        codigo_acesso: accessCode,
        admin_id: userId,
      })
      .select()
      .single();

    if (createError || !newLeague) {
      addToast("Erro ao criar a liga. Tente novamente.", "error");
      return;
    }

    const { error: memberError } = await supabase
      .from("membros_liga")
      .insert({ liga_id: newLeague.id, usuario_id: userId });

    if (memberError) {
      addToast("Erro ao vincular você à nova liga.", "error");
    } else {
      addToast("Liga criada com sucesso!", "success");
      createDialogRef.current?.close();
      setNewLeagueName("");
      fetchMyLeagues();

      // Abre o modal de configurações da liga recém-criada
      setSelectedLeagueId(newLeague.id);
      settingsDialogRef.current?.showModal();
    }
  };

  const handleExitLeague = async () => {
    if (!selectedLeagueId) return;

    const { error } = await supabase
      .from("membros_liga")
      .delete()
      .eq("liga_id", selectedLeagueId)
      .eq("usuario_id", userId);

    if (error) {
      addToast("Erro ao tentar sair da liga.", "error");
    } else {
      addToast("Você saiu da liga.", "info");
      exitDialogRef.current?.close();
      setExitCode("");
      fetchMyLeagues();
    }
  };

  // Trava o fechamento dos modais pela tecla ESC
  const handlePreventClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const selectedLeagueData = myLeagues.find((l) => l.id === selectedLeagueId);

  return (
    <div className="league-manager">
      <header className="league-header">
        <h2>Minhas Ligas</h2>
        <div className="league-actions">
          <button
            className="btn-secondary"
            onClick={() => joinDialogRef.current?.showModal()}
          >
            Entrar com Código
          </button>
          <button
            className="btn-primary"
            onClick={() => createDialogRef.current?.showModal()}
          >
            Criar Nova Liga
          </button>
        </div>
      </header>

      {/* Estado de Carregamento */}
      {isLoading ? (
        <div className="empty-state">
          <p>Carregando suas ligas...</p>
        </div>
      ) : myLeagues.length === 0 ? (
        <div className="empty-state">
          <h3>Você ainda não possui ligas</h3>
          <p>
            Crie uma nova liga para convidar seus amigos ou entre em uma
            existente usando um código de acesso.
          </p>
        </div>
      ) : (
        <div className="league-grid">
          {myLeagues.map((league) => (
            <article key={league.id} className="league-card">
              <header className="card-header">
                <h3>{league.nome}</h3>
                {league.admin_id === userId && (
                  <span className="admin-badge">Admin</span>
                )}
              </header>
              <p className="league-code-text">
                Código: <strong>{league.codigo_acesso}</strong>
              </p>

              {/* Rodapé com botões isolados para melhor Acessibilidade */}
              <div className="card-actions">
                <button
                  className="btn-exit-league"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLeagueId(league.id);
                    setExitCode("");
                    exitDialogRef.current?.showModal();
                  }}
                  aria-label={`Sair da liga ${league.nome}`}
                >
                  Sair
                </button>
                <button
                  className="btn-access-league"
                  onClick={() => onSelectLeague(league.id)}
                  aria-label={`Acessar liga ${league.nome}`}
                >
                  Acessar Liga
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Entrar */}
      <dialog
        ref={joinDialogRef}
        className="league-modal"
        onCancel={handlePreventClose}
      >
        <h3>Entrar em uma Liga</h3>
        <form onSubmit={handleJoinLeague}>
          <input
            type="text"
            placeholder="Código"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
            autoFocus
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                joinDialogRef.current?.close();
                setJoinCode("");
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Entrar
            </button>
          </div>
        </form>
      </dialog>

      {/* Modal Criar */}
      <dialog
        ref={createDialogRef}
        className="league-modal"
        onCancel={handlePreventClose}
      >
        <h3>Criar Nova Liga</h3>
        <form onSubmit={handleCreateLeague}>
          <input
            type="text"
            placeholder="Nome da Liga"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            required
            autoFocus
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                createDialogRef.current?.close();
                setNewLeagueName("");
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      </dialog>

      {/* Modal Configurar (Apenas Torneios, não pode ser fechado acidentalmente) */}
      <dialog
        ref={settingsDialogRef}
        className="league-modal"
        onCancel={handlePreventClose}
      >
        {selectedLeagueId && (
          <LeagueSettings
            ligaId={selectedLeagueId}
            onFinish={() => settingsDialogRef.current?.close()}
          />
        )}
      </dialog>

      {/* Modal Sair */}
      <dialog
        ref={exitDialogRef}
        className="league-modal"
        onCancel={handlePreventClose}
      >
        <h3>Sair da Liga</h3>
        <p>
          Para sair, digite o código{" "}
          <strong>{selectedLeagueData?.codigo_acesso}</strong> no campo abaixo:
        </p>
        <input
          type="text"
          value={exitCode}
          onChange={(e) => setExitCode(e.target.value)}
          placeholder="Digite o código exato"
          autoFocus
        />
        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={() => {
              exitDialogRef.current?.close();
              setExitCode("");
            }}
          >
            Cancelar
          </button>
          <button
            className="btn-card-danger"
            onClick={handleExitLeague}
            disabled={exitCode !== selectedLeagueData?.codigo_acesso}
          >
            Confirmar
          </button>
        </div>
      </dialog>
    </div>
  );
};
