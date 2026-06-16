import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import "./Auth.css";

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Cadastro: Enviando metadados para o trigger do Postgres
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            },
          },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Verifique seu e-mail para confirmar o cadastro!",
        });
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Liga dos Palpiteiros 2026</h1>
          <p>
            {isSignUp ? "Crie sua conta para começar" : "Acesse seus palpites"}
          </p>
        </header>

        <form onSubmit={handleAuth} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="username">Nome de Usuário</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Ex: artur_palpites"
                minLength={3}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {message && (
            <div role="alert" className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Processando..." : isSignUp ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <footer className="auth-footer">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="btn-link"
          >
            {isSignUp
              ? "Já tem uma conta? Entre aqui"
              : "Não tem conta? Cadastre-se"}
          </button>
        </footer>
      </section>
    </main>
  );
};
