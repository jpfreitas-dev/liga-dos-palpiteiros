import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import "./DateNavigator.css";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    onDateChange(newDate);
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }

    return date
      .toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })
      .replace("-feira", "");
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Evita problemas de fuso horário convertendo a string de data pura
      const [year, month, day] = e.target.value.split("-").map(Number);
      onDateChange(new Date(year, month - 1, day));
    }
  };

  // Variável auxiliar estática para o cálculo de ontem
  const yesterday = new Date();

  return (
    <div className="date-navigator">
      <button
        className="nav-date-btn"
        onClick={handlePreviousDay}
        aria-label="Dia anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="center-date-selector">
        <span className="display-date-text">
          {formatDisplayDate(selectedDate)}
        </span>
        <label className="calendar-picker-wrapper">
          <Calendar size={18} className="calendar-icon" />
          <input
            type="date"
            className="hidden-date-input"
            onChange={handleCalendarChange}
            value={selectedDate.toISOString().split("T")[0]}
          />
        </label>
      </div>

      <button
        className="nav-date-btn"
        onClick={handleNextDay}
        aria-label="Próximo dia"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
