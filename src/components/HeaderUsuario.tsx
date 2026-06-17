import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

interface HeaderProps {
  usuarioId: string;
  onOpenProfile: (id: string) => void;
}

export function HeaderUsuario({ usuarioId, onOpenProfile }: HeaderProps) {
  const [dadosUsuario, setDadosUsuario] = useState({
    username: "Carregando...",
    pontuacao: 0,
    ranking: 0,
  });

  async function carregarDadosHeader() {
    if (!usuarioId) return;

    // 1. Busca dados do usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("username, pontuacao_total")
      .eq("id", usuarioId)
      .single();

    if (!usuario) return;

    // 2. Busca posição no ranking
    const { count } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .gt("pontuacao_total", usuario.pontuacao_total);

    setDadosUsuario({
      username: usuario.username,
      pontuacao: usuario.pontuacao_total,
      ranking: (count || 0) + 1,
    });
  }

  useEffect(() => {
    // Carrega inicial
    carregarDadosHeader();

    // Configuração do Realtime: Escuta alterações na tabela de usuários
    const channel = supabase
      .channel("header_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "usuarios",
          filter: `id=eq.${usuarioId}`, // Só atualiza se for o MEU usuário
        },
        () => {
          carregarDadosHeader();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioId]);

  return (
    <header
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 50,
      }}
    >
      <button
        onClick={() => onOpenProfile(usuarioId)}
        aria-label="Visualizar meu perfil completo"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "var(--surface)",
          border: "0.0625rem solid #333333",
          borderRadius: "3rem",
          padding: "0.375rem 1rem 0.375rem 0.375rem",
          cursor: "pointer",
          boxShadow: "var(--shadow)",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            backgroundColor: "#333333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-main)",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {dadosUsuario.username !== "Carregando..."
            ? dadosUsuario.username.charAt(0).toUpperCase()
            : ""}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1rem",
              color: "var(--text-main)",
            }}
          >
            {dadosUsuario.username}
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {dadosUsuario.pontuacao} pts • {dadosUsuario.ranking}º Lugar
          </span>
        </div>
      </button>
    </header>
  );
}
