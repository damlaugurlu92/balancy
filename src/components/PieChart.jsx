import { useState, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#d4a843", "#3dba8c", "#e0645c", "#7c6ff7",
  "#e8965a", "#4fc3f7", "#81c784", "#f06292",
  "#ffb74d", "#90a4ae", "#ce93d8",
];

export default function PieChart({ transactions, lang, t }) {
  const [view, setView] = useState("expense");

  const breakdown = useMemo(() => {
    const filtered = transactions.filter((tx) => tx.type === view);
    const total = filtered.reduce((s, tx) => s + tx.amount, 0);
    const map = {};
    filtered.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, view]);

  const chartData = {
    labels: breakdown.map((b) => t(`categories.${b.category}`, lang)),
    datasets: [
      {
        data: breakdown.map((b) => b.amount),
        backgroundColor: COLORS.slice(0, breakdown.length),
        borderColor: "#0e1118",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = breakdown[ctx.dataIndex];
            return ` ₺${item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (${item.percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="pie-section">
      <div className="pie-toggle">
        <button
          className={`toggle-btn ${view === "expense" ? "active active--expense" : ""}`}
          onClick={() => setView("expense")}
        >
          {t("expense", lang)}
        </button>
        <button
          className={`toggle-btn ${view === "income" ? "active active--income" : ""}`}
          onClick={() => setView("income")}
        >
          {t("income", lang)}
        </button>
      </div>

      {breakdown.length === 0 ? (
        <p className="no-tx">{t("noData", lang)}</p>
      ) : (
        <>
          <div className="pie-wrapper">
            <Doughnut data={chartData} options={options} />
          </div>
          <ul className="pie-legend">
            {breakdown.map((b, i) => (
              <li key={b.category} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i] }} />
                <span className="legend-cat">{t(`categories.${b.category}`, lang)}</span>
                <span className="legend-pct">{b.percentage}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
