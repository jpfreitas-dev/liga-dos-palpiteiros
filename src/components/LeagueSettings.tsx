import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useToast } from "../contexts/ToastContext";
import "./LeagueSettings.css";

interface Tournament {
  id: string;
  nome: string;
}

interface LeagueSettingsProps {
  ligaId: string;
  onFinish: () => void;
}

export const LeagueSettings: React.FC<LeagueSettingsProps> = ({
  ligaId,
  onFinish,
}) => {
  const [torneios, setTorneios] = useState<Tournament[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const fetchTorneios = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("torneios")
        .select("id, nome")
        .eq("ativo", true);

      if (error) {
        addToast("Erro ao carregar a lista de torneios.", "error");
      } else {
        setTorneios(data || []);
      }
      setIsLoading(false);
    };

    fetchTorneios();
  }, [addToast]);

  const toggleTorneio = (torneioId: string) => {
    setSelecionados((prev) => {
      if (prev.includes(torneioId)) {
        return prev.filter((id) => id !== torneioId);
      }
      return [...prev, torneioId];
    });
  };

  const handleFinalize = async () => {
    if (selecionados.length === 0) return;

    setIsSaving(true);

    // Prepara o array de objetos para inserção em lote (Bulk Insert)
    const insercoes = selecionados.map((torneioId) => ({
      liga_id: ligaId,
      torneio_id: torneioId,
    }));

    const { error } = await supabase.from("liga_torneios").insert(insercoes);

    setIsSaving(false);

    if (error) {
      addToast("Erro ao salvar os torneios vinculados.", "error");
    } else {
      addToast("Liga criada com sucesso!", "success");
      onFinish(); // Fecha o modal e conclui a criação da liga
    }
  };

  if (isLoading) {
    return (
      <div
        className="settings-container"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <p style={{ color: "var(--text-muted)" }}>
          Carregando torneios disponíveis...
        </p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h3>Torneios da Liga</h3>
      <p>
        Selecione os torneios que farão parte desta liga.{" "}
        <strong>Atenção: Esta ação não poderá ser desfeita depois.</strong>
      </p>

      <div className="torneios-list">
        {torneios.map((t) => (
          <label
            key={t.id}
            className={`torneio-item ${selecionados.includes(t.id) ? "active" : ""}`}
          >
            <input
              type="checkbox"
              checked={selecionados.includes(t.id)}
              onChange={() => toggleTorneio(t.id)}
              disabled={isSaving}
            />
            {t.nome}
          </label>
        ))}
      </div>

      <div className="modal-actions" style={{ marginTop: "2rem" }}>
        <button
          className="btn-primary"
          onClick={handleFinalize}
          disabled={selecionados.length === 0 || isSaving}
          style={{ width: "100%" }}
        >
          {isSaving ? "Salvando..." : "Finalizar Configuração"}
        </button>
      </div>
    </div>
  );
};
