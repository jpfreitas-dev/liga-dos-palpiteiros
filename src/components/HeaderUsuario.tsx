import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import type { UsuarioProfile } from "../types/database";
import "./HeaderUsuario.css";

interface HeaderUsuarioProps {
  usuarioId: string;
}

export const HeaderUsuario: React.FC<HeaderUsuarioProps> = ({ usuarioId }) => {
  const [perfil, setPerfil] = useState<UsuarioProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", usuarioId)
        .single();

      if (!error && data) {
        setPerfil(data as UsuarioProfile);
      }
      setIsLoading(false);
    };

    fetchPerfil();
  }, [usuarioId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <header className="header-usuario placeholder">Carregando...</header>
    );
  }

  return (
    <header className="header-usuario">
      <div className="perfil-info">
        <div className="avatar" aria-hidden="true">
          {perfil ? perfil.username.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <h1 className="saudacao">
            {perfil ? `Olá, ${perfil.username}` : "Perfil não encontrado"}
          </h1>
        </div>
      </div>

      <button
        className="btn-logout"
        onClick={() => logoutDialogRef.current?.showModal()}
        aria-label="Sair da conta"
      >
        Sair
      </button>

      <dialog ref={logoutDialogRef} className="logout-modal" aria-modal="true">
        <h3>Deseja realmente sair?</h3>
        <p>Você precisará fazer login novamente para acessar suas ligas.</p>
        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={() => logoutDialogRef.current?.close()}
          >
            Cancelar
          </button>
          <button className="btn-danger" onClick={handleLogout}>
            Sair da Conta
          </button>
        </div>
      </dialog>
    </header>
  );
};
