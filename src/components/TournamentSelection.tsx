import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import type { Tournament } from "../types/database";

interface Props {
  onSelect: (id: string) => void;
  onLogout: () => void;
}

export function TournamentSelection({ onSelect, onLogout }: Props) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      const { data, error } = await supabase
        .from("torneios")
        .select("*")
        .eq("ativo", true)
        .order("ano", { ascending: false });

      if (!error && data) {
        setTournaments(data);
      }
      setIsLoading(false);
    }
    fetchTournaments();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", color: "var(--text-main)" }}>
          Torneios
        </h1>
        <button
          onClick={onLogout}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            backgroundColor: "var(--error)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            fontWeight: "bold",
          }}
        >
          Sair
        </button>
      </header>

      {isLoading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Carregando torneios...
        </p>
      ) : tournaments.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Nenhum torneio ativo no momento.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              onClick={() => onSelect(tournament.id)}
              style={{
                padding: "1.5rem",
                backgroundColor: "var(--surface)",
                border: "0.0625rem solid #333333",
                borderRadius: "var(--radius)",
                color: "var(--text-main)",
                fontSize: "1.25rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "var(--primary)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "#333333")
              }
            >
              <span>{tournament.nome}</span>
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
                {tournament.ano}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
