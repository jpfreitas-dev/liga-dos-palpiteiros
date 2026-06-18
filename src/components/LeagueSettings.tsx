import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("torneios")
        .select("id, nome")
        .eq("ativo", true);
      setTorneios(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleTorneio = async (torneioId: string) => {
    if (selecionados.includes(torneioId)) {
      await supabase
        .from("liga_torneios")
        .delete()
        .eq("liga_id", ligaId)
        .eq("torneio_id", torneioId);
      setSelecionados((prev) => prev.filter((id) => id !== torneioId));
    } else {
      await supabase
        .from("liga_torneios")
        .insert({ liga_id: ligaId, torneio_id: torneioId });
      setSelecionados((prev) => [...prev, torneioId]);
    }
  };

  if (loading) return <div>Carregando torneios...</div>;

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
            />
            {t.nome}
          </label>
        ))}
      </div>

      <div className="modal-actions" style={{ marginTop: "2rem" }}>
        <button
          className="btn-primary"
          onClick={onFinish}
          disabled={selecionados.length === 0}
          style={{ width: "100%" }}
        >
          Finalizar Configuração
        </button>
      </div>
    </div>
  );
};
