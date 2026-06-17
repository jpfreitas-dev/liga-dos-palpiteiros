import "./FilterBar.css";

export function FilterBar({
  onDaysChange,
}: {
  onDaysChange: (d: number) => void;
}) {
  return (
    <div className="filter-container">
      <select
        onChange={(e) => onDaysChange(Number(e.target.value))}
        className="filter-select"
      >
        <option value={999}>Ranking Geral</option>
        <option value={30}>Últimos 30 dias</option>
        <option value={7}>Últimos 7 dias</option>
      </select>
    </div>
  );
}
