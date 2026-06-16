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

  useEffect(() => {
    async function carregarDadosHeader() {
      const { data: usuario, error: errorUser } = await supabase
        .from("usuarios")
        .select("username, pontuacao_total")
        .eq("id", usuarioId)
        .single();

      if (errorUser || !usuario) return;

      const { count, error: errorRank } = await supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .gt("pontuacao_total", usuario.pontuacao_total);

      const posicaoAtual = errorRank ? 0 : (count || 0) + 1;

      setDadosUsuario({
        username: usuario.username,
        pontuacao: usuario.pontuacao_total,
        ranking: posicaoAtual,
      });
    }

    if (usuarioId) {
      carregarDadosHeader();
    }
  }, [usuarioId]);

  return (
    <header
      style={{ display: "flex", justifyContent: "flex-end", padding: "1rem 0" }}
    >
      <button
        onClick={() => onOpenProfile(usuarioId)}
        aria-label="Visualizar meu perfil completo"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "#ffffff",
          border: "0.0625rem solid #dfe1e6", // Equivalente a 1px
          borderRadius: "3rem",
          padding: "0.375rem 1rem 0.375rem 0.375rem",
          cursor: "pointer",
          boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.05)", // Sombra leve
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: "2.5rem", // Equivalente a 40px
            height: "2.5rem",
            borderRadius: "50%",
            backgroundColor: "#ebecf0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#5e6c84",
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
            style={{ fontWeight: "bold", fontSize: "1rem", color: "#172b4d" }}
          >
            {dadosUsuario.username}
          </span>
          <span style={{ fontSize: "0.875rem", color: "#5e6c84" }}>
            {dadosUsuario.pontuacao} pts • {dadosUsuario.ranking}º Lugar
          </span>
        </div>
      </button>
    </header>
  );
}
