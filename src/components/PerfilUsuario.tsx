import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface PalpiteHistorico {
  id: string;
  pontos_ganhos: number;
  detalhe_pontuacao: string;
  partidas: {
    sigla_mandante: string;
    sigla_visitante: string;
    placar_a: number;
    placar_b: number;
    fase: string;
  };
}

export function PerfilUsuario({ usuarioId, onClose }: { usuarioId: string; onClose: () => void }) {
  const [perfil, setPerfil] = useState({ username: '', pontuacao: 0 });
  const [historico, setHistorico] = useState<PalpiteHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosPerfil() {
      setLoading(true);
      const { data: usuario } = await supabase.from('usuarios').select('username, pontuacao_total').eq('id', usuarioId).single();
      const { data: palpites } = await supabase.from('palpites').select(`id, pontos_ganhos, detalhe_pontuacao, partidas(sigla_mandante, sigla_visitante, placar_a, placar_b, fase)`).eq('usuario_id', usuarioId).not('detalhe_pontuacao', 'is', null).order('created_at', { ascending: false });

      if (usuario) setPerfil({ username: usuario.username, pontuacao: usuario.pontuacao_total });
      if (palpites) setHistorico(palpites as unknown as PalpiteHistorico[]);
      setLoading(false);
    }
    carregarDadosPerfil();
  }, [usuarioId]);

  const getCorPontuacao = (pontos: number) => {
    if (pontos === 7) return '#d4edda';
    if (pontos === 4) return '#fff3cd';
    if (pontos >= 1) return '#cce5ff';
    return '#f8d7da';
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '0.5rem' }}>
      <button onClick={onClose} style={{ marginBottom: '1rem', cursor: 'pointer' }}>← Voltar</button>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>{perfil.username}</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{perfil.pontuacao} Pontos</p>
      </div>
      <h3>Histórico</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {historico.map((h) => (
          <div key={h.id} style={{ padding: '0.75rem', borderRadius: '0.25rem', background: getCorPontuacao(h.pontos_ganhos), display: 'flex', justifyContent: 'space-between' }}>
            <span>{h.partidas.sigla_mandante} vs {h.partidas.sigla_visitante}</span>
            <span style={{ fontWeight: 'bold' }}>{h.pontos_ganhos} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}