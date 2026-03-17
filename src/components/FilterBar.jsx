import { useState } from "react";

const FILTERS = [
  { key: "month",    labelTr: "Ay Seç",    labelEn: "By Month" },
  { key: "3months",  labelTr: "Son 3 Ay",  labelEn: "Last 3 Months" },
  { key: "6months",  labelTr: "Son 6 Ay",  labelEn: "Last 6 Months" },
  { key: "thisYear", labelTr: "Bu Yıl",    labelEn: "This Year" },
  { key: "all",      labelTr: "Tümü",      labelEn: "All Time" },
];

const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function FilterBar({ active, onChange, selectedMonth, onMonthChange, lang }) {
  const now = new Date();
  const [year, setYear]   = useState(selectedMonth?.year  ?? now.getFullYear());
  const [month, setMonth] = useState(selectedMonth?.month ?? now.getMonth());

  const months = lang === "tr" ? TR_MONTHS : EN_MONTHS;

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() });
  };

  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    // İlerideki aya gitmesin
    if (d > now) return;
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleFilterClick = (key) => {
    onChange(key);
    if (key === "month") {
      onMonthChange({ year, month });
    }
  };

  return (
    <div className="filter-bar">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          className={`filter-btn ${active === f.key ? "filter-btn--active" : ""}`}
          onClick={() => handleFilterClick(f.key)}
        >
          {lang === "tr" ? f.labelTr : f.labelEn}
        </button>
      ))}

      {active === "month" && (
        <div className="month-nav">
          <button className="month-arrow" onClick={prevMonth}>‹</button>
          <span className="month-label">{months[month]} {year}</span>
          <button
            className="month-arrow"
            onClick={nextMonth}
            disabled={new Date(year, month + 1, 1) > now}
          >›</button>
        </div>
      )}
    </div>
  );
}
