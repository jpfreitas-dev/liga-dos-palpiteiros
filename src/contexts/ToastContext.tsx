import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import "./ToastContext.css";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  // Força o container de notificações a entrar na Top Layer do navegador
  useEffect(() => {
    const el = containerRef.current as any; // Cast para any para evitar erros no TypeScript

    if (toasts.length > 0) {
      // Se houver notificações e o popover não estiver aberto, abre ele
      if (
        el &&
        typeof el.showPopover === "function" &&
        !el.matches(":popover-open")
      ) {
        el.showPopover();
      }
    } else {
      // Se a fila esvaziar, esconde o popover
      if (
        el &&
        typeof el.hidePopover === "function" &&
        el.matches(":popover-open")
      ) {
        el.hidePopover();
      }
    }
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* O atributo popover="manual" é a chave mágica aqui */}
      <div className="toast-container" popover="manual" ref={containerRef}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
};
