import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Trophy, CalendarDays } from "lucide-react";
import "./MainLayout.css";

export const MainLayout: React.FC = () => {
  return (
    <div className="layout-container">
      <nav className="main-nav">
        <div className="nav-brand">
          <h1>LDP</h1> {/* Logo ou sigla do app */}
        </div>

        <div className="nav-links">
          <NavLink
            to="/ligas"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Trophy size={24} />
            <span>Minhas Ligas</span>
          </NavLink>

          <NavLink
            to="/jogos"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <CalendarDays size={24} />
            <span>Todos os Jogos</span>
          </NavLink>
        </div>
      </nav>

      {/* Onde o conteúdo das rotas será renderizado */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
