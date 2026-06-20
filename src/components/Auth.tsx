import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import "./Auth.css";

type AuthView = "login" | "signup" | "forgot_password" | "update_password";

// Dicionário universal de tradução de erros do Supabase
const translateAuthError = (message: string): string => {
  const msg = message.toLowerCase();

  if (msg.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (msg.includes("user already registered"))
    return "Este e-mail já está cadastrado.";
  if (msg.includes("email not confirmed"))
    return "Por favor, confirme seu e-mail antes de entrar.";
  if (msg.includes("password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("valid email"))
    return "Por favor, forneça um endereço de e-mail válido.";
  if (msg.includes("as senhas não coincidem"))
    return "As senhas não coincidem.";

  const rateLimitMatch = msg.match(/after (\d+) seconds/);
  if (rateLimitMatch) {
    return `Por segurança, aguarde ${rateLimitMatch[1]} segundos antes de tentar novamente.`;
  }

  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitas tentativas recentes. Tente novamente mais tarde.";
  }

  if (msg.includes("fetch") || msg.includes("network"))
    return "Erro de conexão. Verifique sua internet.";
  if (msg.includes("database error"))
    return "Erro interno do servidor. Tente novamente.";

  return "Ocorreu um erro inesperado durante a operação. Tente novamente.";
};

// Interface definindo que o componente aceita a propriedade isRecovering
interface AuthProps {
  isRecovering?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ isRecovering = false }) => {
  const [view, setView] = useState<AuthView>(
    isRecovering ? "update_password" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isRecovering) {
      setView("update_password");
      setError(null);
      setMessage("Link validado! Digite sua nova senha abaixo.");
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("update_password");
        setError(null);
        setMessage("Link validado! Digite sua nova senha abaixo.");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isRecovering]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else if (view === "signup") {
        // Verifica se as senhas coincidem antes de qualquer coisa
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem.");
        }

        // 1. Verifica se o username já existe na tabela 'usuarios'
        const { data: existingUser } = await supabase
          .from("usuarios")
          .select("username")
          .eq("username", username)
          .maybeSingle();

        if (existingUser) {
          throw new Error("Este nome de usuário já está em uso.");
        }

        // 2. Tenta o cadastro no Auth
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username }, // O trigger no banco deve copiar isso para a tabela 'usuarios'
          },
        });
        if (signUpError) throw signUpError;

        // 3. Sucesso: instruir a voltar para o login
        setMessage("Cadastro realizado com sucesso! Você já pode fazer login.");
      } else if (view === "forgot_password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth`,
          },
        );
        if (resetError) throw resetError;
        setMessage("Se o e-mail existir, um link de recuperação foi enviado.");
      } else if (view === "update_password") {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });
        if (updateError) throw updateError;

        await supabase.auth.signOut();
        alert("Senha atualizada com sucesso! Faça login com sua nova senha.");
        window.location.href = "/";
      }
    } catch (err: any) {
      if (
        err.message === "Este nome de usuário já está em uso." ||
        err.message === "As senhas não coincidem."
      ) {
        setError(err.message);
      } else {
        const translatedMessage = translateAuthError(err.message || "");
        setError(translatedMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getHeaderText = () => {
    if (view === "login") return "Entre para acessar suas ligas";
    if (view === "signup") return "Crie sua conta para começar";
    if (view === "forgot_password") return "Recuperação de Senha";
    if (view === "update_password") return "Criar nova senha";
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Ligas dos Palpiteiros</h1>
          <p>{getHeaderText()}</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="auth-success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          {view === "signup" && (
            <div className="form-group">
              <label htmlFor="username">Nome de Usuário</label>
              <input
                id="username"
                type="text"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Como você será visto no ranking"
                required
              />
            </div>
          )}

          {(view === "login" ||
            view === "signup" ||
            view === "forgot_password") && (
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          )}

          {(view === "login" ||
            view === "signup" ||
            view === "update_password") && (
            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password">
                  {view === "update_password" ? "Nova Senha" : "Senha"}
                </label>
                {view === "login" && (
                  <button
                    type="button"
                    className="btn-forgot-password"
                    onClick={() => {
                      setView("forgot_password");
                      setError(null);
                      setMessage(null);
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {view === "signup" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? "Aguarde..."
              : view === "login"
                ? "Entrar"
                : view === "signup"
                  ? "Cadastrar"
                  : view === "forgot_password"
                    ? "Enviar link de recuperação"
                    : "Salvar nova senha"}
          </button>
        </form>

        <div className="auth-toggle">
          {view === "login" && (
            <button
              type="button"
              className="btn-toggle"
              onClick={() => {
                setView("signup");
                setError(null);
                setMessage(null);
              }}
            >
              Não tem uma conta? Cadastre-se
            </button>
          )}
          {view === "signup" && (
            <button
              type="button"
              className="btn-toggle"
              onClick={() => {
                setView("login");
                setError(null);
                setMessage(null);
              }}
            >
              Já tem uma conta? Faça login
            </button>
          )}
          {(view === "forgot_password" || view === "update_password") && (
            <button
              type="button"
              className="btn-toggle"
              onClick={() => {
                setView("login");
                setError(null);
                setMessage(null);
              }}
            >
              Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
