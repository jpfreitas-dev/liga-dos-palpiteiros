import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação defensiva em tempo de desenvolvimento
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.",
  );
}

/**
 * Instância única do cliente Supabase.
 * Este cliente será utilizado para autenticação, consultas ao banco de dados
 * e chamadas de Edge Functions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Exemplo de uso em outros componentes:
 * import { supabase } from '../services/supabaseClient';
 */
